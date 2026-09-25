const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    ),
  euro = (n) =>
    new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency: "EUR",
    }).format(n),
  today = () => new Date().toLocaleDateString("sv-SE"),
  fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-BE");
let clients = [];
let company = { name: "", address: "", vat: "", iban: "", email: "" };
const THEMES = {
  plombier: {
    label: "Plomberie & chauffage",
    image: "radiateur.png",
    tagline: "Des factures qui coulent de source",
    footer: "Plomberie<br>Chauffage<br>Confiance au quotidien",
    catalog: [
      ["Entretien de chaudière", 1, 145],
      ["Main-d’œuvre (heure)", 1, 55],
      ["Déplacement", 1, 35],
      ["Réparation de fuite", 1, 85],
      ["Robinet mitigeur", 1, 95],
    ],
  },
  jardinier: {
    label: "Jardinage",
    image: "theme-jardinier.png",
    tagline: "Votre métier prend racine ici",
    footer: "Jardinage<br>Élagage<br>Le soin du vivant",
    catalog: [
      ["Entretien de jardin", 1, 120],
      ["Taille de haies", 1, 95],
      ["Élagage", 1, 180],
      ["Déplacement", 1, 35],
      ["Main-d’œuvre (heure)", 1, 55],
    ],
  },
  electricien: {
    label: "Électricité",
    image: "theme-electricien.png",
    tagline: "Des devis qui donnent de l’élan",
    footer: "Électricité<br>Installation<br>Confiance au quotidien",
    catalog: [
      ["Dépannage électrique", 1, 95],
      ["Installation de prise", 1, 75],
      ["Pose de luminaire", 1, 85],
      ["Déplacement", 1, 35],
      ["Main-d’œuvre (heure)", 1, 55],
    ],
  },
  peintre: {
    label: "Peinture",
    image: "theme-peintre.png",
    tagline: "La touche juste pour chaque chantier",
    footer: "Peinture<br>Rénovation<br>Le goût du détail",
    catalog: [
      ["Préparation des surfaces", 1, 120],
      ["Peinture intérieure (m²)", 1, 25],
      ["Peinture extérieure (m²)", 1, 35],
      ["Déplacement", 1, 35],
      ["Main-d’œuvre (heure)", 1, 55],
    ],
  },
  menuisier: {
    label: "Menuiserie",
    image: "theme-menuisier.png",
    tagline: "Des projets taillés sur mesure",
    footer: "Menuiserie<br>Agencement<br>Le sens du détail",
    catalog: [
      ["Fabrication sur mesure", 1, 350],
      ["Pose de menuiserie", 1, 180],
      ["Réparation de porte", 1, 95],
      ["Déplacement", 1, 35],
      ["Main-d’œuvre (heure)", 1, 55],
    ],
  },
};
let themeChoice = "plombier";
let themeColumnReady = false;
const catalogForTheme = () =>
  company.catalogs?.[themeChoice] ?? THEMES[themeChoice].catalog;

function themeStorageKey() {
  return `facture-facile-theme:${account.id}`;
}
function localTheme() {
  try {
    return window.localStorage.getItem(themeStorageKey());
  } catch {
    return null;
  }
}
function applyTheme(key) {
  themeChoice = Object.hasOwn(THEMES, key) ? key : "plombier";
  document.documentElement.dataset.theme = themeChoice;
  const theme = THEMES[themeChoice];
  $("#themelabel").textContent = theme.label;
  $("#brandtagline").textContent = theme.tagline;
  $("#sidefoottrades").innerHTML = theme.footer;
  document.querySelectorAll(".theme-option").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.theme === themeChoice),
    );
  });
}
async function chooseTheme(key) {
  if (!account || !Object.hasOwn(THEMES, key)) return;
  applyTheme(key);
  try {
    window.localStorage.setItem(themeStorageKey(), key);
  } catch {
    /* Supabase reste la source si le stockage local est indisponible. */
  }
  $("#themedialog").close();
  render();
  if (themeColumnReady && company.name) {
    const { error } = await db
      .from("companies")
      .update({ theme: key })
      .eq("user_id", account.id);
    if (error) showError(error);
  }
  toast(`Thème « ${THEMES[key].label} » sélectionné.`);
}

let docs = [];
let account = null;
let db = null;
let busy = false;
let authMode = "login";
let sessionGeneration = 0;
let draft = null,
  step = 1,
  filter = "all",
  returnToWizard = false;
