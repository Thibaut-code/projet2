// Apparence de l'application, indépendante du métier et des modèles de documents.
const UI_THEMES = {
  bleu: { label: 'Bleu et blanc', font: 'Inter', layout: 'sidebar', icon: 'line', colors: ['#f5f8ff','#ffffff','#142449','#1260ff','#ffffff','#142449'] },
  violet: { label: 'Sombre et violet', font: 'Space Grotesk', layout: 'top', icon: 'line', colors: ['#10141d','#1a202c','#f1f3fa','#b18aff','#141923','#f1f3fa'] },
  corail: { label: 'Corail et prune', font: 'Nunito Sans', layout: 'rail', icon: 'solid', colors: ['#fff8fa','#ffffff','#321743','#e13747','#321743','#ffffff'] },
  citron: { label: 'Graphite et citron', font: 'Barlow Condensed', layout: 'minimal', icon: 'square', colors: ['#ffffff','#ffffff','#161616','#d8ee00','#161616','#ffffff'] },
  turquoise: { label: 'Bleu pétrole et turquoise', font: 'Source Sans 3', layout: 'top-left', icon: 'line', colors: ['#f1f7fa','#ffffff','#103a4e','#008ca5','#103a4e','#ffffff'] },
  peche: { label: 'Indigo et pêche', font: 'Nunito Sans', layout: 'bento', icon: 'solid', colors: ['#fcfaff','#ffffff','#26205c','#e87952','#ffffff','#26205c'] },
  orange: { label: 'Noir et orange', font: 'IBM Plex Sans', layout: 'compact', icon: 'square', colors: ['#101518','#192024','#f4f6f8','#ff8617','#0c1114','#f4f6f8'] },
  bordeaux: { label: 'Blanc et bordeaux', font: 'Source Sans 3', heading: 'Georgia', layout: 'top-right', icon: 'line', colors: ['#faf9fb','#ffffff','#26212a','#831a3c','#ffffff','#26212a'] },
  cyan: { label: 'Ardoise et cyan', font: 'Manrope', layout: 'analytics', icon: 'solid', colors: ['#f1f7fd','#ffffff','#192d4b','#007fcb','#192d4b','#ffffff'] },
  sable: { label: 'Sable et chocolat', font: 'DM Sans', layout: 'warm', icon: 'soft', colors: ['#f7f2eb','#fffdfa','#35271e','#986325','#35271e','#ffffff'] }
};
let uiChoice = 'bleu';
let uiColumnReady = false;
function uiStorageKey() { return `facture-facile-interface:${account?.id || 'guest'}`; }
function localInterface() { try { return localStorage.getItem(uiStorageKey()); } catch { return null; } }
const ICON_PATHS = {
  home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>',
  docs: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/>',
  clients: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 6"/>',
  recurring: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  dashboard: '<path d="M4 21V12h4v9M10 21V7h4v14M16 21V3h4v18"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'
};
function uiIcon(name) { return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ICON_PATHS.docs}</svg>`; }
function applyInterface(key) {
  uiChoice = Object.hasOwn(UI_THEMES, key) ? key : 'bleu';
  const t = UI_THEMES[uiChoice], root = document.documentElement;
  root.dataset.interface = uiChoice; root.dataset.layout = t.layout; root.dataset.icons = t.icon;
  ['--ui-canvas','--ui-surface','--ui-ink','--ui-accent','--ui-nav','--ui-nav-ink'].forEach((name,i) => root.style.setProperty(name,t.colors[i]));
  root.style.setProperty('--ui-font', `"${t.font}", Arial, sans-serif`);
  root.style.setProperty('--ui-heading', t.heading || `"${t.font}", Arial, sans-serif`);
  root.style.setProperty('--ui-action-ink', ['citron','violet','orange'].includes(uiChoice) ? '#151515' : '#ffffff');
  const fontLink = document.getElementById('interface-font');
  if (fontLink) fontLink.href = `https://fonts.googleapis.com/css2?family=${t.font.replaceAll(' ','+')}:wght@400;500;600;700&display=swap`;
  $('#themelabel').textContent = t.label;
  $('#brandtagline').textContent = 'Votre facturation, simplement';
  $('#sidefoottrades').textContent = 'Clients · Documents · Paiements';
  document.querySelectorAll('[data-nav]').forEach(a => { const span = a.querySelector('.nav-icon'); if(span) span.innerHTML = uiIcon(a.dataset.nav); });
  document.querySelectorAll('.theme-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === uiChoice)));
}
async function chooseTheme(key) {
  if (!account || !Object.hasOwn(UI_THEMES,key)) return;
  applyInterface(key);
  try { localStorage.setItem(uiStorageKey(),key); } catch { /* Session courante conservée. */ }
  $('#themedialog').close(); render();
  if (uiColumnReady) {
    const owner = account.id;
    const {error} = await db.from('companies').update({ui_theme:key}).eq('user_id',owner);
    if(error) { showError(error); return; }
    if(account?.id === owner) company.ui_theme = key;
  }
  toast(`Apparence « ${UI_THEMES[key].label} » sélectionnée.`);
}
function interfaceOptions() {
  $('#themedialog .theme-options').innerHTML = Object.entries(UI_THEMES).map(([key,t],i) => `<button type="button" class="theme-option" data-theme="${key}" aria-pressed="${key === uiChoice}" onclick="chooseTheme('${key}')"><span class="theme-preview" style="--preview-bg:${t.colors[0]};--preview-nav:${t.colors[4]};--preview-accent:${t.colors[3]}"><i></i><b></b><em></em></span><strong>${i+1}. ${t.label}</strong><small>${['top','top-left','top-right'].includes(t.layout)?'Navigation horizontale':'Navigation latérale'} · ${t.font}</small></button>`).join('');
}
function professionSettings() {
  return `<fieldset class="profession-settings"><legend>Métier et prestations</legend><p class="muted">Votre métier détermine les prestations proposées. Il est indépendant de l’apparence.</p><label class="field">Mon métier<select id="profession-choice" onchange="chooseProfession(this.value)">${Object.entries(PROFESSIONS).map(([key,p]) => `<option value="${key}" ${themeChoice===key?'selected':''}>${esc(p.label)}</option>`).join('')}</select></label><button type="button" onclick="manageCatalog()">${uiIcon('settings')} Gérer mes prestations</button><button type="button" onclick="$('#themedialog').showModal()">Changer l’apparence</button></fieldset>`;
}
async function chooseProfession(key) {
  if(!account || !Object.hasOwn(PROFESSIONS,key)) return;
  const previous = themeChoice;
  if(themeColumnReady) {
    const {error} = await db.from('companies').update({theme:key}).eq('user_id',account.id);
    if(error) { $('#profession-choice').value=previous; showError(error); return; }
  }
  themeChoice=key; company.theme=key;
  try { localStorage.setItem(themeStorageKey(),key); } catch {}
  toast(`Métier « ${PROFESSIONS[key].label} » sélectionné.`);
}
function interfaceHome() {
  const invoices = docs.filter(d=>d.type==='facture'), unpaid=invoices.filter(d=>!d.paid), paid=invoices.filter(d=>d.paid), quotes=docs.filter(d=>d.type==='devis');
  const metric=(title,list,icon,route,cls)=>`<button class="ui-metric ${cls}" onclick="${route}">${uiIcon(icon)}<span>${title}<strong>${euro(list.reduce((sum,d)=>sum+totals(d).total,0))}</strong><small>${list.length} ${title==='Devis en attente'?'devis':'facture(s)'}</small></span></button>`;
  const actions=`<section class="ui-actions"><h2>Actions rapides</h2><button class="primary" onclick="start('facture')">${uiIcon('plus')} Nouvelle facture</button><button onclick="start('devis')">${uiIcon('docs')} Nouveau devis</button></section>`;
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-5+i);return {key:d.toLocaleDateString('sv-SE').slice(0,7),label:d.toLocaleDateString('fr-BE',{month:'short'})};});
  const amounts=months.map(m=>invoices.filter(d=>d.date?.startsWith(m.key)).reduce((s,d)=>s+totals(d).net,0)), max=Math.max(1,...amounts);
  const activity=`<section class="ui-activity"><div class="section-head"><h2>Activité sur six mois</h2><a class="link" href="#dashboard">Rapports →</a></div><p class="muted">Montants facturés hors TVA</p><div class="ui-chart">${months.map((m,i)=>`<div><span>${euro(amounts[i])}</span><i style="height:${Math.max(2,amounts[i]/max*100)}px" aria-hidden="true"></i><small>${m.label}</small></div>`).join('')}</div></section>`;
  const late=unpaid.filter(d=>d.due && d.due<today());
  const follow=`<section class="ui-follow"><h2>À suivre</h2><a href="#payments">${uiIcon('clock')}<span>Factures en retard<strong>${late.length} · ${euro(late.reduce((s,d)=>s+totals(d).total,0))}</strong></span></a><a href="#docs" onclick="filter='devis'">${uiIcon('docs')}<span>Devis enregistrés<strong>${quotes.length}</strong></span></a><a href="#recurring">${uiIcon('recurring')}<span>Abonnements<strong>${invoices.filter(d=>d.recurrence).length}</strong></span></a></section>`;
  return `<div class="interface-home"><section class="ui-greeting"><div><p class="eyebrow">Votre espace de travail</p><h1>Bonjour${company.name?.trim()?' '+esc(company.name.trim()):''} !</h1><p class="muted">Votre activité en un coup d’œil.</p></div></section>${draft?'<div class="notice ui-draft">Un document est en cours. <a href="#wizard">Reprendre mon brouillon →</a></div>':''}${actions}<section class="ui-metrics">${metric('À encaisser',unpaid,'clock',"go('payments')",'unpaid')}${metric('Factures payées',paid,'check',"go('payments')",'paid')}${metric('Devis en attente',quotes,'docs',"filter='devis';go('docs')",'quotes')}</section>${activity}<section class="recent-panel ui-invoices"><div class="section-head"><h2>Dernières factures</h2><a class="link" href="#docs" onclick="filter='facture'">Voir toutes les factures →</a></div>${homeTable(invoices.slice(0,8))}</section>${follow}</div>`;
}
