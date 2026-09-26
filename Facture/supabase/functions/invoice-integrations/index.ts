// Supabase Edge Function. Les clés privées restent dans les secrets serveur.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const env = (name: string) => Deno.env.get(name) || '';
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':env('APP_ORIGIN'),'Vary':'Origin'}});
const cents = (value:number) => Math.round((value+Number.EPSILON)*100);
async function external(url:string, options:RequestInit) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(25000)});
  const data=await response.json();
  if(!response.ok || data.success===false) throw Error(`Le fournisseur a refusé la demande (${response.status}). Vérifiez ses journaux et les données du document.`);
  return data;
}
Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response(null,{headers:{'Access-Control-Allow-Origin':env('APP_ORIGIN'),'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST','Vary':'Origin'}});
  if(req.method!=='POST') return reply({error:'Méthode non autorisée'},405);
  let job: {document_id:string;action:string}|null=null;
  const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'));
  try {
    const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
    if(!token) return reply({error:'Connexion requise'},401);
    const {data:auth,error:authError}=await admin.auth.getUser(token);
    if(authError || !auth.user) return reply({error:'Session invalide'},401);
    const uid=auth.user.id;
    const {action,documentId}=await req.json();
    if(action!=='peppol-test' || !/^[a-f0-9-]{36}$/i.test(documentId)) return reply({error:'Demande invalide'},400);
    const {data:d,error}=await admin.from('documents').select('*').eq('id',documentId).eq('user_id',uid).single();
    if(error || !d || d.type!=='facture') return reply({error:'Facture introuvable'},404);
    const cached=d.peppol;
    if(cached) return reply({peppol:cached});
    // Identifiants Peppol de test propres à chaque utilisateur.
    const configs=JSON.parse(env('INTEGRATION_ACCOUNTS') || '{}');
    const config=configs[uid];
    if(!config) return reply({error:'Aucun compte fournisseur configuré pour votre utilisateur.'},409);
    if(action==='peppol-test' && (!config.recommandKey || !config.recommandSecret || !config.testCompanyId || config.peppolEnvironment!=='test')) return reply({error:'Configurez une entreprise Recommand de playground / réseau de test et peppolEnvironment=test.'},409);
    const {data:lines,error:lineError}=await admin.from('document_lines').select('*').eq('document_id',documentId).eq('user_id',uid).order('position');
    if(lineError || !lines?.length) return reply({error:'Prestations indisponibles'},400);
    let totalCents=0;
    for(const l of lines) {const net=cents(Number(l.quantity)*Number(l.unit_price)); totalCents+=net+Math.round(net*Number(l.vat_rate)/100);}
    if(!Number.isSafeInteger(totalCents)||totalCents<=0) return reply({error:'Montant invalide'},400);
    const buyer=d.customer_snapshot || {};
    if(action==='peppol-test' && (!buyer.peppol_id || !buyer.street || !buyer.city || !buyer.postal_code || !buyer.country || !buyer.vat)) return reply({error:'Complétez les coordonnées Peppol du client puis recréez ou modifiez le brouillon pour actualiser son instantané.'},400);
    if(action==='peppol-test' && lines.some((l:any)=>Number(l.vat_rate)===0)) return reply({error:'TVA 0 % : le motif et la catégorie fiscale doivent être implémentés avant cet envoi. Les tests actuels prennent en charge 6, 12 et 21 %.'},400);
    // Unicité en base : un timeout ambigu ne déclenche jamais un second envoi.
    const lock=await admin.rpc('begin_integration_job',{target_document:documentId,target_user:uid,target_action:action,expected_document:d,expected_lines:lines});
    if(lock.error) return reply({error:'Demande déjà initiée ou document indisponible. Vérifiez son état chez le fournisseur avant toute nouvelle tentative.'},409);
    job={document_id:documentId,action};
      const p=await external(`https://app.recommand.eu/api/v1/${encodeURIComponent(config.testCompanyId)}/send`,{
        method:'POST',headers:{Authorization:`Basic ${btoa(config.recommandKey+':'+config.recommandSecret)}`,'Content-Type':'application/json'},
        body:JSON.stringify({recipient:buyer.peppol_id,documentType:'invoice',document:{invoiceNumber:d.number,issueDate:d.issue_date,dueDate:d.due_date,currency:'EUR',
          buyer:{name:buyer.name,street:buyer.street,city:buyer.city,postalZone:buyer.postal_code,country:buyer.country.toUpperCase(),vatNumber:buyer.vat},
          paymentMeans:[{iban:String(d.issuer_snapshot?.iban || '').replace(/\s/g,'')}],
          lines:lines.map((l:any)=>({name:l.name,quantity:String(l.quantity),unitCode:'C62',netPriceAmount:Number(l.unit_price).toFixed(2),vat:{category:'S',percentage:Number(l.vat_rate).toFixed(2)}}))}})
      });
    const saved={mode:'test',requestedAt:new Date().toISOString(),response:p};
    const column='peppol';
    const update=await admin.from('documents').update({[column]:saved}).eq('id',documentId).eq('user_id',uid);
    if(update.error) throw Error('Le fournisseur a accepté la demande, mais sa sauvegarde a échoué. Ne renvoyez pas : vérifiez le fournisseur.');
    const completed=await admin.from('integration_jobs').update({state:'accepted',result:saved}).eq('document_id',documentId).eq('action',action);
    if(completed.error) console.error('Integration job state could not be saved');
    return reply({[column]:saved});
  } catch(e) {
    if(job) await admin.from('integration_jobs').update({state:'needs_review'}).eq('document_id',job.document_id).eq('action',job.action);
    return reply({error:e instanceof Error ? e.message : 'Erreur du service'},502);
  }
});
