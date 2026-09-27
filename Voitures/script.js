/* ============================================
   AUTOPRIME – JAVASCRIPT + GOOGLE SHEETS
   ============================================ */

/* ============================================
   ⚙️ CONFIGURATION – À MODIFIER PAR LE CLIENT
   Remplacer l'ID ci-dessous par celui du vrai Google Sheet
   ============================================ */
const SHEET_ID = 'VOTRE_SHEET_ID_ICI';
const SHEET_NAME = 'Voitures'; // Nom de l'onglet dans le Google Sheet

// URL de l'API Google Sheets (lecture publique)
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

/* ============================================
   DONNÉES DE DÉMONSTRATION
   Utilisées si le Google Sheet n'est pas encore configuré
   ============================================ */
const DEMO_VOITURES = [
    {
        marque: 'BMW', modele: 'Série 5 530d xDrive', annee: '2021',
        km: '48 000', carburant: 'Diesel', boite: 'Automatique',
        prix: '34 900', categorie: 'Berline', badge: 'Nouveau',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80'
    },
    {
        marque: 'Audi', modele: 'Q5 40 TDI Quattro', annee: '2022',
        km: '32 000', carburant: 'Diesel', boite: 'Automatique',
        prix: '38 500', categorie: 'SUV', badge: 'Promo',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80'
    },
    {
        marque: 'Peugeot', modele: '208 GT Line 1.2 PureTech', annee: '2020',
        km: '41 000', carburant: 'Essence', boite: 'Manuelle',
        prix: '14 900', categorie: 'Citadine', badge: '',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80'
    },
    {
        marque: 'Toyota', modele: 'RAV4 Hybrid AWD-i', annee: '2021',
        km: '55 000', carburant: 'Hybride', boite: 'Automatique',
        prix: '29 900', categorie: 'SUV', badge: 'Hybride',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80'
    },
    {
        marque: 'Mercedes-Benz', modele: 'Classe C 220d AMG Line', annee: '2023',
        km: '18 000', carburant: 'Diesel', boite: 'Automatique',
        prix: '42 000', categorie: 'Premium', badge: 'Nouveau',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80'
    },
    {
        marque: 'Renault', modele: 'Clio V Intens TCe 100', annee: '2020',
        km: '38 000', carburant: 'Essence', boite: 'Manuelle',
        prix: '13 500', categorie: 'Citadine', badge: '',
        dispo: 'Oui',
        photo: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=80'
    }
];

/* ============================================
   ÉTAT GLOBAL
   ============================================ */
let allVoitures = [];
let filteredVoitures = [];
let activeCategory = 'all';

/* ============================================
   CHARGEMENT DES VOITURES
   ============================================ */
