/* ==========================================================================
   ODONTO PRIME EXCELLENCE — Script principal (revisado)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Preferência de movimento reduzido ---------------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Loading screen ---------------- */
  const loader = document.getElementById('loader');
  if (loader) {
    const MIN_DISPLAY_MS = 400;
    const shownAt = performance.now();
    const hideLoader = () => {
      const elapsed = performance.now() - shownAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        loader.classList.add('is-hidden');
        loader.setAttribute('aria-hidden', 'true');
        // Remove do DOM após a transição de opacidade (ver style.css) para liberar recursos
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      }, wait);
    };
    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', hideLoader, { once: true });
  }

  /* ---------------- Ano atual no rodapé ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Navbar: efeito ao rolar ---------------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  onScroll();
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => { onScroll(); scrollTicking = false; });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ---------------- Focus trap (utilitário para diálogos) ---------------- */
  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function createFocusTrap(container) {
    let handler = null;
    return {
      activate() {
        handler = (e) => {
          if (e.key !== 'Tab') return;
          const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter((el) => el.offsetParent !== null);
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        };
        container.addEventListener('keydown', handler);
      },
      deactivate() {
        if (handler) container.removeEventListener('keydown', handler);
        handler = null;
      },
    };
  }

  /* ---------------- Menu mobile (premium) ---------------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('navOverlay');
  const navClose = document.getElementById('navClose');
  const navMenuTrap = navMenu ? createFocusTrap(navMenu) : null;
  const isMobileNav = () => window.matchMedia('(max-width: 960px)').matches;

  const openMenu = () => {
    navMenu.classList.add('is-open');
    navOverlay.classList.add('is-visible');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Fechar menu de navegação');
    navOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    // O painel só se comporta como diálogo modal no layout mobile (off-canvas);
    // no desktop ele é uma barra de navegação inline comum.
    if (isMobileNav()) {
      navMenu.setAttribute('role', 'dialog');
      navMenu.setAttribute('aria-modal', 'true');
      if (navMenuTrap) navMenuTrap.activate();
    }
  };
  const closeMenu = () => {
    navMenu.classList.remove('is-open');
    navOverlay.classList.remove('is-visible');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu de navegação');
    navOverlay.setAttribute('aria-hidden', 'true');
    navMenu.removeAttribute('role');
    navMenu.removeAttribute('aria-modal');
    if (navMenuTrap) navMenuTrap.deactivate();
    if (!document.body.dataset.servicesOpen) {
      document.body.classList.remove('no-scroll');
    }
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    if (navClose) navClose.addEventListener('click', closeMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);

    // Fecha ao clicar em qualquer link do menu
    // (se for o link do catálogo, o handler dedicado cuidará de abrir o modal de serviços)
    navMenu.querySelectorAll('a.nav__link').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------------- Botão voltar ao topo ---------------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 500) backToTop.classList.add('is-visible');
      else backToTop.classList.remove('is-visible');
    };
    toggleBackToTop();
    let backToTopTicking = false;
    window.addEventListener('scroll', () => {
      if (!backToTopTicking) {
        requestAnimationFrame(() => { toggleBackToTop(); backToTopTicking = false; });
        backToTopTicking = true;
      }
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------------- Animações de entrada ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = (index % 4) * 90;
          setTimeout(() => el.classList.add('is-visible'), delay);
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------- Contadores animados ---------------- */
  const counters = document.querySelectorAll('.stat__number');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion) {
      el.textContent = target.toLocaleString('pt-BR') + suffix;
      return;
    }
    const duration = 1800;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('pt-BR') + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('pt-BR') + suffix;
    };
    requestAnimationFrame(step);
  };

  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------------- Carrossel Antes/Depois ---------------- */
  const track = document.getElementById('baTrack');
  const dotsWrap = document.getElementById('baDots');
  const prevBtn = document.getElementById('baPrev');
  const nextBtn = document.getElementById('baNext');

  if (track && dotsWrap && prevBtn && nextBtn) {
    const slides = Array.from(track.children);
    let current = 0;
    let autoplayTimer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }
    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(() => goTo(current + 1), 5500);
    }
    function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    prevBtn.addEventListener('click', () => { goTo(current - 1); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); restartAutoplay(); });

    const sliderEl = track.closest('.ba-slider');
    sliderEl.addEventListener('mouseenter', stopAutoplay);
    sliderEl.addEventListener('mouseleave', startAutoplay);
    sliderEl.addEventListener('focusin', stopAutoplay);
    sliderEl.addEventListener('focusout', startAutoplay);

    let startX = 0, isDragging = false;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX; isDragging = true; stopAutoplay();
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 50) goTo(current - 1);
      else if (diff < -50) goTo(current + 1);
      isDragging = false; startAutoplay();
    });

    goTo(0);
    startAutoplay();
  }

  /* ---------------- FAQ (acordeão) ---------------- */
  const accordion = document.getElementById('accordion');
  if (accordion) {
    const triggers = accordion.querySelectorAll('.accordion__trigger');

    const setPanelState = (trigger, panel, open) => {
      trigger.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.style.maxHeight = open ? `${panel.scrollHeight}px` : null;
    };

    triggers.forEach((trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) panel.setAttribute('aria-hidden', 'true');
      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        triggers.forEach((t) => {
          if (t !== trigger) {
            const p = document.getElementById(t.getAttribute('aria-controls'));
            if (p) setPanelState(t, p, false);
          }
        });
        if (panel) setPanelState(trigger, panel, !isOpen);
      });
    });

    // Recalcula a altura do painel aberto ao redimensionar (ex.: rotação do dispositivo,
    // troca de fonte), evitando que o conteúdo fique cortado ou com espaço sobrando
    let resizeTicking = false;
    window.addEventListener('resize', () => {
      if (resizeTicking) return;
      resizeTicking = true;
      requestAnimationFrame(() => {
        const openTrigger = Array.from(triggers).find((t) => t.getAttribute('aria-expanded') === 'true');
        if (openTrigger) {
          const panel = document.getElementById(openTrigger.getAttribute('aria-controls'));
          if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
        resizeTicking = false;
      });
    });
  }

  /* ---------------- Formulário de agendamento ---------------- */
  const form = document.getElementById('scheduleForm');
  const feedback = document.getElementById('formFeedback');

  if (form) {
    const dateInput = form.querySelector('#data');
    if (dateInput) {
      const now = new Date();
      const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      dateInput.setAttribute('min', localToday);
    }

    // Máscara simples para telefone (BR)
    const telInput = form.querySelector('#telefone');
    if (telInput) {
      telInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
        else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
        else if (v.length > 0) v = v.replace(/(\d{0,2}).*/, '($1');
        e.target.value = v;
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const nome = form.nome.value.trim().split(' ')[0];
      feedback.textContent = `Obrigado, ${nome}! Sua solicitação foi recebida — em breve entraremos em contato para confirmar o agendamento.`;
      feedback.style.color = 'var(--blue-dark)';
      form.reset();
      setTimeout(() => { if (feedback) feedback.textContent = ''; }, 8000);
    });
  }

  /* ==========================================================================
     CATÁLOGO DE SERVIÇOS
     ========================================================================== */
  const servicesModal = document.getElementById('servicesModal');
  const servicesGrid = document.getElementById('servicesGrid');
  const servicesTabs = document.getElementById('servicesTabs');
  const servicesClose = document.getElementById('servicesClose');
  const servicesBack = document.getElementById('servicesBack');

  const CATALOG = [
    {
      category: 'Limpeza e Prevenção',
      items: [
        { name: 'Profilaxia + Aplicação de Flúor', desc: 'Limpeza profissional com remoção de placa, tártaro e polimento, seguida de fluoretação para fortalecer o esmalte.', price: 'R$ 240', duration: '45 min' },
        { name: 'Raspagem Supragengival Completa', desc: 'Remoção detalhada de tártaro em toda a arcada, indicada em manutenção periodontal.', price: 'R$ 480', duration: '1h' },
        { name: 'Selante de Fóssulas e Fissuras', desc: 'Barreira protetora aplicada nos dentes posteriores para prevenir cáries, ideal para crianças e adolescentes.', price: 'R$ 180', duration: '30 min' },
        { name: 'Check-up Preventivo Anual', desc: 'Avaliação completa com radiografia digital, exame periodontal e plano de cuidados personalizado.', price: 'R$ 390', duration: '1h' },
      ],
    },
    {
      category: 'Clareamento Dental',
      items: [
        { name: 'Clareamento a Laser em Consultório', desc: 'Sessão única com gel de alta concentração ativado por LED, resultados imediatos e seguros.', price: 'R$ 1.490', duration: '1h30' },
        { name: 'Clareamento Caseiro Supervisionado', desc: 'Moldeiras personalizadas + kit de gel clareador para uso domiciliar com acompanhamento clínico.', price: 'R$ 980', duration: '15 dias' },
        { name: 'Clareamento Combinado Premium', desc: 'Protocolo misto (consultório + caseiro) para resultados intensos e duradouros.', price: 'R$ 2.190', duration: '3 semanas' },
      ],
    },
    {
      category: 'Implantes Dentários',
      items: [
        { name: 'Implante Unitário de Titânio', desc: 'Implante com pilar e coroa em porcelana pura, planejamento digital 3D e cirurgia guiada.', price: 'R$ 3.890', duration: '2 sessões' },
        { name: 'Prótese Protocolo sobre 4 Implantes', desc: 'Reabilitação total da arcada com apenas 4 implantes e prótese fixa em zircônia.', price: 'R$ 24.500', duration: '4 a 6 meses' },
        { name: 'Enxerto Ósseo Guiado', desc: 'Reconstrução óssea com biomateriais para viabilizar implantes em áreas com pouca estrutura.', price: 'R$ 2.400', duration: '1h30' },
        { name: 'Implante com Carga Imediata', desc: 'Instalação de implante e coroa provisória na mesma sessão, quando indicado clinicamente.', price: 'R$ 5.290', duration: '1 sessão' },
      ],
    },
    {
      category: 'Ortodontia',
      items: [
        { name: 'Aparelho Fixo Metálico', desc: 'Tratamento ortodôntico clássico com bráquetes metálicos de alta performance. Valor mensal.', price: 'R$ 320 /mês', duration: '18 a 24 meses' },
        { name: 'Aparelho Estético de Safira', desc: 'Bráquetes transparentes de safira, praticamente invisíveis e resistentes a manchas. Valor mensal.', price: 'R$ 490 /mês', duration: '18 a 24 meses' },
        { name: 'Alinhadores Invisíveis Premium', desc: 'Placas removíveis e transparentes planejadas por escaneamento 3D. Discrição e conforto totais.', price: 'R$ 12.900', duration: '12 a 18 meses' },
        { name: 'Contenção Ortodôntica Fixa/Móvel', desc: 'Aparelho de contenção após o tratamento para manter os resultados a longo prazo.', price: 'R$ 780', duration: '1 sessão' },
      ],
    },
    {
      category: 'Estética Dental',
      items: [
        { name: 'Restauração Estética em Resina', desc: 'Restaurações invisíveis em resina composta nanoparticulada, com acabamento espelhado.', price: 'R$ 380', duration: '45 min' },
        { name: 'Faceta Direta em Resina', desc: 'Reconstrução estética do dente feita em uma única sessão, sem desgaste dentário.', price: 'R$ 890', duration: '1h30' },
        { name: 'Design Digital do Sorriso (DSD)', desc: 'Planejamento estético digital com prévia visual do resultado antes do início do tratamento.', price: 'R$ 690', duration: '1h' },
        { name: 'Harmonização Orofacial Completa', desc: 'Protocolo com toxina botulínica e preenchedores para equilibrar traços faciais e realçar o sorriso.', price: 'R$ 2.490', duration: '1h' },
      ],
    },
    {
      category: 'Lentes de Contato Dental',
      items: [
        { name: 'Lente de Contato Dental (Unidade)', desc: 'Lâmina ultrafina de porcelana feldspática, mínima ou nenhuma preparação dental.', price: 'R$ 2.190', duration: '3 sessões' },
        { name: 'Kit 8 Lentes (Sorriso Superior)', desc: 'Reabilitação estética do sorriso superior com 8 lentes de contato dental sob medida.', price: 'R$ 15.900', duration: '4 sessões' },
        { name: 'Kit 10 Lentes Premium', desc: 'Sorriso completo com 10 lentes em porcelana e-max, planejamento digital e enceramento diagnóstico.', price: 'R$ 19.900', duration: '4 sessões' },
      ],
    },
    {
      category: 'Restaurações',
      items: [
        { name: 'Restauração em Resina Composta', desc: 'Tratamento de cáries com resinas fotopolimerizáveis de alta estética e resistência.', price: 'R$ 320', duration: '40 min' },
        { name: 'Inlay/Onlay em Porcelana', desc: 'Restaurações indiretas em porcelana pura para grandes reconstruções posteriores.', price: 'R$ 1.590', duration: '2 sessões' },
        { name: 'Coroa Total em Zircônia', desc: 'Coroa monolítica em zircônia translúcida, alta resistência e biocompatibilidade.', price: 'R$ 2.290', duration: '2 sessões' },
      ],
    },
    {
      category: 'Tratamento de Canal',
      items: [
        { name: 'Endodontia Unirradicular', desc: 'Tratamento de canal em dente com uma raiz, com instrumentação rotatória e microscopia.', price: 'R$ 1.180', duration: '1h' },
        { name: 'Endodontia Multirradicular', desc: 'Tratamento endodôntico em molares (múltiplas raízes) com localizador apical eletrônico.', price: 'R$ 1.690', duration: '1h30' },
        { name: 'Retratamento Endodôntico', desc: 'Correção de tratamentos de canal anteriores com técnicas avançadas de desobturação.', price: 'R$ 2.190', duration: '1h30' },
      ],
    },
    {
      category: 'Odontopediatria',
      items: [
        { name: 'Primeira Consulta Infantil', desc: 'Avaliação lúdica e educativa para crianças, com orientação de higiene aos pais.', price: 'R$ 220', duration: '45 min' },
        { name: 'Aplicação de Verniz Fluoretado', desc: 'Reforço do esmalte infantil contra cáries com verniz de alta concentração de flúor.', price: 'R$ 180', duration: '20 min' },
        { name: 'Tratamento Restaurador Atraumático', desc: 'Restauração minimamente invasiva, ideal para os primeiros contatos da criança com o dentista.', price: 'R$ 290', duration: '30 min' },
      ],
    },
    {
      category: 'Periodontia',
      items: [
        { name: 'Tratamento de Gengivite', desc: 'Raspagem supragengival e orientação de higiene para controle da inflamação.', price: 'R$ 480', duration: '1h' },
        { name: 'Tratamento de Periodontite', desc: 'Raspagem subgengival por sextantes, com sessões acompanhadas e reavaliação clínica.', price: 'R$ 1.980', duration: '4 sessões' },
        { name: 'Gengivoplastia Estética', desc: 'Recontorno gengival para harmonização do sorriso e correção de sorriso gengival.', price: 'R$ 1.490', duration: '1h' },
      ],
    },
  ];

  function renderCatalog(activeCategory = 'todos') {
    if (!servicesGrid || !servicesTabs) return;

    // Tabs
    servicesTabs.innerHTML = '';
    const allTab = document.createElement('button');
    allTab.type = 'button';
    allTab.className = 'services__tab' + (activeCategory === 'todos' ? ' is-active' : '');
    allTab.textContent = 'Todos';
    allTab.addEventListener('click', () => renderCatalog('todos'));
    servicesTabs.appendChild(allTab);
    CATALOG.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'services__tab' + (activeCategory === cat.category ? ' is-active' : '');
      btn.textContent = cat.category;
      btn.addEventListener('click', () => renderCatalog(cat.category));
      servicesTabs.appendChild(btn);
    });

    // Grid
    servicesGrid.innerHTML = '';
    const cats = activeCategory === 'todos' ? CATALOG : CATALOG.filter((c) => c.category === activeCategory);
    cats.forEach((cat) => {
      cat.items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'service-item';
        card.innerHTML = `
          <span class="service-item__cat">${cat.category}</span>
          <h3 class="service-item__name">${item.name}</h3>
          <p class="service-item__desc">${item.desc}</p>
          <div class="service-item__footer">
            <div>
              <span class="service-item__price-from">A partir de</span>
              <span class="service-item__price">${item.price}</span>
            </div>
            <span class="service-item__duration" aria-label="Duração estimada">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              ${item.duration}
            </span>
          </div>
        `;
        servicesGrid.appendChild(card);
      });
    });

    // Rola o topo do conteúdo do modal
    const body = document.querySelector('.services__body');
    if (body) body.scrollTop = 0;
  }

  let previousFocus = null;
  const servicesTrap = servicesModal ? createFocusTrap(servicesModal) : null;

  function openServices() {
    if (!servicesModal) return;
    previousFocus = document.activeElement;
    if (!servicesGrid.children.length) renderCatalog('todos');
    servicesModal.classList.add('is-open');
    servicesModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    document.body.dataset.servicesOpen = 'true';
    // Fecha menu mobile caso esteja aberto
    if (navMenu && navMenu.classList.contains('is-open')) closeMenu();
    if (servicesTrap) servicesTrap.activate();
    setTimeout(() => { if (servicesClose) servicesClose.focus(); }, 100);
  }

  function closeServices() {
    if (!servicesModal) return;
    servicesModal.classList.remove('is-open');
    servicesModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    delete document.body.dataset.servicesOpen;
    if (servicesTrap) servicesTrap.deactivate();
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  // Abrir a partir de qualquer elemento com [data-open-services]
  document.querySelectorAll('[data-open-services]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openServices();
    });
  });

  // Fechar
  if (servicesClose) servicesClose.addEventListener('click', closeServices);
  if (servicesBack) servicesBack.addEventListener('click', closeServices);
  document.querySelectorAll('[data-close-services]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Se for o CTA de agendamento, deixa a âncora funcionar depois de fechar
      if (el.getAttribute('href')) {
        closeServices();
      } else {
        e.preventDefault();
        closeServices();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && servicesModal && servicesModal.classList.contains('is-open')) {
      closeServices();
    }
  });

});