const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
function totals(d) {
  let net = 0,
    tax = 0;
  d.lines.forEach((l) => {
    const v = round(l.qty * l.price);
    net += v;
    tax += round((v * l.tax) / 100);
  });
  return { net: round(net), tax: round(tax), total: round(net + tax) };
}
const client = (d) =>
  d.customer ||
  clients.find((c) => c.id === d.client) || { name: "Client", address: "" };
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => ($("#toast").style.display = "none"),
    4200,
  );
}
function go(r) {
  if (location.hash === "#" + r) render();
  else location.hash = r;
}
function intro(title, sub, action = "") {
  return `<div class="intro"><div><div class="eyebrow">Votre atelier, bien organisé</div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;
}
function rows(list) {
  if (!list.length)
    return '<div class="empty">Aucun document ici pour le moment.</div>';
  return list
    .map(
      (d) => `
        <div class="doc-row">
            <div class="doc-identity">
                <span class="doc-type-icon" aria-hidden="true">${d.type === "devis" ? "▤" : "▧"}</span>
                <div><strong>${esc(client(d).name)}</strong>
                <small>${esc(d.id)} · ${fmt(d.date)}</small>
                <small>${esc(d.job)}</small></div>
            </div>
            <div class="doc-status"><span class="badge ${d.type === "devis" ? "quote" : d.paid ? "paid" : "pending"}">${d.type === "devis" ? "Devis en attente" : d.paid ? "Payée" : "À payer"}</span></div>
            <div class="amount">${euro(totals(d).total)}</div>
            <button class="row-open" onclick="go('view/${d.id}')" aria-label="Voir ${esc(d.id)}">Voir <span aria-hidden="true">↗</span></button>
        </div>`,
    )
    .join("");
}

function homeTable(list) {
  if (!list.length)
    return '<div class="empty">Aucune facture pour le moment.</div>';
  return `<div class="home-table-scroll"><table class="home-table">
        <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Description</th><th>Montant</th><th>Statut</th><th><span class="sr-only">Ouvrir</span></th></tr></thead>
        <tbody>${list
          .map(
            (d) => `<tr>
            <td>${esc(d.id)}</td><td>${fmt(d.date)}</td><td>${esc(client(d).name)}</td>
            <td>${esc(d.job)}</td><td>${euro(totals(d).total)}</td>
            <td><span class="badge ${d.type === "devis" ? "quote" : d.paid ? "paid" : "pending"}">${d.type === "devis" ? "Devis" : d.paid ? "Payée" : "En attente"}</span></td>
            <td><button class="table-open" onclick="go('view/${d.id}')" aria-label="Voir ${esc(d.id)}">•••</button></td>
        </tr>`,
          )
          .join("")}</tbody>
    </table></div>`;
}

function originalHome() {
  const unpaid = docs.filter((d) => d.type === "facture" && !d.paid);
  const paid = docs.filter((d) => d.type === "facture" && d.paid);
  const quotes = docs.filter((d) => d.type === "devis");
  const name = company.name?.trim();
  return `
        <section class="home-hero">
            <div class="hero-copy">
                <h1>Bonjour${name ? " " + esc(name) : ""},</h1>
                <p>Prêt pour une nouvelle journée ?</p>
                <span class="hero-underline" aria-hidden="true"></span>
            </div>
            <div class="hero-art" aria-hidden="true">
                <img src="${THEMES[themeChoice].image}" alt="">
            </div>
        </section>
        <div class="actions">
            <button class="action-card main" onclick="start('facture')"><span class="action-icon" aria-hidden="true">▤</span>
                <span><strong>Créer une facture</strong></span><span class="arrow" aria-hidden="true">→</span></button>
            <button class="action-card" onclick="start('devis')"><span class="action-icon" aria-hidden="true">▤</span>
                <span><strong>Créer un devis</strong></span><span class="arrow" aria-hidden="true">→</span></button>
        </div>
        ${draft ? '<div class="notice">Vous avez un document en cours. <button class="link" onclick="go(\'wizard\')">Reprendre mon brouillon</button></div>' : ""}
        <div class="stats">
            <button class="stat stat-unpaid" onclick="go('payments')">
                <span class="stat-icon" aria-hidden="true">▢</span>
                <span class="stat-content"><span>À encaisser</span><strong>${euro(unpaid.reduce((sum, d) => sum + totals(d).total, 0))}</strong><small>${unpaid.length} facture(s) en attente</small></span>
                <span class="stat-arrow" aria-hidden="true">›</span>
            </button>
            <button class="stat stat-paid" onclick="go('payments')">
                <span class="stat-icon" aria-hidden="true">✓</span>
                <span class="stat-content"><span>Factures payées</span><strong>${euro(paid.reduce((sum, d) => sum + totals(d).total, 0))}</strong><small>${paid.length} facture(s) encaissée(s)</small></span>
                <span class="stat-arrow" aria-hidden="true">›</span>
            </button>
            <button class="stat stat-quotes" onclick="filter='devis';go('docs')">
                <span class="stat-icon" aria-hidden="true">▤</span>
                <span class="stat-content"><span>Devis en attente</span><strong>${euro(quotes.reduce((sum, d) => sum + totals(d).total, 0))}</strong><small>${quotes.length} devis en attente</small></span>
                <span class="stat-arrow" aria-hidden="true">›</span>
            </button>
        </div>
        <section class="recent-panel">
            <div class="section-head"><h2>Dernières factures</h2><a class="link" href="#docs" onclick="filter='facture'">Voir toutes les factures →</a></div>
            ${homeTable(docs.filter((d) => d.type === "facture").slice(0, 5))}
        </section>
        <div class="bottom-note"><b>ⓘ</b><span>Vos documents sont enregistrés dans votre compte. Vérifiez les mentions et les taux de TVA avant une utilisation professionnelle.</span></div>`;
}
function start(type) {
  if (draft) {
    go("wizard");
    toast(
      "Votre brouillon est toujours là. Terminez-le ou utilisez « Abandonner ce brouillon ».",
    );
    return;
  }
  draft = {
    type,
    client: null,
    date: today(),
    due: today(),
    job: "",
    lines: [],
  };
  step = 1;
  go("wizard");
}
function wizard() {
  if (!draft) return home();
  return `${intro(draft.type === "devis" ? "Préparer mon devis" : "Créer ma facture", "Prenons les choses dans l’ordre.")}<div class="steps">${["Le client", "Les travaux", "Vérifier"].map((s, i) => `<div class="step ${step === i + 1 ? "active" : ""}" ${step === i + 1 ? 'aria-current="step"' : ""}><b>${i + 1}</b>${s}</div>`).join("")}</div><div class="panel">${
    step === 1
      ? `<h2>Pour quel client ?</h2><div class="client-grid">${clients.map((c) => `<button class="client-card ${draft.client === c.id ? "selected" : ""}" aria-pressed="${draft.client === c.id}" onclick="draft.client='${c.id}';render()"><strong>${esc(c.name)}</strong><small>${esc(c.address).replace(/\n/g, "<br>")}</small></button>`).join("")}</div><button class="link" style="margin-top:20px" onclick="returnToWizard=true;go('newclient')">+ Ajouter un nouveau client</button><div class="form-footer"><a href="#home" class="link">Retour à l’accueil</a><button class="primary" onclick="next()">Continuer vers les travaux →</button></div>`
      : step === 2
        ? `<h2>Quels travaux avez-vous réalisés ?</h2><label class="field">Nom du chantier ou des travaux<input id="job" value="${esc(draft.job)}" placeholder="Ex. Entretien de chaudière" oninput="draft.job=this.value"></label><label class="field">Adresse du chantier (si différente)<input value="${esc(draft.site || "")}" placeholder="Facultatif" oninput="draft.site=this.value"></label><p class="muted">Ajoutez une prestation, puis adaptez la quantité et le prix.</p><div class="catalog">${catalogForTheme()
            .map(
              (c, i) =>
                `<button onclick="addLine(${i})">+ ${esc(c[0])}</button>`,
            )
            .join(
              "",
            )}<button onclick="addLine(-1)">+ Autre prestation</button><button onclick="manageCatalog()">⚙ Gérer mes prestations</button></div>${draft.lines.map((l, i) => `<div class="line-item"><label>Prestation<input aria-label="Prestation ${i + 1}" value="${esc(l.name)}" oninput="updateLine(${i},'name',this.value)"></label><label>Quantité<input aria-label="Quantité ${i + 1}" type="number" min="0.01" step="0.01" value="${l.qty}" oninput="updateLine(${i},'qty',this.value)"></label><label>Prix HTVA (€)<input aria-label="Prix ${i + 1}" type="number" min="0" step="0.01" value="${l.price}" oninput="updateLine(${i},'price',this.value)"></label><label>TVA<select aria-label="TVA ${i + 1}" onchange="updateLine(${i},'tax',this.value)">${[0, 6, 12, 21].map((t) => `<option ${t === l.tax ? "selected" : ""} value="${t}">${t} %</option>`).join("")}</select></label><button aria-label="Retirer la prestation ${i + 1}" onclick="draft.lines.splice(${i},1);render()">Retirer</button></div>`).join("") || '<div class="empty">Choisissez une prestation ci-dessus pour commencer.</div>'}<div id="totals">${totalBlock(draft)}</div><div class="notice">Les taux proposés sont indicatifs. Le taux applicable et les mentions nécessaires doivent être validés avant toute utilisation réelle.</div><div class="form-grid"><label class="field">Date du document<input type="date" value="${draft.date}" onchange="draft.date=this.value"></label><label class="field">${draft.type === "devis" ? "Devis valable jusqu’au" : "À payer pour le"}<input type="date" value="${draft.due}" onchange="draft.due=this.value"></label></div>${draft.type === "facture" ? recurrenceFields(draft.recurrence) : ""}<div class="form-footer"><button onclick="step=1;render()">← Le client</button><button class="primary" onclick="next()">Vérifier mon document →</button></div>`
        : `<h2>Tout est correct ?</h2><p>Relisez votre document avant de l’enregistrer.</p><div class="review-actions"><button type="button" onclick="step=2;render();window.scrollTo(0,0)">✎ Modifier ${draft.type === "devis" ? "le devis" : "la facture"}</button><button type="button" onclick="step=1;render();window.scrollTo(0,0)">Changer de client</button></div>${documentHTML({ ...draft, id: "Numéro attribué à l’enregistrement" })}<div class="form-footer"><button onclick="step=2;render()">← Modifier les travaux</button><button class="primary" onclick="saveDraft()">Enregistrer ${draft.type === "devis" ? "mon devis" : "ma facture"}</button></div>`
  }<p id="error" class="error" role="alert"></p></div><button class="link muted" style="margin-top:20px" onclick="if(confirm('Abandonner ce brouillon et revenir à l’accueil ?')){draft=null;go('home')}">Abandonner ce brouillon</button>`;
}
function totalBlock(d) {
  const t = totals(d);
  return `<div class="total"><div><span>Total hors TVA</span><span>${euro(t.net)}</span></div><div><span>TVA</span><span>${euro(t.tax)}</span></div><div class="grand"><span>Total à payer</span><span>${euro(t.total)}</span></div></div>`;
}
function addLine(i) {
  const c = i < 0 ? ["", 1, 0] : catalogForTheme()[i];
  draft.lines.push({ name: c[0], qty: c[1], price: c[2], tax: 21 });
  render();
}
function updateLine(i, k, v) {
  draft.lines[i][k] = k === "name" ? v : v === "" ? NaN : Number(v);
  $("#totals").innerHTML = totalBlock(draft);
}
function next() {
  let msg = "";
  if (step === 1 && !draft.client) msg = "Choisissez un client pour continuer.";
  if (step === 2) {
    if (!draft.job.trim()) msg = "Indiquez le nom des travaux.";
    else if (
      !draft.lines.length ||
      draft.lines.some(
        (l) =>
          !l.name.trim() ||
          !Number.isFinite(l.qty) ||
          l.qty <= 0 ||
          !Number.isFinite(l.price) ||
          l.price < 0,
      )
    )
      msg =
        "Ajoutez au moins une prestation avec un nom, une quantité positive et un prix valide.";
    else if (draft.recurrence && !validDate(draft.recurrence.next))
      msg = "Choisissez la prochaine date de facturation.";
    else if (!draft.date || !draft.due || draft.due < draft.date)
      msg =
        "Choisissez des dates valides : la date limite doit être égale ou postérieure à la date du document.";
  }
  if (msg) {
    $("#error").textContent = msg;
    return;
  }
  step++;
  render();
  window.scrollTo(0, 0);
}
function newId(type) {
  const p = type === "devis" ? "D" : "F",
    year = new Date().getFullYear();
  let n = 1;
  while (
    docs.some((d) => d.id === `${p}-${year}-${String(n).padStart(3, "0")}`)
  )
    n++;
  return `${p}-${year}-${String(n).padStart(3, "0")}`;
}
async function saveDraft() {
  if (!draft || busy) return;
  if (!company.name.trim() || !company.address.trim()) {
    toast("Complétez les coordonnées de votre entreprise avant d’enregistrer.");
    return;
  }
  busy = true;
  try {
    const d = await persistDocument({
      ...structuredClone(draft),
      id: newId(draft.type),
      paid: false,
      issuer: structuredClone(company),
      customer: structuredClone(client(draft)),
    });
    docs.unshift(d);
    draft = null;
    go("view/" + d.id);
    toast("Document enregistré.");
  } catch (error) {
    showError(error);
  } finally {
    busy = false;
  }
}
function documentHTML(d) {
  const c = d.customer || client(d),
    biz = d.issuer || company;
  return `<article class="document"><div class="document-top"><div>${logoHTML(biz.logo)}<strong>${esc(biz.name)}</strong><p class="muted">${esc(biz.address)}<br>${esc(biz.vat)}</p></div><div><h2>${d.type === "devis" ? "DEVIS" : "FACTURE"}</h2><strong>${esc(d.id)}</strong><p>Date : ${fmt(d.date)}<br>${d.type === "devis" ? "Valable jusqu’au" : "Échéance"} : ${fmt(d.due)}</p></div></div><hr style="border:0;border-top:1px solid var(--line)"><p><small class="muted">CLIENT</small><br><strong>${esc(c.name)}</strong><br>${esc(c.address)}</p><h3>${esc(d.job)}</h3>${d.site ? `<p>Chantier : ${esc(d.site)}</p>` : ""}<table><thead><tr><th>Prestation</th><th>Qté</th><th>Prix HTVA</th><th>TVA</th><th>Total HTVA</th></tr></thead><tbody>${d.lines.map((l) => `<tr><td>${esc(l.name)}</td><td>${l.qty}</td><td>${euro(l.price)}</td><td>${l.tax} %</td><td>${euro(round(l.qty * l.price))}</td></tr>`).join("")}</tbody></table>${totalBlock(d)}<p style="margin-top:25px">Compte bancaire : ${esc(biz.iban)}<br>Communication : ${esc(d.id)}</p>${paymentQR(d, biz)}<div class="demo-stamp">DOCUMENT À VÉRIFIER AVANT UTILISATION</div><p class="muted" style="font-size:.8rem;margin-top:15px">Mentions légales et traitement TVA à valider avant utilisation professionnelle. Aucun envoi Peppol.</p></article>`;
}
function view(id) {
  const d = docs.find((d) => d.id === id);
  if (!d)
    return intro(
      "Document introuvable",
      "Retrouvez vos documents depuis le menu.",
    );
  return `<div class="no-print">${intro(d.type === "devis" ? "Votre devis" : "Votre facture", `${esc(client(d).name)} · ${esc(d.id)}`)}<div class="filter-row"><button onclick="go('docs')">← Mes documents</button><button class="primary" onclick="window.print()">Imprimer / PDF</button>${d.type === "devis" ? `<button onclick="convert('${d.id}')">Transformer en facture</button>` : `<button onclick="togglePaid('${d.id}')">${d.paid ? "Annuler le paiement" : "Marquer comme payée"}</button>`}</div><p class="muted">Pour télécharger un PDF, choisissez « Enregistrer au format PDF » dans la fenêtre d’impression.</p></div>${invoiceExtras(d)}${documentHTML(d)}`;
}
async function convert(id) {
  const d = docs.find((d) => d.id === id);
  if (!d || busy) return;
  if (d.converted) {
    go("view/" + d.converted);
    return;
  }
  busy = true;
  try {
    const n = await persistDocument(
      {
        ...structuredClone(d),
        id: newId("facture"),
        type: "facture",
        paid: false,
        date: today(),
        due: today(),
      },
      d.dbId,
    );
    n.convertedFrom = d.dbId;
    d.converted = n.id;
    docs.unshift(n);
    go("view/" + n.id);
    toast("Devis transformé en facture.");
  } catch (error) {
    showError(error);
    await loadData().catch(showError);
  } finally {
    busy = false;
  }
}
async function togglePaid(id) {
  const d = docs.find((d) => d.id === id);
  if (!d || busy) return;
  busy = true;
  try {
    const paid = !d.paid;
    const { error } = await db
      .from("documents")
      .update({ paid })
      .eq("id", d.dbId)
      .eq("user_id", account.id);
    if (error) throw error;
    d.paid = paid;
    render();
    toast(paid ? "Paiement noté." : "Paiement annulé.");
  } catch (error) {
    showError(error);
  } finally {
    busy = false;
  }
}
function clientsView() {
  return `${intro("Mes clients", "Retrouvez leurs coordonnées en un coup d’œil.", '<button class="primary" onclick="returnToWizard=false;go(\'newclient\')">+ Ajouter un client</button>')}<div class="client-grid">${clients.map((c) => `<div class="panel"><h2>${esc(c.name)}</h2><p class="muted">${esc(c.address).replace(/\n/g, "<br>")}<br>${esc(c.email)}</p><div class="client-actions"><button onclick="startForClient('${c.id}')">Créer une facture</button><button onclick="go('editclient/${c.id}')">Modifier</button></div></div>`).join("")}</div>`;
}
function startForClient(id) {
  if (draft) {
    go("wizard");
    toast("Terminez ou abandonnez votre brouillon en cours.");
    return;
  }
  start("facture");
  draft.client = id;
  render();
}
function newClient() {
  return `${intro("Ajouter un client", "Les informations utiles, tout simplement.")}<form class="panel" id="clientform"><label class="field">Nom du client<input name="name" autocomplete="name" required></label><label class="field">Adresse complète<textarea name="address" autocomplete="street-address" required></textarea></label><label class="field">Adresse e-mail (facultatif)<input name="email" type="email" autocomplete="email"></label><div class="form-footer"><button type="button" onclick="go(returnToWizard?'wizard':'clients')">← Retour</button><button class="primary" type="submit">Enregistrer le client</button></div></form>`;
}
function editClient(id) {
  const c = clients.find((item) => item.id === id);
  if (!c)
    return intro("Client introuvable", "Retrouvez vos clients depuis le menu.");
  return `${intro("Modifier le client", "Corrigez ses coordonnées pour vos prochains documents.")}
        <form class="panel" id="editclientform" data-client-id="${c.id}">
            <label class="field">Nom du client<input name="name" autocomplete="name" required value="${esc(c.name)}"></label>
            <label class="field">Adresse complète<textarea name="address" autocomplete="street-address" required>${esc(c.address)}</textarea></label>
            <label class="field">Adresse e-mail (facultatif)<input name="email" type="email" autocomplete="email" value="${esc(c.email)}"></label>
            <div class="notice">Les documents déjà enregistrés conservent les coordonnées du client au moment de leur création.</div>
            <div class="form-footer"><button type="button" onclick="go('clients')">← Retour</button>
                <button class="primary" type="submit">Enregistrer les modifications</button></div>
        </form>`;
}
function originalCompanyView() {
  return `${intro("Mon entreprise", "Ces coordonnées apparaissent sur vos nouveaux documents.")}<form id="companyform" class="panel"><label class="field">Nom de l’entreprise<input name="name" required value="${esc(company.name)}"></label><label class="field">Adresse<textarea name="address" required>${esc(company.address)}</textarea></label><div class="form-grid"><label class="field">Numéro de TVA<input name="vat" value="${esc(company.vat)}"></label><label class="field">Compte bancaire IBAN<input name="iban" value="${esc(company.iban)}"></label></div><label class="field">Adresse e-mail<input name="email" type="email" value="${esc(company.email)}"></label><div class="notice">Les coordonnées sont enregistrées dans votre compte et copiées sur chaque nouveau document.</div><button class="primary">Enregistrer mes coordonnées</button></form>`;
}
function originalRender() {
  if (!account) {
    $("#main").innerHTML = authHTML();
    $("#logout").hidden = true;
    $("#themebutton").hidden = true;
    return;
  }
  $("#logout").hidden = false;
  $("#themebutton").hidden = false;
  $("#headerdate").textContent = new Date().toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("#accountname").textContent = company.name?.trim() || "Mon entreprise";
  const route = location.hash.slice(1) || "home";
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) =>
      a.classList.toggle(
        "active",
        a.dataset.nav === route &&
          (!a.dataset.filter || a.dataset.filter === filter),
      ),
    );
  let html;
  if (route === "wizard") html = wizard();
  else if (route === "clients") html = clientsView();
  else if (route === "newclient") html = newClient();
  else if (route.startsWith("editclient/")) html = editClient(route.slice(11));
  else if (route === "company") html = companyView();
  else if (route.startsWith("view/")) html = view(route.slice(5));
  else if (route === "docs")
    html = `${intro("Devis et factures", "Tous vos documents, au même endroit.")}<div class="filter-row">${[
      ["all", "Tous"],
      ["facture", "Factures"],
      ["devis", "Devis"],
    ]
      .map(
        ([v, l]) =>
          `<button class="${filter === v ? "active" : ""}" onclick="filter='${v}';render()">${l}</button>`,
      )
      .join(
        "",
      )}</div><div class="panel">${rows(docs.filter((d) => filter === "all" || d.type === filter))}</div>`;
  else if (route === "payments")
    html = `${intro("Qui doit encore me payer ?", "Ouvrez une facture pour noter son paiement.")}<div class="panel">${rows(docs.filter((d) => d.type === "facture" && !d.paid))}</div><div class="section-head" style="margin-top:30px"><h2>Factures payées</h2></div><div class="panel">${rows(docs.filter((d) => d.type === "facture" && d.paid))}</div>`;
  else html = home();
  $("#main").innerHTML = html;
  if ($("#clientform"))
    $("#clientform").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target),
        name = f.get("name").trim(),
        address = f.get("address").trim();
      if (!name || !address) {
        toast("Complétez le nom et l’adresse du client.");
        return;
      }
      saveClient({ name, address, email: f.get("email").trim() })
        .then((c) => {
          clients.push(c);
          if (returnToWizard && draft) {
            draft.client = c.id;
            go("wizard");
          } else go("clients");
          toast("Client enregistré.");
        })
        .catch(showError);
    };
  if ($("#editclientform"))
    $("#editclientform").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('[type="submit"]');
      const values = new FormData(form);
      const updated = {
        name: String(values.get("name")).trim(),
        address: String(values.get("address")).trim(),
        email: String(values.get("email")).trim(),
      };
      if (!updated.name || !updated.address || button.disabled) return;
      button.disabled = true;
      try {
        const saved = await updateClient(form.dataset.clientId, updated);
        const index = clients.findIndex((c) => c.id === saved.id);
        if (index !== -1) clients[index] = saved;
        go("clients");
        toast("Client modifié.");
      } catch (error) {
        showError(error);
        button.disabled = false;
      }
    };
  if ($("#companyform"))
    $("#companyform").onsubmit = (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(e.target));
      values.logo = logoDirty ? logoDraft : company.logo || null;
      if (logoLoading) {
        toast("Le logo est encore en cours de chargement.");
        return;
      }
      if (!values.name.trim() || !values.address.trim()) {
        toast("Complétez le nom et l’adresse.");
        return;
      }
      saveCompany(values)
        .then(() => {
          company = { ...company, ...values, theme: themeChoice };
          logoDirty = false;
          $("#accountname").textContent = company.name.trim();
          toast("Coordonnées enregistrées.");
        })
        .catch(featureError);
    };
}
window.addEventListener("hashchange", () => {
  render();
  $("#main").focus();
  window.scrollTo(0, 0);
});
$("#help").onclick = () => $("#helpdialog").showModal();
$("#themebutton").onclick = () => $("#themedialog").showModal();
$("#logout").onclick = async () => {
  const { error } = await db.auth.signOut();
  if (error) showError(error);
};
$("#textsize").onclick = () => {
  const large = document.documentElement.dataset.large !== "yes";
  document.documentElement.dataset.large = large ? "yes" : "no";
  document.documentElement.style.fontSize = large ? "22px" : "";
  $("#textsize").innerHTML = large
    ? "A− <span>Texte standard</span>"
    : "A+ <span>Agrandir le texte</span>";
};

function authHTML() {
  const configured =
    window.APP_CONFIG?.supabaseUrl?.startsWith("https://") &&
    window.APP_CONFIG?.supabaseKey &&
    !window.APP_CONFIG.supabaseKey.startsWith("VOTRE_");
  if (!configured || !window.supabase?.createClient) {
    return intro(
      "Configuration nécessaire",
      "Renseignez l’URL et la clé publique dans config.js, puis rechargez la page.",
    );
  }
  return `${intro(authMode === "signup" ? "Créer mon compte" : "Me connecter", "Retrouvez vos clients et documents sur vos appareils.")}
        <form id="authform" class="panel auth-panel">
            <label class="field">Adresse e-mail<input type="email" name="email" autocomplete="email" required></label>
            <label class="field">Mot de passe<input type="password" name="password" autocomplete="${authMode === "signup" ? "new-password" : "current-password"}" minlength="6" required></label>
            <div class="form-footer">
                <button class="primary" type="submit">${authMode === "signup" ? "Créer mon compte" : "Me connecter"}</button>
            </div>
            <button class="link" type="button" onclick="authMode='${authMode === "signup" ? "login" : "signup"}';render()">${authMode === "signup" ? "J’ai déjà un compte" : "Créer un compte"}</button>
            <p id="authmessage" role="status"></p>
        </form>`;
}

function showError(error) {
  console.error(error);
  toast(
    "Enregistrement impossible : " +
      (error?.message || "vérifiez votre connexion et réessayez."),
  );
}

async function saveClient({ name, address, email }) {
  const { data, error } = await db
    .from("clients")
    .insert({ user_id: account.id, name, address, email: email || null })
    .select("id,name,address,email")
    .single();
  if (error) throw error;
  return data;
}

async function updateClient(id, { name, address, email }) {
  const { data, error } = await db
    .from("clients")
    .update({ name, address, email: email || null })
    .eq("id", id)
    .eq("user_id", account.id)
    .select("id,name,address,email")
    .single();
  if (error) throw error;
  return data;
}

async function saveCompany(values) {
  const { error } = await db.from("companies").upsert({
    user_id: account.id,
    name: values.name.trim(),
    address: values.address.trim(),
    vat: values.vat?.trim() || null,
    iban: values.iban?.trim() || null,
    email: values.email?.trim() || null,
    logo: values.logo || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  const themeUpdate = await db
    .from("companies")
    .update({ theme: themeChoice })
    .eq("user_id", account.id);
  if (!themeUpdate.error) themeColumnReady = true;
  else if (!["42703", "PGRST204"].includes(themeUpdate.error.code))
    console.error(themeUpdate.error);
}

function readDocument(row, lines) {
  return {
    id: row.number,
    dbId: row.id,
    type: row.type,
    client: row.client_id,
    date: row.issue_date,
    due: row.due_date,
    job: row.job,
    site: row.site,
    recurrence: row.recurrence || null,
    paid: row.paid,
    convertedFrom: row.converted_from,
    issuer: row.issuer_snapshot,
    customer: row.customer_snapshot,
    lines: lines
      .filter((line) => line.document_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        name: line.name,
        qty: Number(line.quantity),
        price: Number(line.unit_price),
        tax: Number(line.vat_rate),
      })),
  };
}

async function loadData() {
  const userId = account.id;
  const [clientResult, companyResult, documentResult, lineResult] =
    await Promise.all([
      db
        .from("clients")
        .select("id,name,address,email")
        .eq("user_id", userId)
        .order("created_at"),
      db.from("companies").select("*").eq("user_id", userId).maybeSingle(),
      db
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      db
        .from("document_lines")
        .select("*")
        .eq("user_id", userId)
        .order("position"),
    ]);
  for (const result of [
    clientResult,
    companyResult,
    documentResult,
    lineResult,
  ]) {
    if (result.error) throw result.error;
  }
  if (account?.id !== userId) return;
  clients = clientResult.data || [];
  company = companyResult.data || {
    name: "",
    address: "",
    vat: "",
    iban: "",
    email: "",
  };
  themeColumnReady = Object.hasOwn(company, "theme");
  applyTheme(themeColumnReady ? company.theme : localTheme());
  docs = (documentResult.data || []).map((row) =>
    readDocument(row, lineResult.data || []),
  );
  for (const doc of docs) {
    const converted = docs.find((other) => other.convertedFrom === doc.dbId);
    if (converted) doc.converted = converted.id;
  }
  await loadReminders(userId);
  render();
}

async function persistDocument(source, convertedFrom = null) {
  // Le numéro est encore produit côté navigateur. Pour des factures réelles,
  // utilisez une numérotation transactionnelle côté serveur.
  const payload = {
    user_id: account.id,
    client_id: source.client,
    number: source.id,
    type: source.type,
    issue_date: source.date,
    due_date: source.due,
    job: source.job,
    site: source.site || null,
    paid: source.paid,
    issuer_snapshot: source.issuer,
    customer_snapshot: source.customer,
    converted_from: convertedFrom,
    recurrence: source.recurrence || null,
  };
  const { data: row, error } = await db
    .from("documents")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  const entries = source.lines.map((line, position) => ({
    user_id: account.id,
    document_id: row.id,
    position,
    name: line.name,
    quantity: line.qty,
    unit_price: line.price,
    vat_rate: line.tax,
  }));
  const result = await db.from("document_lines").insert(entries);
  if (result.error) {
    const rollback = await db
      .from("documents")
      .delete()
      .eq("id", row.id)
      .eq("user_id", account.id);
    if (rollback.error)
      console.error("Nettoyage du document incomplet", rollback.error);
    throw result.error;
  }
  return { ...source, dbId: row.id };
}

async function initialize() {
  if (
    !window.supabase?.createClient ||
    !window.APP_CONFIG?.supabaseUrl?.startsWith("https://") ||
    !window.APP_CONFIG?.supabaseKey ||
    window.APP_CONFIG.supabaseKey.startsWith("VOTRE_")
  ) {
    render();
    return;
  }
  db = window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseKey,
  );
  db.auth.onAuthStateChange((_event, session) => {
    const nextId = session?.user?.id || null;
    if (nextId === account?.id) return;
    const generation = ++sessionGeneration;
    account = session?.user || null;
    clients = [];
    docs = [];
    reminders = [];
    document.getElementById("feature-dialog")?.remove();
    recurrenceDoc = null;
    recurrenceEdit = null;
    logoDraft = null;
    logoDirty = false;
    company = { name: "", address: "", vat: "", iban: "", email: "" };
    themeColumnReady = false;
    applyTheme(account ? localTheme() : "plombier");
    draft = null;
    render();
    if (account)
      loadData().catch((error) => {
        if (generation === sessionGeneration) showError(error);
      });
  });
  const { data, error } = await db.auth.getSession();
  if (error) showError(error);
  if (data?.session?.user && !account) {
    account = data.session.user;
    applyTheme(localTheme());
    await loadData().catch(showError);
  }
  render();
}

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "authform") return;
  event.preventDefault();
  const form = event.target;
  const message = form.querySelector("#authmessage");
  const submit = form.querySelector('[type="submit"]');
  const values = new FormData(form);
  submit.disabled = true;
  message.textContent = "Veuillez patienter…";
  try {
    const credentials = {
      email: String(values.get("email")).trim(),
      password: String(values.get("password")),
    };
    const result =
      authMode === "signup"
        ? await db.auth.signUp({
            ...credentials,
            options: {
              emailRedirectTo: location.origin + location.pathname,
            },
          })
        : await db.auth.signInWithPassword(credentials);
    if (result.error) throw result.error;
    if (authMode === "signup" && !result.data.session) {
      message.textContent =
        "Vérifiez votre boîte e-mail pour confirmer votre compte.";
    } else {
      message.textContent = "Connexion réussie.";
    }
  } catch (error) {
    message.textContent = error.message || "Connexion impossible.";
  } finally {
    submit.disabled = false;
  }
});

// Prestations, récurrences, relances et identité de l'entreprise.
let reminders = [],
  logoDraft = null,
  logoDirty = false,
  logoLoading = false;
let featureBusy = false;
function validDate(value) {
  const date = new Date(value + "T12:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value || "") &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
function featureDialog(title, body) {
  document.getElementById("feature-dialog")?.remove();
  const dialog = document.createElement("dialog");
  dialog.id = "feature-dialog";
  dialog.innerHTML = `<h2>${esc(title)}</h2>${body}<p><button type="button" onclick="this.closest('dialog').close()">Fermer</button></p>`;
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
function featureError(error) {
  if (["42703", "PGRST204", "42P01", "PGRST205"].includes(error?.code))
    toast(
      "Exécutez migration-suivi.sql dans Supabase pour activer ces nouveautés.",
    );
  else showError(error);
}
function manageCatalog() {
  const entries = structuredClone(catalogForTheme());
  const dialog = featureDialog(
    "Mes prestations · " + THEMES[themeChoice].label,
    '<p>Ces raccourcis sont enregistrés pour votre métier. Les lignes déjà ajoutées aux factures restent inchangées.</p><div id="catalog-editor"></div><button id="catalog-add">+ Nouvelle prestation</button><button class="primary" id="catalog-save">Enregistrer les prestations</button>',
  );
  function draw() {
    dialog.querySelector("#catalog-editor").innerHTML =
      entries
        .map(
          (entry, i) =>
            `<div class="catalog-edit"><label>Prestation<input data-index="${i}" data-key="0" value="${esc(entry[0])}" maxlength="200"></label><label>Quantité<input type="number" min="0.01" step="0.01" data-index="${i}" data-key="1" value="${entry[1]}"></label><label>Prix HTVA<input type="number" min="0" step="0.01" data-index="${i}" data-key="2" value="${entry[2]}"></label><button data-remove="${i}" aria-label="Supprimer ${esc(entry[0])}">Supprimer</button></div>`,
        )
        .join("") || "<p>Aucune prestation enregistrée.</p>";
  }
  dialog.oninput = (e) => {
    if (e.target.dataset.index !== undefined)
      entries[+e.target.dataset.index][+e.target.dataset.key] =
        e.target.dataset.key === "0"
          ? e.target.value
          : e.target.value === ""
            ? NaN
            : Number(e.target.value);
  };
  dialog.onclick = (e) => {
    if (e.target.dataset.remove !== undefined) {
      entries.splice(+e.target.dataset.remove, 1);
      draw();
    }
  };
  dialog.querySelector("#catalog-add").onclick = () => {
    entries.push(["", 1, 0]);
    draw();
  };
  dialog.querySelector("#catalog-save").onclick = async (e) => {
    if (
      entries.some(
        (x) =>
          !x[0].trim() ||
          !Number.isFinite(x[1]) ||
          x[1] <= 0 ||
          !Number.isFinite(x[2]) ||
          x[2] < 0,
      )
    )
      return toast(
        "Complétez chaque prestation avec une quantité et un prix valides.",
      );
    if (!company.name?.trim())
      return toast("Enregistrez d’abord Mon entreprise.");
    e.target.disabled = true;
    try {
      const catalogs = { ...(company.catalogs || {}), [themeChoice]: entries };
      const result = await db
        .from("companies")
        .update({ catalogs })
        .eq("user_id", account.id)
        .select("user_id")
        .single();
      if (result.error) throw result.error;
      company.catalogs = catalogs;
      dialog.close();
      render();
      toast("Prestations enregistrées.");
    } catch (error) {
      featureError(error);
    } finally {
      e.target.disabled = false;
    }
  };
  draw();
}
function recurrenceFields(recurrence, context = "draft") {
  const set = context === "draft" ? "draft.recurrence" : "recurrenceEdit";
  return `<fieldset class="recurrence-box"><legend>Abonnement / facture récurrente</legend><label><input type="checkbox" ${recurrence ? "checked" : ""} onchange="${set}=this.checked?{frequency:'yearly',next:today(),anchor:today()}:null;${context === "draft" ? "render()" : "redrawRecurrence()"}"> Me rappeler de préparer une nouvelle facture</label>${recurrence ? `<div class="form-grid"><label>Fréquence<select onchange="${set}.frequency=this.value"><option value="monthly" ${recurrence.frequency === "monthly" ? "selected" : ""}>Tous les mois</option><option value="quarterly" ${recurrence.frequency === "quarterly" ? "selected" : ""}>Tous les 3 mois</option><option value="yearly" ${recurrence.frequency === "yearly" ? "selected" : ""}>Tous les ans</option></select></label><label>Prochaine facturation<input type="date" value="${esc(recurrence.next)}" onchange="${set}.next=this.value;${set}.anchor=this.value"></label></div>` : ""}<p class="muted">Exemple : tous les ans, à partir du 20 décembre. Le rappel apparaît dans l’application ; vous vérifiez et envoyez la facture vous-même.</p></fieldset>`;
}
let recurrenceEdit = null,
  recurrenceDoc = null;
function editRecurrence(id) {
  recurrenceDoc = docs.find((d) => d.id === id);
  recurrenceEdit = structuredClone(recurrenceDoc.recurrence || null);
  featureDialog(
    "Planifier cette facture",
    '<div id="recurrence-editor"></div><button class="primary" onclick="saveRecurrence()">Enregistrer</button>',
  );
  redrawRecurrence();
}
function redrawRecurrence() {
  $("#recurrence-editor").innerHTML = recurrenceFields(recurrenceEdit, "edit");
}
async function saveRecurrence() {
  if (featureBusy) return;
  if (recurrenceEdit && !validDate(recurrenceEdit.next))
    return toast("Choisissez une date valide.");
  featureBusy = true;
  try {
    const { error } = await db
      .from("documents")
      .update({ recurrence: recurrenceEdit })
      .eq("id", recurrenceDoc.dbId)
      .eq("user_id", account.id);
    if (error) throw error;
    recurrenceDoc.recurrence = structuredClone(recurrenceEdit);
    $("#feature-dialog").close();
    render();
    toast("Récurrence enregistrée.");
  } catch (error) {
    featureError(error);
  } finally {
    featureBusy = false;
  }
}
function advanceDate(recurrence) {
  const [y, m] = recurrence.next.split("-").map(Number);
  const anchorDay = Number((recurrence.anchor || recurrence.next).slice(8, 10));
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[recurrence.frequency];
  if (!months || !validDate(recurrence.next))
    throw Error("Récurrence invalide.");
  const end = new Date(Date.UTC(y, m - 1 + months + 1, 0));
  return `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(anchorDay, end.getUTCDate())).padStart(2, "0")}`;
}
async function finishOccurrence(id) {
  const d = docs.find((d) => d.id === id);
  if (
    !d?.recurrence ||
    featureBusy ||
    !confirm(
      "Vous confirmez avoir traité la facturation du " +
        fmt(d.recurrence.next) +
        " ? La prochaine échéance sera affichée.",
    )
  )
    return;
  featureBusy = true;
  try {
    const old = structuredClone(d.recurrence),
      next = { ...old, next: advanceDate(old) };
    const result = await db
      .from("documents")
      .update({ recurrence: next })
      .eq("id", d.dbId)
      .eq("user_id", account.id)
      .eq("recurrence->>next", old.next)
      .select("id")
      .single();
    if (result.error) throw result.error;
    d.recurrence = next;
    render();
    toast("Prochaine facturation : " + fmt(next.next));
  } catch (error) {
    featureError(error);
  } finally {
    featureBusy = false;
  }
}
function recurringDraft(id) {
  if (draft) {
    go("wizard");
    return toast("Terminez ou abandonnez votre brouillon en cours.");
  }
  const d = docs.find((d) => d.id === id);
  if (!d?.recurrence) return;
  const terms = Math.max(
    0,
    Math.round((Date.parse(d.due) - Date.parse(d.date)) / 86400000),
  );
  const due = new Date(today() + "T12:00:00Z");
  due.setUTCDate(due.getUTCDate() + terms);
  draft = {
    type: "facture",
    client: d.client,
    date: today(),
    due: due.toISOString().slice(0, 10),
    job: d.job,
    site: d.site,
    lines: structuredClone(d.lines),
  };
  step = 2;
  go("wizard");
  toast(
    "Brouillon préparé. Après envoi, marquez l’échéance traitée dans Abonnements.",
  );
}
function recurringView() {
  const list = docs
    .filter((d) => d.type === "facture" && d.recurrence)
    .sort((a, b) => a.recurrence.next.localeCompare(b.recurrence.next));
  return `${intro("Mes abonnements", "Préparez vos factures aux dates prévues. Aucun e-mail automatique.")}<div class="notice">Après avoir envoyé votre facture, cliquez sur « Échéance traitée » pour passer à la date suivante. Une échéance oubliée reste visible.</div>${list.map((d) => `<section class="panel recurring-card"><h2>${esc(client(d).name)} · ${esc(d.job)}</h2><p><strong>${d.recurrence.next <= today() ? "À facturer maintenant" : "Prochaine facturation"} : ${fmt(d.recurrence.next)}</strong> · ${{ monthly: "Mensuel", quarterly: "Trimestriel", yearly: "Annuel" }[d.recurrence.frequency]}</p><div class="filter-row"><button class="primary" onclick="recurringDraft('${d.id}')">Préparer la facture</button><button onclick="finishOccurrence('${d.id}')">Échéance traitée</button><button onclick="editRecurrence('${d.id}')">Modifier / arrêter</button><button onclick="go('view/${d.id}')">Facture modèle</button></div></section>`).join("") || '<div class="panel">Aucun abonnement. Activez une récurrence pendant la création d’une facture ou depuis une facture enregistrée.</div>'}`;
}
function home() {
  const due = docs.filter(
    (d) => d.type === "facture" && d.recurrence && d.recurrence.next <= today(),
  );
  return (
    (due.length
      ? `<div class="notice no-print"><strong>${due.length} facturation(s) récurrente(s) à préparer.</strong> <a href="#recurring">Voir mes abonnements →</a></div>`
      : "") + originalHome()
  );
}
async function loadReminders(userId) {
  const result = await db
    .from("payment_reminders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (account?.id !== userId) return;
  reminders = result.error ? [] : result.data || [];
  if (result.error && !["42P01", "PGRST205"].includes(result.error.code))
    featureError(result.error);
}
function invoiceExtras(d) {
  if (d.type !== "facture") return "";
  const history = reminders.filter((r) => r.document_id === d.dbId);
  return `<section class="no-print panel invoice-extras"><div class="filter-row"><button onclick="editRecurrence('${d.id}')">↻ ${d.recurrence ? "Modifier la récurrence" : "Ajouter une récurrence"}</button>${!d.paid && d.due < today() ? `<button class="primary" onclick="remindClient('${d.id}')">Relancer : retard de paiement</button>` : ""}</div><details ${history.length ? "open" : ""}><summary>Historique des relances (${history.length})</summary>${history.map((r) => `<div class="reminder-entry"><strong>${r.status === "confirmed" ? "Envoi confirmé par vous" : "E-mail préparé — envoi non confirmé"}</strong><p>${new Date(r.created_at).toLocaleString("fr-BE")} · ${esc(r.recipient)}</p>${r.confirmed_at ? `<p>Confirmation : ${new Date(r.confirmed_at).toLocaleString("fr-BE")}</p>` : ""}<details><summary>Voir le message</summary><pre>${esc(r.subject)}\n\n${esc(r.body)}</pre></details>${r.status !== "confirmed" ? `<button onclick="confirmReminder('${r.id}')">J’ai envoyé cette relance</button>` : ""}</div>`).join("") || "<p>Aucune relance.</p>"}</details></section>`;
}
function remindClient(id) {
  const d = docs.find((d) => d.id === id);
  if (!d || d.paid || d.due >= today()) return;
  const c = client(d),
    biz = d.issuer || company;
  const subject = `Rappel de paiement — facture ${d.id}`;
  const body = `Bonjour ${c.name},\n\nSauf erreur de notre part, la facture ${d.id} d’un montant de ${euro(totals(d).total)}, arrivée à échéance le ${fmt(d.due)}, reste impayée.\n\nMerci de procéder au règlement sur le compte ${biz.iban || "[compte à préciser]"}, avec la communication ${d.id}.\n\nSi le paiement a déjà été effectué, merci de ne pas tenir compte de ce rappel.\n\nBien à vous,\n${biz.name}`;
  const dialog = featureDialog(
    "Relance pour retard de paiement",
    `<form id="reminder-form"><label class="field">Destinataire<input name="recipient" type="email" required value="${esc(c.email || "")}"></label><label class="field">Objet<input name="subject" required value="${esc(subject)}"></label><label class="field">Message<textarea name="body" rows="10" required>${esc(body)}</textarea></label><p class="muted">Votre messagerie s’ouvrira. Vous devez y envoyer le message, puis confirmer l’envoi dans l’historique. Aucun PDF n’est joint automatiquement.</p><button class="primary">Préparer l’e-mail et enregistrer la relance</button></form>`,
  );
  dialog.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button");
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(e.target));
      const result = await db
        .from("payment_reminders")
        .insert({
          ...values,
          user_id: account.id,
          document_id: d.dbId,
          status: "prepared",
        })
        .select()
        .single();
      if (result.error) throw result.error;
      reminders.unshift(result.data);
      const url = `mailto:${encodeURIComponent(values.recipient)}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(values.body)}`;
      dialog.innerHTML = `<h2>Relance préparée</h2><p>L’historique est enregistré. Ouvrez votre messagerie, envoyez le message, puis confirmez l’envoi.</p><a class="primary mail-action" href="${esc(url)}">Ouvrir ma messagerie</a><button onclick="confirmReminder('${result.data.id}')">J’ai envoyé cette relance</button><button onclick="this.closest('dialog').close();render()">Fermer sans confirmer</button>`;
      location.href = url;
    } catch (error) {
      featureError(error);
      button.disabled = false;
    }
  };
}
async function confirmReminder(id) {
  if (
    featureBusy ||
    !confirm("Confirmez-vous avoir envoyé ce message depuis votre messagerie ?")
  )
    return;
  featureBusy = true;
  try {
    const confirmed_at = new Date().toISOString();
    const result = await db
      .from("payment_reminders")
      .update({ status: "confirmed", confirmed_at })
      .eq("id", id)
      .eq("user_id", account.id)
      .select("id")
      .single();
    if (result.error) throw result.error;
    Object.assign(
      reminders.find((r) => r.id === id),
      { status: "confirmed", confirmed_at },
    );
    $("#feature-dialog")?.close();
    render();
    toast("Envoi confirmé dans l’historique.");
  } catch (error) {
    featureError(error);
  } finally {
    featureBusy = false;
  }
}
function safeLogo(value) {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
    value.length < 600000
  );
}
function logoHTML(value) {
  return safeLogo(value)
    ? `<img class="company-logo" src="${value}" alt="Logo de l’entreprise">`
    : "";
}
function companyView() {
  const logo = logoDirty ? logoDraft : company.logo;
  return originalCompanyView()
    .replace(
      '<label class="field">Nom de l’entreprise',
      `<fieldset class="logo-editor"><legend>Logo de l’entreprise</legend><div id="logo-preview">${logoHTML(logo) || "<p>Aucun logo sélectionné.</p>"}</div><label class="field">Choisir un logo (PNG, JPEG ou WebP, maximum 2 Mo)<input type="file" accept="image/png,image/jpeg,image/webp" onchange="selectLogo(this.files[0])"></label><button type="button" onclick="removeLogo()">Retirer le logo</button><p class="muted">Le logo sera affiché en haut des nouvelles factures et des devis. Enregistrez vos coordonnées pour conserver ce choix.</p></fieldset><label class="field">Nom de l’entreprise`,
    )
    .replace(
      'name="iban"',
      'placeholder="BE12 4567 1245 1245 (à vérifier)" name="iban"',
    );
}
async function selectLogo(file) {
  if (!file) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    return toast("Choisissez une image PNG, JPEG ou WebP de moins de 2 Mo.");
  const owner = account?.id;
  logoLoading = true;
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 640 / image.width, 320 / image.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    const data = canvas.toDataURL("image/png");
    if (!safeLogo(data))
      throw Error(
        "Image trop volumineuse après réduction. Choisissez un logo plus simple.",
      );
    if (account?.id !== owner) return;
    logoDraft = data;
    logoDirty = true;
    $("#logo-preview").innerHTML = logoHTML(data);
  } catch (error) {
    toast(error.message || "Impossible de lire cette image.");
  } finally {
    logoLoading = false;
  }
}
function removeLogo() {
  logoDraft = null;
  logoDirty = true;
  $("#logo-preview").innerHTML = "<p>Aucun logo sélectionné.</p>";
}
function validBelgianIBAN(value) {
  const iban = String(value || "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!/^BE\d{14}$/.test(iban)) return false;
  const digits = iban.slice(4) + "1114" + iban.slice(2, 4);
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  return (
    remainder === 1 &&
    (Number(iban.slice(4, 14)) % 97 || 97) === Number(iban.slice(14))
  );
}
function epcPayload(d, biz) {
  if (!validBelgianIBAN(biz.iban))
    throw Error(
      "QR de paiement indisponible : renseignez un IBAN belge valide dans Mon entreprise.",
    );
  const name = String(biz.name || "").trim(),
    reference = String(d.id || "");
  const amount = totals(d).total;
  if (
    !name ||
    name.length > 70 ||
    /[\r\n]/.test(name + reference) ||
    reference.length > 140
  )
    throw Error(
      "Nom du bénéficiaire ou communication incompatible avec le QR.",
    );
  if (!Number.isFinite(amount) || amount < 0.01 || amount > 999999999.99)
    throw Error("Montant incompatible avec le QR de paiement.");
  const payload = [
    "BCD",
    "002",
    "1",
    "SCT",
    "",
    name,
    biz.iban.replace(/\s/g, "").toUpperCase(),
    "EUR" + amount.toFixed(2),
    "",
    "",
    reference,
  ].join("\n");
  if (new TextEncoder().encode(payload).length > 331)
    throw Error("Données trop longues pour le QR de paiement.");
  return payload;
}
function paymentQR(d, biz) {
  if (d.type !== "facture" || d.paid) return "";
  if (!d.dbId)
    return '<p class="muted">Le QR de paiement sera disponible après l’enregistrement et l’attribution du numéro de facture.</p>';
  try {
    const payload = epcPayload(d, biz);
    if (typeof qrcode !== "function")
      throw Error(
        "Générateur QR indisponible. Le paiement par virement reste possible.",
      );
    const qr = qrcode(0, "M");
    qr.addData(payload, "Byte");
    qr.make();
    if (qr.getModuleCount() > 69)
      throw Error("Données trop longues pour le QR de paiement.");
    return `<div class="payment-qr">${qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true })}<div><strong>Payer par virement</strong><p>Scannez avec une application bancaire compatible EPC / SEPA.</p><p>${esc(biz.name)}<br>${esc(biz.iban)}<br>${euro(totals(d).total)} · ${esc(d.id)}</p></div></div>`;
  } catch (error) {
    return `<p class="notice qr-warning">${esc(error.message)}</p>`;
  }
}
function render() {
  originalRender();
  if (account && location.hash === "#recurring")
    $("#main").innerHTML = recurringView();
}
initialize();