async function loadVoitures() {
    const loading = document.getElementById('carsLoading');
    const error = document.getElementById('carsError');
    const grid = document.getElementById('carsGrid');
    const empty = document.getElementById('carsEmpty');
    const more = document.getElementById('stockMore');

    // Afficher le spinner
    loading.style.display = 'block';
    error.style.display = 'none';
    grid.style.display = 'none';
    empty.style.display = 'none';
    more.style.display = 'none';

    // Si le Sheet ID n'est pas configuré → utiliser les données de démo
    if (SHEET_ID === 'VOTRE_SHEET_ID_ICI') {
        console.info('ℹ️ Mode démo : configurez votre Google Sheet ID dans script.js');
        setTimeout(() => {
            allVoitures = DEMO_VOITURES;
            filteredVoitures = [...allVoitures];
            loading.style.display = 'none';
            renderVoitures(filteredVoitures);
            populateMarqueFilter();
        }, 800); // Simuler un délai de chargement
        return;
    }

    // Charger depuis Google Sheets
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Erreur réseau');

        const text = await response.text();
        // Google renvoie du JSON enveloppé dans une fonction JS
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;
        const cols = json.table.cols.map(c => c.label.toLowerCase().trim());

        allVoitures = rows.map(row => {
            const obj = {};
            cols.forEach((col, i) => {
                obj[col] = row.c[i]?.v?.toString().trim() || '';
            });
            return obj;
        }).filter(v => v.marque && v.modele); // Ignorer les lignes vides

        filteredVoitures = [...allVoitures];
        loading.style.display = 'none';
        renderVoitures(filteredVoitures);
        populateMarqueFilter();

    } catch (err) {
        console.error('Erreur chargement Google Sheets:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

/* ============================================
   RENDU DES CARTES VOITURES
   ============================================ */
function renderVoitures(voitures) {
    const grid = document.getElementById('carsGrid');
    const empty = document.getElementById('carsEmpty');
    const more = document.getElementById('stockMore');

    if (voitures.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        more.style.display = 'none';
        return;
    }

    grid.innerHTML = voitures.map(v => createCarCard(v)).join('');
    grid.style.display = 'grid';
    empty.style.display = 'none';
    more.style.display = 'block';

    // Animer les cartes
    grid.querySelectorAll('.car-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.4s ease ${i * 60}ms, transform 0.4s ease ${i * 60}ms`;
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    // Réattacher les événements favoris
    grid.querySelectorAll('.car-fav').forEach(fav => {
        fav.addEventListener('click', () => {
            fav.classList.toggle('liked');
            const icon = fav.querySelector('i');
            if (fav.classList.contains('liked')) {
                icon.classList.replace('far', 'fas');
                fav.style.color = '#EF4444';
            } else {
                icon.classList.replace('fas', 'far');
                fav.style.color = '';
            }
        });
    });
}

function createCarCard(v) {
    const badgeColors = {
        'Nouveau': 'new', 'Promo': 'promo', 'Hybride': 'eco',
        'Électrique': 'eco', 'Vendu': 'promo'
    };
    const badgeClass = badgeColors[v.badge] || 'new';
    const badgeHtml = v.badge ? `<div class="car-badge ${badgeClass}">${v.badge}</div>` : '';
    const photoUrl = v.photo || `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80`;
    const prix = v.prix ? parseInt(v.prix.toString().replace(/\D/g, '')).toLocaleString('fr-FR') + ' €' : 'Prix sur demande';
    const km = v.km ? parseInt(v.km.toString().replace(/\D/g, '')).toLocaleString('fr-FR') + ' km' : '–';
    const dispo = (v.dispo || 'Oui').toLowerCase() !== 'non' && (v.dispo || 'Oui').toLowerCase() !== 'vendu';

    return `
    <div class="car-card" data-cat="${v.categorie || ''}">
        <div class="car-img-wrap">
            <img src="${photoUrl}" alt="${v.marque} ${v.modele}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80'">
            ${badgeHtml}
            <div class="car-fav"><i class="far fa-heart"></i></div>
            <div class="car-overlay"><a href="#contact" class="car-overlay-btn">Voir détails</a></div>
        </div>
        <div class="car-info">
            <div class="car-top">
                <div>
                    <p class="car-brand">${v.marque}</p>
                    <h3 class="car-name">${v.modele}</h3>
                </div>
                <div class="car-price">${prix}</div>
            </div>
            <div class="car-specs">
                <span><i class="fas fa-calendar-alt"></i> ${v.annee || '–'}</span>
                <span><i class="fas fa-tachometer-alt"></i> ${km}</span>
                <span><i class="fas fa-gas-pump"></i> ${v.carburant || '–'}</span>
                <span><i class="fas fa-cog"></i> ${v.boite || '–'}</span>
            </div>
            <div class="car-footer">
                <span class="car-dispo" style="${dispo ? '' : 'color:#EF4444'}">
                    <i class="fas fa-circle"></i> ${dispo ? 'Disponible' : 'Vendu'}
                </span>
                <a href="#contact" class="car-btn">Contacter</a>
            </div>
        </div>
    </div>`;
}

/* ============================================
   FILTRES
   ============================================ */
function populateMarqueFilter() {
    const select = document.getElementById('filterMarque');
    const marques = [...new Set(allVoitures.map(v => v.marque))].sort();
    marques.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
    });
}

function applyFilters() {
    const marque = document.getElementById('filterMarque').value;
    const carburant = document.getElementById('filterCarburant').value;
    const budget = parseInt(document.getElementById('filterBudget').value) || Infinity;
    const anneeMin = parseInt(document.getElementById('filterAnnee').value) || 0;

    filteredVoitures = allVoitures.filter(v => {
        const prixNum = parseInt((v.prix || '0').toString().replace(/\D/g, '')) || 0;
        const anneeNum = parseInt(v.annee) || 0;
        const catMatch = activeCategory === 'all' || (v.categorie || '').toLowerCase() === activeCategory.toLowerCase();
        return (
            (!marque || v.marque === marque) &&
            (!carburant || v.carburant === carburant) &&
            (prixNum <= budget) &&
            (anneeNum >= anneeMin) &&
            catMatch
        );
    });

    renderVoitures(filteredVoitures);
}

function resetFilters() {
    document.getElementById('filterMarque').value = '';
    document.getElementById('filterCarburant').value = '';
    document.getElementById('filterBudget').value = '';
    document.getElementById('filterAnnee').value = '';
    activeCategory = 'all';
    document.querySelectorAll('.sf-tag').forEach(b => b.classList.toggle('active', b.dataset.f === 'all'));
    filteredVoitures = [...allVoitures];
    renderVoitures(filteredVoitures);
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {

    // Charger les voitures
    loadVoitures();

    /* ---- NAV SCROLL ---- */
    const nav = document.getElementById('nav');
    const btt = document.getElementById('btt');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('solid', window.scrollY > 60);
        btt.classList.toggle('show', window.scrollY > 500);
    });

    /* ---- BURGER ---- */
    const burger = document.getElementById('burger');
    const navMenu = document.getElementById('navMenu');
    burger.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        burger.classList.toggle('active');
    });
    navMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            navMenu.classList.remove('open');
            burger.classList.remove('active');
        });
    });

    /* ---- HERO ZOOM ---- */
    setTimeout(() => {
        const heroBg = document.getElementById('heroBg');
        if (heroBg) heroBg.classList.add('zoomed');
    }, 100);

    /* ---- HERO COUNTERS ---- */
    const counters = document.querySelectorAll('.hn-val[data-target]');
    let countersStarted = false;
    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;
        counters.forEach(el => {
            const target = parseInt(el.dataset.target);
            const suffix = el.closest('.hn-item')?.querySelector('.hn-label')?.textContent.includes('%') ? '%' : '+';
            let current = 0;
            const increment = target / (2000 / 16);
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target.toLocaleString('fr-FR') + suffix;
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current).toLocaleString('fr-FR') + suffix;
                }
            }, 16);
        });
    }
    const heroObs = new IntersectionObserver(e => { if (e[0].isIntersecting) startCounters(); }, { threshold: 0.3 });
    const heroSection = document.querySelector('.hero');
    if (heroSection) heroObs.observe(heroSection);

    /* ---- CATEGORY FILTERS ---- */
    document.querySelectorAll('.sf-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sf-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.f;
            applyFilters();
        });
    });

    /* ---- SEARCH BUTTON ---- */
    document.getElementById('searchBtn')?.addEventListener('click', () => {
        applyFilters();
        document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ---- RATING BARS ---- */
    const barsObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.asb-fill').forEach(fill => {
                    const w = fill.style.width;
                    fill.style.width = '0';
                    setTimeout(() => fill.style.width = w, 100);
                });
                barsObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    const scoreBar = document.querySelector('.avis-score-bar');
    if (scoreBar) barsObs.observe(scoreBar);

    /* ---- SMOOTH SCROLL ---- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            }
        });
    });

    /* ---- ÉTAT BUTTONS ---- */
    document.querySelectorAll('.etat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.etat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    /* ---- CONTACT TABS ---- */
    document.querySelectorAll('.cf-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cf-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const vf = document.getElementById('vehiculeField');
            if (vf) {
                const type = tab.dataset.tab;
                vf.querySelector('input').placeholder =
                    type === 'achat' ? 'Ex: BMW Série 3, 2020, diesel...' :
                    type === 'vente' ? 'Ex: Peugeot 308, 2019, 65 000 km...' :
                    'Précisez votre demande...';
            }
        });
    });

    /* ---- PARALLAX ---- */
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero-bg');
        if (hero && window.scrollY < window.innerHeight) {
            hero.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }
    });

    /* ---- SCROLL REVEAL (sections) ---- */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.why-card, .avis-card, .rs-step, .ci-item').forEach((el, i) => {
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, i * 80);
                });
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.pourquoi, .avis, .racheter, .contact').forEach(section => {
        section.querySelectorAll('.why-card, .avis-card, .rs-step, .ci-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
        revealObs.observe(section);
    });

    /* ---- CLOSE MOBILE NAV ON OUTSIDE CLICK ---- */
    document.addEventListener('click', e => {
        const navMenu = document.getElementById('navMenu');
        const burger = document.getElementById('burger');
        if (navMenu?.classList.contains('open') && !navMenu.contains(e.target) && !burger.contains(e.target)) {
            navMenu.classList.remove('open');
            burger.classList.remove('active');
        }
    });
});

/* ============================================
   FORMS
   ============================================ */
document.getElementById('estimForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.ef-submit');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Recevoir mon estimation gratuite';
        btn.disabled = false;
        showModal('Demande reçue !', 'Merci ! Notre équipe analysera votre véhicule et vous enverra une estimation sous 24h.');
        this.reset();
        document.querySelectorAll('.etat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    }, 1500);
});

document.getElementById('contactForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.cf-submit');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = orig;
        btn.disabled = false;
        showModal('Message envoyé !', 'Merci pour votre message ! Notre équipe vous recontactera dans les plus brefs délais.');
        this.reset();
    }, 1200);
});

function showModal(title, text) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modalBg').classList.add('show');
}
function closeModal() { document.getElementById('modalBg').classList.remove('show'); }
document.getElementById('modalBg')?.addEventListener('click', function(e) { if (e.target === this) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });