/* ============================================
   AUTOPRIME – JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

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

    /* ---- HERO IMAGE ZOOM ---- */
    setTimeout(() => {
        const heroBg = document.getElementById('heroBg');
        if (heroBg) heroBg.classList.add('zoomed');
    }, 100);

    /* ---- HERO COUNTER ANIMATION ---- */
    const counters = document.querySelectorAll('.hn-val[data-target]');
    let countersStarted = false;

    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;
        counters.forEach(el => {
            const target = parseInt(el.dataset.target);
            const suffix = target >= 1000 ? '+' : (el.closest('.hn-item')?.querySelector('.hn-label')?.textContent.includes('%') ? '%' : '+');
            let current = 0;
            const duration = 2000;
            const increment = target / (duration / 16);
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

    // Start counters when hero is visible
    const heroObs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) startCounters();
    }, { threshold: 0.3 });
    const heroSection = document.querySelector('.hero');
    if (heroSection) heroObs.observe(heroSection);

    /* ---- SCROLL REVEAL ---- */
    const revealEls = document.querySelectorAll(
        '.car-card, .why-card, .avis-card, .rs-step, .ci-item, .contact-infos, .racheter-garanties span'
    );
    revealEls.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Stagger children in grids
    document.querySelectorAll('.cars-grid, .why-grid, .avis-grid').forEach(grid => {
        const children = grid.querySelectorAll(':scope > *');
        children.forEach((child, i) => {
            child.style.transitionDelay = `${i * 80}ms`;
            revealObs.observe(child);
        });
    });

    document.querySelectorAll('.rs-step, .ci-item').forEach((el, i) => {
        el.style.transitionDelay = `${i * 80}ms`;
        revealObs.observe(el);
    });

    /* ---- RATING BARS ANIMATION ---- */
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
                const top = target.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    /* ---- ACTIVE NAV ---- */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 120) current = s.id;
        });
        navLinks.forEach(a => {
            a.style.color = '';
            if (a.getAttribute('href') === '#' + current) a.style.color = 'var(--white)';
        });
    });

    /* ---- STOCK FILTER ---- */
    const filterBtns = document.querySelectorAll('.sf-tag');
    const carCards = document.querySelectorAll('.car-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.f;
            carCards.forEach(card => {
                const cats = card.dataset.cat || '';
                const show = filter === 'all' || cats.includes(filter);
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                if (show) {
                    card.style.opacity = '1';
                    card.style.transform = '';
                    card.style.display = '';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        if (!card.dataset.cat.includes(document.querySelector('.sf-tag.active')?.dataset.f || 'all')) {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });
    });

    /* ---- FAV TOGGLE ---- */
    document.querySelectorAll('.car-fav').forEach(fav => {
        fav.addEventListener('click', () => {
            fav.classList.toggle('liked');
            const icon = fav.querySelector('i');
            if (fav.classList.contains('liked')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                fav.style.color = '#EF4444';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                fav.style.color = '';
            }
        });
    });

    /* ---- SEARCH BUTTON ---- */
    document.querySelector('.sf-btn')?.addEventListener('click', () => {
        const btn = document.querySelector('.sf-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recherche...';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-search"></i> Rechercher';
            document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1200);
    });

    /* ---- ÉTAT BUTTONS ---- */
    document.querySelectorAll('.etat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.etat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    /* ---- CONTACT TABS ---- */
    const cfTabs = document.querySelectorAll('.cf-tab');
    cfTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            cfTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const vehiculeField = document.getElementById('vehiculeField');
            if (vehiculeField) {
                const type = tab.dataset.tab;
                if (type === 'achat') vehiculeField.querySelector('input').placeholder = 'Ex: BMW Série 3, 2020, diesel...';
                else if (type === 'vente') vehiculeField.querySelector('input').placeholder = 'Ex: Peugeot 308, 2019, 65 000 km...';
                else vehiculeField.querySelector('input').placeholder = 'Précisez votre demande...';
            }
        });
    });

    /* ---- PARALLAX HERO ---- */
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero-bg');
        if (hero && window.scrollY < window.innerHeight) {
            hero.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }
    });

    /* ---- NAVBAR HIGHLIGHT ON SCROLL ---- */
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const heroH = document.querySelector('.hero')?.offsetHeight || 0;
        if (scrolled > heroH * 0.8) {
            nav.style.background = '';
        }
    });

});

/* ============================================
   FORMS
   ============================================ */

// Estimation form
document.getElementById('estimForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.ef-submit');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Recevoir mon estimation gratuite';
        btn.disabled = false;
        showModal(
            'Demande reçue !',
            'Merci ! Notre équipe analysera votre véhicule et vous enverra une estimation sous 24h. Nous vous contacterons par téléphone.'
        );
        this.reset();
        document.querySelectorAll('.etat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    }, 1500);
});

// Contact form
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.cf-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        const activeTab = document.querySelector('.cf-tab.active')?.dataset.tab;
        let msg = 'Merci pour votre message ! Notre équipe vous recontactera dans les plus brefs délais.';
        if (activeTab === 'achat') msg = 'Merci pour votre intérêt ! Un conseiller vous contactera rapidement pour vous présenter les véhicules disponibles.';
        else if (activeTab === 'vente') msg = 'Merci ! Nous étudierons votre véhicule et vous ferons une offre de rachat sous 24h.';
        showModal('Message envoyé !', msg);
        this.reset();
    }, 1200);
});

function showModal(title, text) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    document.getElementById('modalBg').classList.add('show');
}

function closeModal() {
    document.getElementById('modalBg').classList.remove('show');
}

document.getElementById('modalBg')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

/* ============================================
   MOBILE OVERLAY CLOSE
   ============================================ */
document.addEventListener('click', e => {
    const navMenu = document.getElementById('navMenu');
    const burger = document.getElementById('burger');
    if (navMenu?.classList.contains('open') && !navMenu.contains(e.target) && !burger.contains(e.target)) {
        navMenu.classList.remove('open');
        burger.classList.remove('active');
    }
});