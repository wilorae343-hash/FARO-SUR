/* ============================================================
   COMERCIAL FARO SUR · Lógica de la página + editor integrado
   Sin dependencias. Abre index.html y presiona "Editar página".
   ============================================================ */

(function () {
  'use strict';

  var DEFAULTS = window.FARO_CONFIG || {};
  var LS_KEY = 'faroSur.config.v1';

  /* ---------- Utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(base, over) {
    if (!isObj(over)) return clone(base);
    var out = clone(base);
    Object.keys(over).forEach(function (k) {
      if (isObj(base[k]) && isObj(over[k])) out[k] = merge(base[k], over[k]);
      else out[k] = clone(over[k]);
    });
    return out;
  }
  function getPath(obj, path) {
    return String(path).split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }
  function setPath(obj, path, val) {
    var parts = String(path).split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = val;
  }
  function safeUrl(url, fallback) {
    var s = String(url == null ? '' : url).trim();
    if (!s) return fallback || '#';
    if (/^(https?:\/\/|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(s)) return s;
    if (/^[\w.\-]+\.(html?|php)([?#].*)?$/i.test(s)) return s;
    return fallback || '#';
  }
  function safeImg(url) {
    var s = String(url == null ? '' : url).trim();
    if (!s) return '';
    if (/^(https?:\/\/|data:image\/)/i.test(s)) return s;
    if (/^(\.{0,2}\/)?[\w\-./% ]+\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(s)) return s;
    return '';
  }

  /* ---------- Iconos ---------- */
  var ICONS = {
    search: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.8"/><path d="m13.2 13.2 4 4"/></svg>',
    wa: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.03.24-3.48-.72-2.95-1.16-4.79-4.2-4.93-4.4-.15-.2-1.17-1.56-1.17-2.98s.74-2.12 1-2.4c.26-.3.56-.37.75-.37.19 0 .38 0 .54.01.17.01.4-.07.63.48.24.56.8 1.95.87 2.09.07.14.12.3.02.49-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.35 1.45.3.15.47.12.65-.07.17-.19.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2 .95.3.15.5.22.57.34.07.13.07.76-.17 1.44Z"/></svg>',
    phone: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 4 4l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A15 15 0 0 1 2.5 5.7a2 2 0 0 1 2-2.2Z"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5"/></svg>',
    pin: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M10 17s5.5-4.8 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4.2 5.5 9 5.5 9Z"/><circle cx="10" cy="8" r="2"/></svg>',
    mail: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="m3.5 5.5 6.5 5 6.5-5"/></svg>',
    clock: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 5.5V10l3 2"/></svg>'
  };

  var LIGHTHOUSE =
    '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
    '<path d="M24 16 7 10v6l17 6z" fill="var(--accent)"/>' +
    '<path d="M24 16 41 10v6l-17 6z" fill="var(--accent)" opacity=".58"/>' +
    '<path d="M22 8h4v5h-4z" fill="#fff"/>' +
    '<path d="M20.5 13h7l1.4 4H19.1z" fill="#fff"/>' +
    '<path d="M20 17h8l2.5 19.5h-13z" fill="#fff"/>' +
    '<path d="M18.8 25h10.4l.7 5H18.1z" fill="var(--primary)" opacity=".8"/>' +
    '<rect x="14.5" y="37" width="19" height="3" rx="1.5" fill="#fff"/>' +
    '</svg>';

  var TINTS = ['#EDF4F7', '#FDF3E3', '#EEF3FB', '#F4EDFB', '#ECF7F0', '#FDEFEF'];

  /* ---------- Estado ---------- */
  var cfg;
  try {
    var saved = localStorage.getItem(LS_KEY);
    cfg = saved ? merge(DEFAULTS, JSON.parse(saved)) : clone(DEFAULTS);
  } catch (err) {
    cfg = clone(DEFAULTS);
  }

  var ui = {
    term: '',
    category: '',
    edit: false,
    panel: false,
    tab: 'general'
  };

  var PRESETS = {
    faro: { primary: '#0F2E3E', accent: '#E9A13B', hot: '#C62828', bg: '#F4F6F7' },
    oriental: { primary: '#8E1B1B', accent: '#E9B44C', hot: '#B3261E', bg: '#FAF6F3' },
    jade: { primary: '#124E43', accent: '#D9A441', hot: '#B23A2E', bg: '#F3F7F5' },
    ocean: { primary: '#123A5A', accent: '#4FB3C8', hot: '#D64545', bg: '#F2F7FA' },
    night: { primary: '#1C1C22', accent: '#E0B252', hot: '#C0392B', bg: '#F5F5F4' },
    rose: { primary: '#5B2333', accent: '#E7A3A9', hot: '#C0392B', bg: '#FAF5F5' }
  };
  var PRESET_NAMES = {
    faro: 'Faro', oriental: 'Oriental', jade: 'Jade', ocean: 'Océano', night: 'Nocturno', rose: 'Rosa'
  };

  var TABS = [
    ['general', 'General'],
    ['design', 'Diseño'],
    ['texts', 'Textos'],
    ['nav', 'Menú'],
    ['categories', 'Categorías'],
    ['searches', 'Búsquedas'],
    ['products', 'Productos'],
    ['data', 'Datos']
  ];

  /* ---------- Persistencia ---------- */
  var saveTimer = null;
  var pageTimer = null;
  var toastTimer = null;

  function saveNow() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    } catch (err) {
      toast('No se pudo guardar en el navegador. Descarga tu configuración.');
    }
  }
  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function queuePageRender() {
    clearTimeout(pageTimer);
    pageTimer = setTimeout(renderPage, 90);
  }
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2300);
  }

  /* ---------- Datos derivados ---------- */
  function telHref() {
    return 'tel:' + String((cfg.business && cfg.business.phone) || '').replace(/[^\d+]/g, '');
  }

  function waHref(productName) {
    var digits = String((cfg.business && cfg.business.whatsapp) || '').replace(/\D/g, '');
    var tpl = productName ? cfg.texts.productMessage : cfg.texts.whatsappMessage;
    var msg = String(tpl || '').replace(/\{producto\}/g, productName || '');
    if (!digits) return '#contacto';
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg);
  }

  function filteredProducts() {
    var term = ui.term.toLowerCase().trim();
    return (cfg.products || []).filter(function (p) {
      var inCat = !ui.category || p.category === ui.category;
      var hay = [p.name, p.category, p.badge, p.emoji].join(' ').toLowerCase();
      var inTerm = !term || hay.indexOf(term) !== -1;
      return inCat && inTerm;
    });
  }

  function badgeClass(badge) {
    var s = String(badge || '').toLowerCase();
    if (s.indexOf('oferta') !== -1 || s.indexOf('sale') !== -1 || s.indexOf('%') !== -1) return 'is-offer';
    if (s.indexOf('nuevo') !== -1 || s.indexOf('new') !== -1) return 'is-new';
    return 'is-top';
  }

  /* ---------- Render de la página ---------- */
  function applyTheme() {
    var t = cfg.theme || {};
    var r = document.documentElement.style;
    ['primary', 'accent', 'hot', 'bg'].forEach(function (k) {
      if (t[k]) r.setProperty('--' + k, t[k]);
    });
    r.setProperty('--radius', (Number(t.radius) || 0) + 'px');
    if (t.font) r.setProperty('--font', t.font);
    document.body.classList.toggle('no-sticky', !t.stickyHeader);
    document.body.classList.toggle('no-shadow', !t.shadows);
  }

  function logoMarkup() {
    var b = cfg.business;
    var img = safeImg(b.logoImage);
    if (img) {
      return '<span class="brand-mark brand-mark-img"><img src="' + esc(img) + '" alt="' + esc(b.name) + '" onerror="this.remove()"></span>';
    }
    if (b.logoEmoji) {
      return '<span class="brand-mark"><span class="brand-emoji">' + esc(b.logoEmoji) + '</span></span>';
    }
    return '<span class="brand-mark" aria-hidden="true">' + LIGHTHOUSE + '</span>';
  }

  function brandBlock() {
    var b = cfg.business;
    return '' +
      '<a class="brand" href="#top">' +
        logoMarkup() +
        '<span class="brand-text">' +
          '<span class="brand-kicker" data-edit="business.logoKicker">' + esc(b.logoKicker) + '</span>' +
          '<span class="brand-name" data-edit="business.logoTitle">' + esc(b.logoTitle) + '</span>' +
        '</span>' +
      '</a>';
  }

  function renderTopbar() {
    if (!cfg.topbar.enabled) return '';
    var b = cfg.business;
    return '' +
      '<div class="topbar">' +
        '<div class="container topbar-inner">' +
          '<span class="topbar-msg" data-edit="texts.topbarMessage">' + esc(cfg.texts.topbarMessage) + '</span>' +
          '<span class="topbar-right">' +
            '<a href="' + esc(telHref()) + '">' + ICONS.phone + esc(b.phone) + '</a>' +
            '<span class="topbar-sep"></span>' +
            '<span data-edit="business.hours">' + esc(b.hours) + '</span>' +
          '</span>' +
        '</div>' +
      '</div>';
  }

  function renderHeader() {
    var b = cfg.business;
    var cats = cfg.categories || [];
    return '' +
      '<header class="site-header">' +
        '<div class="container header-inner">' +
          brandBlock() +
          '<form class="searchbar" id="searchForm" role="search">' +
            '<select id="searchCategory" aria-label="' + esc(cfg.texts.allCategoriesLabel) + '">' +
              '<option value="">' + esc(cfg.texts.allCategoriesLabel) + '</option>' +
              cats.map(function (c) {
                return '<option value="' + esc(c.name) + '"' + (ui.category === c.name ? ' selected' : '') + '>' + esc(c.name) + '</option>';
              }).join('') +
            '</select>' +
            '<span class="search-split"></span>' +
            '<input id="searchInput" type="search" placeholder="' + esc(cfg.texts.searchPlaceholder) + '" aria-label="Buscar productos" value="' + esc(ui.term) + '">' +
            '<button class="search-btn" type="submit">' + ICONS.search + '<span>' + esc(cfg.texts.searchButton) + '</span></button>' +
          '</form>' +
          '<div class="header-actions">' +
            '<a class="phone-link" href="' + esc(telHref()) + '" aria-label="Llamar por teléfono">' + ICONS.phone + '<span>' + esc(b.phone) + '</span></a>' +
            '<a class="btn btn-accent header-cta" href="' + esc(waHref()) + '" target="_blank" rel="noopener">' + ICONS.wa + '<span data-edit="texts.headerCta">' + esc(cfg.texts.headerCta) + '</span></a>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function renderNav() {
    var nav = cfg.nav || [];
    return '' +
      '<div class="main-nav">' +
        '<div class="container nav-inner">' +
          '<nav class="nav-links" aria-label="Menú principal">' +
            nav.map(function (n) {
              var active = String(n.href).indexOf('#categorias') !== -1;
              return '<a class="nav-link' + (active ? ' is-active' : '') + '" href="' + esc(safeUrl(n.href)) + '" data-edit="nav.' + nav.indexOf(n) + '.label">' + esc(n.label) + '</a>';
            }).join('') +
          '</nav>' +
          '<a class="nav-badge" href="' + esc(waHref()) + '" target="_blank" rel="noopener">' +
            '<span data-edit="texts.navBadge">' + esc(cfg.texts.navBadge) + '</span>' + ICONS.arrow +
          '</a>' +
        '</div>' +
      '</div>';
  }

  function renderPromo() {
    if (!cfg.promo.enabled) return '';
    return '' +
      '<div class="container">' +
        '<section class="promo" aria-label="Promoción">' +
          '<div class="promo-copy">' +
            '<span class="promo-kicker" data-edit="promo.kicker">' + esc(cfg.promo.kicker) + '</span>' +
            '<h2 class="promo-title" data-edit="promo.title">' + esc(cfg.promo.title) + '</h2>' +
            '<p data-edit="promo.text">' + esc(cfg.promo.text) + '</p>' +
          '</div>' +
          '<a class="btn btn-accent" href="' + esc(waHref()) + '" target="_blank" rel="noopener">' + ICONS.wa + '<span data-edit="promo.cta">' + esc(cfg.promo.cta) + '</span></a>' +
        '</section>' +
      '</div>';
  }

  function renderPageHead() {
    return '' +
      '<div class="breadcrumb">' +
        '<a href="#top" data-edit="texts.breadcrumbHome">' + esc(cfg.texts.breadcrumbHome) + '</a>' +
        '<span class="sep">›</span>' +
        '<span class="current" data-edit="texts.breadcrumbCurrent">' + esc(cfg.texts.breadcrumbCurrent) + '</span>' +
      '</div>' +
      '<div class="page-head">' +
        '<div class="page-title-row">' +
          '<div>' +
            '<h1 class="page-title" data-edit="texts.pageTitle">' + esc(cfg.texts.pageTitle) + '</h1>' +
            '<p class="page-intro" data-edit="texts.pageIntro">' + esc(cfg.texts.pageIntro) + '</p>' +
          '</div>' +
          '<div class="page-stats">' +
            '<span class="stat-pill"><b>' + (cfg.categories || []).length + '</b> categorías</span>' +
            '<span class="stat-pill"><b>' + (cfg.products || []).length + '</b> productos</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderCategories() {
    var cats = cfg.categories || [];
    return '' +
      '<section class="cats-section" id="categorias">' +
        '<div class="cat-grid">' +
          cats.map(function (c, i) {
            var tint = TINTS[i % TINTS.length];
            return '' +
              '<article class="cat-card" style="--tint:' + tint + '">' +
                '<div class="cat-top">' +
                  '<span class="cat-icon" data-edit="categories.' + i + '.icon">' + esc(c.icon) + '</span>' +
                  '<h2 class="cat-name" data-edit="categories.' + i + '.name">' + esc(c.name) + '</h2>' +
                '</div>' +
                '<ul class="cat-subs">' +
                  (c.subs || []).map(function (s, j) {
                    return '<li><button class="cat-sub" type="button" data-filter-cat="' + esc(c.name) + '"><span data-edit="categories.' + i + '.subs.' + j + '">' + esc(s) + '</span></button></li>';
                  }).join('') +
                '</ul>' +
                '<button class="cat-more" type="button" data-filter-cat="' + esc(c.name) + '">' +
                  '<span data-edit="texts.categoryCta">' + esc(cfg.texts.categoryCta) + '</span>' + ICONS.arrow +
                '</button>' +
              '</article>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function renderPopular() {
    var list = cfg.popularSearches || [];
    return '' +
      '<section class="popular">' +
        '<h2 class="section-title" data-edit="texts.popularTitle">' + esc(cfg.texts.popularTitle) + '</h2>' +
        '<div class="chip-grid">' +
          list.map(function (p, i) {
            return '<button class="chip" type="button" data-search-term="' + esc(p) + '"><span data-edit="popularSearches.' + i + '">' + esc(p) + '</span></button>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function renderProductCard(p, i) {
    var img = safeImg(p.image);
    var link = p.link ? safeUrl(p.link, waHref(p.name)) : waHref(p.name);
    var badge = String(p.badge || '').trim();
    return '' +
      '<article class="product-card">' +
        '<div class="product-media tone-' + ((i % 6) + 1) + '">' +
          (badge ? '<span class="badge ' + badgeClass(badge) + '">' + esc(badge) + '</span>' : '') +
          '<span class="product-emoji" data-edit="products.' + i + '.emoji">' + esc(p.emoji || '📦') + '</span>' +
          (img ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '') +
        '</div>' +
        '<div class="product-body">' +
          '<div class="product-cat" data-edit="products.' + i + '.category">' + esc(p.category) + '</div>' +
          '<h3 class="product-name" data-edit="products.' + i + '.name">' + esc(p.name) + '</h3>' +
          '<div class="product-price-row">' +
            '<span class="product-price" data-edit="products.' + i + '.price">' + esc(p.price) + '</span>' +
            (p.oldPrice ? '<span class="product-old" data-edit="products.' + i + '.oldPrice">' + esc(p.oldPrice) + '</span>' : '') +
            (p.unit ? '<span class="product-unit" data-edit="products.' + i + '.unit">' + esc(p.unit) + '</span>' : '') +
          '</div>' +
          (p.min ? '<div class="product-min" data-edit="products.' + i + '.min">' + esc(p.min) + '</div>' : '') +
          '<a class="product-btn" href="' + esc(link) + '" target="_blank" rel="noopener">' +
            ICONS.wa + '<span data-edit="texts.productCta">' + esc(cfg.texts.productCta) + '</span>' +
          '</a>' +
        '</div>' +
      '</article>';
  }

  function renderProducts() {
    var list = filteredProducts();
    var activeFilter = ui.term || ui.category;
    var all = cfg.products || [];
    var filterBar = '';
    if (activeFilter) {
      var resultsWord = esc(cfg.texts.resultsLabel || 'productos');
      if (list.length === 1 && /s$/i.test(resultsWord)) resultsWord = resultsWord.slice(0, -1);
      filterBar = '' +
        '<div class="filter-bar">' +
          '<span><b>' + list.length + '</b> ' + resultsWord +
            (ui.term ? ' para “' + esc(ui.term) + '”' : '') +
            (ui.category ? (ui.term ? ' · ' : ' en ') + esc(ui.category) : '') +
          '</span>' +
          '<button class="filter-clear" type="button" data-clear-filter>' + esc(cfg.texts.clearFilter) + '</button>' +
        '</div>';
    }
    return '' +
      '<section class="products-section" id="productos">' +
        '<div class="section-head">' +
          '<div>' +
            '<h2 data-edit="texts.productsTitle">' + esc(cfg.texts.productsTitle) + '</h2>' +
            '<p data-edit="texts.productsIntro">' + esc(cfg.texts.productsIntro) + '</p>' +
          '</div>' +
          '<a class="section-link" href="#categorias">' + esc(cfg.texts.productsLink) + ICONS.arrow + '</a>' +
        '</div>' +
        filterBar +
        (list.length
          ? '<div class="product-grid">' + list.map(renderProductCard).join('') + '</div>'
          : '<div class="empty-state"><div class="big">🔎</div><h3 data-edit="texts.emptyTitle">' + esc(cfg.texts.emptyTitle) + '</h3><p data-edit="texts.emptyText">' + esc(cfg.texts.emptyText) + '</p><button class="btn btn-primary" type="button" data-clear-filter>' + esc(cfg.texts.clearFilter) + '</button></div>') +
        '<p class="price-note" data-edit="business.currencyNote">' + esc(cfg.business.currencyNote || '') + '</p>' +
      '</section>';
  }

  function renderFooter() {
    var b = cfg.business;
    var cats = (cfg.categories || []).slice(0, 6);
    var info = (cfg.footer && cfg.footer.infoLinks) || [];
    var legal = (cfg.footer && cfg.footer.legalLinks) || [];
    return '' +
      '<footer class="site-footer" id="contacto">' +
        '<div class="container footer-grid">' +
          '<div class="footer-brand">' +
            brandBlock() +
            '<p class="footer-about" data-edit="business.description">' + esc(b.description) + '</p>' +
            '<div class="footer-social">' +
              (b.social || []).map(function (s) {
                return '<a class="social-link" href="' + esc(safeUrl(s.url)) + '" title="' + esc(s.label) + '" target="_blank" rel="noopener">' + esc(s.short || s.label.slice(0, 2)) + '</a>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title" data-edit="texts.footerCategories">' + esc(cfg.texts.footerCategories) + '</h3>' +
            '<ul class="footer-links">' +
              cats.map(function (c) {
                return '<li><a href="#productos" data-filter-cat="' + esc(c.name) + '">' + esc(c.name) + '</a></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title" data-edit="texts.footerInfo">' + esc(cfg.texts.footerInfo) + '</h3>' +
            '<ul class="footer-links">' +
              info.map(function (l) {
                return '<li><a href="' + esc(safeUrl(l.href)) + '">' + esc(l.label) + '</a></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<h3 class="footer-title" data-edit="texts.footerContact">' + esc(cfg.texts.footerContact) + '</h3>' +
            '<ul class="contact-list">' +
              '<li>' + ICONS.pin + '<span data-edit="business.address">' + esc(b.address) + '</span></li>' +
              '<li>' + ICONS.phone + '<a href="' + esc(telHref()) + '" data-edit="business.phone">' + esc(b.phone) + '</a></li>' +
              '<li>' + ICONS.mail + '<a href="mailto:' + esc(b.email) + '" data-edit="business.email">' + esc(b.email) + '</a></li>' +
              '<li>' + ICONS.clock + '<span data-edit="business.hours">' + esc(b.hours) + '</span></li>' +
            '</ul>' +
            '<a class="btn btn-accent footer-wa" href="' + esc(waHref()) + '" target="_blank" rel="noopener">' + ICONS.wa + '<span data-edit="texts.footerWhatsapp">' + esc(cfg.texts.footerWhatsapp) + '</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="container footer-bottom">' +
          '<span data-edit="texts.copyright">' + esc(cfg.texts.copyright) + '</span>' +
          '<span class="footer-legal">' +
            legal.map(function (l) {
              return '<a href="' + esc(safeUrl(l.href)) + '">' + esc(l.label) + '</a>';
            }).join('') +
          '</span>' +
          '<span class="footer-note" data-edit="footer.madeNote">' + esc((cfg.footer && cfg.footer.madeNote) || '') + '</span>' +
        '</div>' +
      '</footer>';
  }

  function renderPage() {
    applyTheme();
    document.body.classList.toggle('edit-mode', ui.edit);
    document.title = cfg.business.name + ' · ' + cfg.texts.pageTitle;
    var app = $('#app');
    if (!app) return;
    app.innerHTML =
      '<div id="top"></div>' +
      renderTopbar() +
      renderHeader() +
      renderNav() +
      '<main>' +
        renderPromo() +
        '<div class="container">' +
          renderPageHead() +
          renderCategories() +
          renderPopular() +
          renderProducts() +
        '</div>' +
      '</main>' +
      renderFooter();

    if (ui.edit) {
      $$('#app [data-edit]').forEach(function (el) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      });
    }
  }

  function scrollToProducts() {
    requestAnimationFrame(function () {
      var el = document.getElementById('productos');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Editor: helpers de formulario ---------- */
  function fText(label, path, value, attrs) {
    return '<div class="fgroup"><label>' + esc(label) + '</label><input type="text" data-field="' + esc(path) + '" value="' + esc(value) + '" ' + (attrs || '') + '></div>';
  }
  function fArea(label, path, value, rows) {
    return '<div class="fgroup"><label>' + esc(label) + '</label><textarea data-field="' + esc(path) + '" rows="' + (rows || 3) + '">' + esc(value) + '</textarea></div>';
  }
  function fColor(label, path, value) {
    return '<div class="fgroup"><span class="flabel">' + esc(label) + '</span><div class="color-row"><input type="color" data-field="' + esc(path) + '" value="' + esc(value) + '"><span class="color-hex">' + esc(value) + '</span></div></div>';
  }
  function fCheck(label, path, checked) {
    return '<label class="check-row"><input type="checkbox" data-field="' + esc(path) + '"' + (checked ? ' checked' : '') + '> ' + esc(label) + '</label>';
  }
  function fRange(label, path, value, min, max) {
    return '<div class="fgroup"><label>' + esc(label) + '</label><div class="f-inline"><input type="range" min="' + min + '" max="' + max + '" step="1" data-field="' + esc(path) + '" value="' + esc(value) + '"><span class="range-val">' + esc(value) + ' px</span></div></div>';
  }
  function fSelect(label, path, value, options) {
    return '<div class="fgroup"><label>' + esc(label) + '</label><select data-field="' + esc(path) + '">' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select></div>';
  }
  function rowActions(arrPath, i, len) {
    return '<div class="row-actions">' +
      '<button class="mini-btn" type="button" data-move="' + esc(arrPath) + '" data-index="' + i + '" data-dir="-1" title="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button class="mini-btn" type="button" data-move="' + esc(arrPath) + '" data-index="' + i + '" data-dir="1" title="Bajar"' + (i === len - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button class="mini-btn danger" type="button" data-del="' + esc(arrPath) + '" data-index="' + i + '" title="Eliminar">✕</button>' +
      '</div>';
  }
  function productThumb(p) {
    var img = safeImg(p.image);
    if (img) return '<span class="prod-thumb"><img src="' + esc(img) + '" alt="" onerror="this.remove()"></span>';
    return '<span class="prod-thumb">' + esc(p.emoji || '📦') + '</span>';
  }

  /* ---------- Editor: pestañas ---------- */
  function tabGeneral() {
    var b = cfg.business;
    var logoSrc = safeImg(b.logoImage);
    return '' +
      '<p class="hint">Datos de tu empresa. Se usan en el encabezado, el pie de página y los botones de contacto.</p>' +
      '<div class="block"><h3>Marca</h3>' +
        fText('Nombre de la empresa', 'business.name', b.name) +
        '<div class="f2">' +
          fText('Texto chico del logo', 'business.logoKicker', b.logoKicker) +
          fText('Texto grande del logo', 'business.logoTitle', b.logoTitle) +
        '</div>' +
        '<span class="flabel">Logo</span>' +
        '<div class="logo-editor">' +
          '<div class="logo-preview">' +
            (logoSrc ? '<img src="' + esc(logoSrc) + '" alt="Logo" onerror="this.remove()">' : (b.logoEmoji ? esc(b.logoEmoji) : LIGHTHOUSE)) +
          '</div>' +
          '<div class="logo-tools">' +
            '<label class="file-btn">Subir imagen<input type="file" accept="image/*" data-upload="logo"></label>' +
            (b.logoImage ? '<button class="file-btn" type="button" data-cmd="clear-logo">Quitar imagen</button>' : '<span style="font-size:10.5px;color:var(--muted)">Sin imagen se usa el faro dibujado.</span>') +
          '</div>' +
        '</div>' +
        fText('Emoji del logo (opcional)', 'business.logoEmoji', b.logoEmoji) +
        fText('URL de la imagen del logo', 'business.logoImage', b.logoImage) +
      '</div>' +
      '<div class="block"><h3>Contacto</h3>' +
        fText('Teléfono', 'business.phone', b.phone) +
        fText('WhatsApp (con código de país, solo números)', 'business.whatsapp', b.whatsapp) +
        fText('Correo electrónico', 'business.email', b.email) +
        fText('Dirección', 'business.address', b.address) +
        fText('Horario de atención', 'business.hours', b.hours) +
        fText('Nota de precios', 'business.currencyNote', b.currencyNote) +
      '</div>' +
      '<div class="block"><h3>Descripción</h3>' +
        fArea('Texto del pie de página', 'business.description', b.description, 4) +
      '</div>' +
      '<div class="block"><h3>Redes sociales</h3>' +
        (b.social || []).map(function (s, i) {
          return '<div class="row-card">' +
            '<div class="row-head"><span class="row-num">' + (i + 1) + '</span><span class="row-title">' + esc(s.label || 'Red social') + '</span></div>' +
            '<div class="f2">' +
              fText('Nombre', 'business.social.' + i + '.label', s.label) +
              fText('Iniciales', 'business.social.' + i + '.short', s.short) +
            '</div>' +
            fText('Enlace', 'business.social.' + i + '.url', s.url) +
            rowActions('business.social', i, b.social.length) +
          '</div>';
        }).join('') +
        '<button class="add-btn" type="button" data-add="business.social">+ Agregar red social</button>' +
      '</div>' +
      '<div class="block"><h3>Acceso de administrador</h3>' +
        '<p class="hint">Clave secreta para editar la página en internet. Solo tú la conoces. Deja vacío para desactivar la edición web.</p>' +
        fText('Clave de administrador', 'business.adminKey', b.adminKey) +
      '</div>';
  }

  function tabDesign() {
    var t = cfg.theme;
    return '' +
      '<p class="hint">Colores, tipografía y forma de las tarjetas. Los cambios se ven al instante.</p>' +
      '<div class="block"><h3>Paletas rápidas</h3>' +
        '<div class="preset-grid">' +
          Object.keys(PRESETS).map(function (id) {
            var p = PRESETS[id];
            return '<button class="preset" type="button" data-preset="' + id + '">' +
              '<span class="swatches"><i style="background:' + p.primary + '"></i><i style="background:' + p.accent + '"></i><i style="background:' + p.hot + '"></i></span>' +
              esc(PRESET_NAMES[id]) + '</button>';
          }).join('') +
        '</div>' +
        fColor('Color principal', 'theme.primary', t.primary) +
        fColor('Color de acento', 'theme.accent', t.accent) +
        fColor('Color de ofertas y alertas', 'theme.hot', t.hot) +
        fColor('Color de fondo', 'theme.bg', t.bg) +
      '</div>' +
      '<div class="block"><h3>Forma y estilo</h3>' +
        fRange('Redondeo de tarjetas', 'theme.radius', t.radius, 0, 30) +
        fCheck('Sombras suaves', 'theme.shadows', t.shadows) +
        fCheck('Encabezado fijo al hacer scroll', 'theme.stickyHeader', t.stickyHeader) +
        fText('Tipografía (valor CSS font-family)', 'theme.font', t.font) +
      '</div>';
  }

  function tabTexts() {
    return '' +
      '<p class="hint">Todos los textos de la página. También puedes hacer clic directamente sobre ellos con el modo edición activo.</p>' +
      '<div class="block"><h3>Barra superior y buscador</h3>' +
        fCheck('Mostrar barra superior', 'topbar.enabled', cfg.topbar.enabled) +
        fArea('Mensaje de la barra superior', 'texts.topbarMessage', cfg.texts.topbarMessage, 2) +
        fText('Texto del buscador (placeholder)', 'texts.searchPlaceholder', cfg.texts.searchPlaceholder) +
        fText('Botón buscar', 'texts.searchButton', cfg.texts.searchButton) +
        fText('Opción "todas las categorías"', 'texts.allCategoriesLabel', cfg.texts.allCategoriesLabel) +
        fText('Botón del encabezado', 'texts.headerCta', cfg.texts.headerCta) +
        fText('Etiqueta "ventas por mayor"', 'texts.navBadge', cfg.texts.navBadge) +
      '</div>' +
      '<div class="block"><h3>Portada</h3>' +
        fCheck('Mostrar franja promocional', 'promo.enabled', cfg.promo.enabled) +
        fText('Texto pequeño', 'promo.kicker', cfg.promo.kicker) +
        fText('Título', 'promo.title', cfg.promo.title) +
        fArea('Descripción', 'promo.text', cfg.promo.text, 3) +
        fText('Botón', 'promo.cta', cfg.promo.cta) +
      '</div>' +
      '<div class="block"><h3>Encabezado de la página</h3>' +
        fText('Miga de pan inicial', 'texts.breadcrumbHome', cfg.texts.breadcrumbHome) +
        fText('Miga de pan actual', 'texts.breadcrumbCurrent', cfg.texts.breadcrumbCurrent) +
        fText('Título de la página', 'texts.pageTitle', cfg.texts.pageTitle) +
        fArea('Introducción', 'texts.pageIntro', cfg.texts.pageIntro, 4) +
      '</div>' +
      '<div class="block"><h3>Secciones y productos</h3>' +
        fText('Botón de categoría', 'texts.categoryCta', cfg.texts.categoryCta) +
        fText('Título de búsquedas populares', 'texts.popularTitle', cfg.texts.popularTitle) +
        fText('Título de productos', 'texts.productsTitle', cfg.texts.productsTitle) +
        fArea('Descripción de productos', 'texts.productsIntro', cfg.texts.productsIntro, 2) +
        fText('Enlace "ver todo el catálogo"', 'texts.productsLink', cfg.texts.productsLink) +
        fText('Botón de cada producto', 'texts.productCta', cfg.texts.productCta) +
        fText('Texto de resultados', 'texts.resultsLabel', cfg.texts.resultsLabel) +
        fText('Botón limpiar filtro', 'texts.clearFilter', cfg.texts.clearFilter) +
        fText('Título sin resultados', 'texts.emptyTitle', cfg.texts.emptyTitle) +
        fText('Texto sin resultados', 'texts.emptyText', cfg.texts.emptyText) +
      '</div>' +
      '<div class="block"><h3>WhatsApp</h3>' +
        fText('Número (solo dígitos)', 'business.whatsapp', cfg.business.whatsapp) +
        fArea('Mensaje general', 'texts.whatsappMessage', cfg.texts.whatsappMessage, 2) +
        fArea('Mensaje por producto ({producto} se reemplaza)', 'texts.productMessage', cfg.texts.productMessage, 2) +
      '</div>' +
      '<div class="block"><h3>Pie de página</h3>' +
        fText('Título categorías', 'texts.footerCategories', cfg.texts.footerCategories) +
        fText('Título información', 'texts.footerInfo', cfg.texts.footerInfo) +
        fText('Título contacto', 'texts.footerContact', cfg.texts.footerContact) +
        fText('Botón WhatsApp', 'texts.footerWhatsapp', cfg.texts.footerWhatsapp) +
        fText('Copyright', 'texts.copyright', cfg.texts.copyright) +
        fText('Nota final', 'footer.madeNote', cfg.footer.madeNote) +
      '</div>' +
      '<div class="block"><h3>Enlaces del pie de página</h3>' +
        '<span class="flabel">Columna "Información"</span>' +
        (cfg.footer.infoLinks || []).map(function (l, i) {
          return '<div class="row-card">' +
            '<div class="row-head"><span class="row-num">' + (i + 1) + '</span><span class="row-title">' + esc(l.label || 'Enlace') + '</span></div>' +
            fText('Texto', 'footer.infoLinks.' + i + '.label', l.label) +
            fText('Enlace', 'footer.infoLinks.' + i + '.href', l.href) +
            rowActions('footer.infoLinks', i, cfg.footer.infoLinks.length) +
          '</div>';
        }).join('') +
        '<button class="add-btn" type="button" data-add="footer.infoLinks">+ Agregar enlace</button>' +
        '<span class="flabel">Enlaces legales</span>' +
        (cfg.footer.legalLinks || []).map(function (l, i) {
          return '<div class="row-card">' +
            '<div class="row-head"><span class="row-num">' + (i + 1) + '</span><span class="row-title">' + esc(l.label || 'Enlace') + '</span></div>' +
            fText('Texto', 'footer.legalLinks.' + i + '.label', l.label) +
            fText('Enlace', 'footer.legalLinks.' + i + '.href', l.href) +
            rowActions('footer.legalLinks', i, cfg.footer.legalLinks.length) +
          '</div>';
        }).join('') +
        '<button class="add-btn" type="button" data-add="footer.legalLinks">+ Agregar enlace legal</button>' +
      '</div>';
  }

  function tabNav() {
    return '' +
      '<p class="hint">Enlaces del menú principal. Usa <b>#categorias</b>, <b>#productos</b> o <b>#contacto</b> para ir a una sección, o pega una URL completa.</p>' +
      (cfg.nav || []).map(function (n, i) {
        return '<div class="row-card">' +
          '<div class="row-head"><span class="row-num">' + (i + 1) + '</span><span class="row-title">' + esc(n.label || 'Enlace') + '</span></div>' +
          fText('Texto', 'nav.' + i + '.label', n.label) +
          fText('Enlace', 'nav.' + i + '.href', n.href) +
          rowActions('nav', i, cfg.nav.length) +
        '</div>';
      }).join('') +
      '<button class="add-btn" type="button" data-add="nav">+ Agregar enlace al menú</button>';
  }

  function tabCategories() {
    return '' +
      '<p class="hint">Cada tarjeta del catálogo. El icono puede ser un emoji (🏠, 🎧, 🎁…). Las subcategorías se separan con comas.</p>' +
      (cfg.categories || []).map(function (c, i) {
        return '<div class="row-card">' +
          '<div class="row-head"><span class="row-num">' + (i + 1) + '</span><span class="row-title">' + esc(c.icon) + ' ' + esc(c.name) + '</span></div>' +
          '<div class="f3">' +
            fText('Icono', 'categories.' + i + '.icon', c.icon) +
            fText('Nombre', 'categories.' + i + '.name', c.name) +
          '</div>' +
          '<div class="fgroup"><label>Subcategorías (separadas por coma)</label><textarea data-commas="categories.' + i + '.subs" rows="2">' + esc((c.subs || []).join(', ')) + '</textarea></div>' +
          rowActions('categories', i, cfg.categories.length) +
        '</div>';
      }).join('') +
      '<button class="add-btn" type="button" data-add="categories">+ Agregar categoría</button>';
  }

  function tabSearches() {
    return '' +
      '<p class="hint">Una búsqueda por línea. Aparecen como botones que filtran los productos.</p>' +
      '<div class="fgroup"><textarea data-searches rows="16">' + esc((cfg.popularSearches || []).join('\n')) + '</textarea></div>' +
      '<p class="hint">Consejo: usa palabras que tus clientes escribirían en el buscador.</p>';
  }

  function productEditor(p, i) {
    var h = '<details class="prod-row">' +
      '<summary>' + productThumb(p) + '<span>' + esc(p.name || 'Producto ' + (i + 1)) + '</span><span class="chev">▶</span></summary>' +
      '<div class="prod-row-body">' +
        fText('Nombre del producto', 'products.' + i + '.name', p.name) +
        fSelect('Categoría', 'products.' + i + '.category', p.category, (cfg.categories || []).map(function (c) { return c.name; })) +
        '<div class="f2">' +
          fText('Precio', 'products.' + i + '.price', p.price) +
          fText('Precio anterior (opcional)', 'products.' + i + '.oldPrice', p.oldPrice) +
        '</div>' +
        '<div class="f2">' +
          fText('Unidad', 'products.' + i + '.unit', p.unit) +
          fText('Mínimo', 'products.' + i + '.min', p.min) +
        '</div>' +
        '<div class="f2">' +
          fText('Etiqueta (Oferta, Nuevo…)', 'products.' + i + '.badge', p.badge) +
          fText('Emoji', 'products.' + i + '.emoji', p.emoji) +
        '</div>' +
        '<div class="fgroup"><span class="flabel">Imagen</span>' +
          '<div class="image-preview">' + (safeImg(p.image) ? '<img src="' + esc(safeImg(p.image)) + '" alt="" onerror="this.remove()">' : '<span>Sin imagen: se usa el emoji</span>') + '</div>' +
          '<div class="f2">' +
            '<label class="file-btn">Subir imagen<input type="file" accept="image/*" data-upload="product" data-index="' + i + '"></label>' +
            (p.image ? '<button class="file-btn" type="button" data-cmd="clear-product-image" data-index="' + i + '">Quitar imagen</button>' : '<span></span>') +
          '</div>' +
        '</div>' +
        fText('URL de la imagen', 'products.' + i + '.image', p.image) +
        fText('Enlace propio (vacío = WhatsApp)', 'products.' + i + '.link', p.link) +
        rowActions('products', i, cfg.products.length) +
      '</div>' +
    '</details>';
    return h;
  }

  function tabProducts() {
    return '' +
      '<p class="hint">Agrega, ordena o elimina productos. Si no subes imagen se usa el emoji como ilustración.</p>' +
      '<button class="add-btn" type="button" data-add="products">+ Agregar producto</button>' +
      (cfg.products || []).map(productEditor).join('') +
      '<button class="add-btn" type="button" data-add="products">+ Agregar producto</button>';
  }

  function tabData() {
    var bytes = 0;
    try { bytes = new Blob([localStorage.getItem(LS_KEY) || '']).size; } catch (err) { bytes = 0; }
    var kb = (bytes / 1024).toFixed(1);
    return '' +
      '<div class="block"><h3>Resumen</h3>' +
        '<div class="data-stats">' +
          '<div class="data-stat"><b>' + (cfg.categories || []).length + '</b><span>categorías</span></div>' +
          '<div class="data-stat"><b>' + (cfg.products || []).length + '</b><span>productos</span></div>' +
          '<div class="data-stat"><b>' + (cfg.popularSearches || []).length + '</b><span>búsquedas</span></div>' +
        '</div>' +
        '<p class="hint">Los cambios se guardan automáticamente en este navegador (' + kb + ' KB). Para que <b>todos</b> los visitantes los vean, descarga <b>config.js</b> y reemplaza el archivo del sitio publicado.</p>' +
      '</div>' +
      '<div class="block"><h3>Guardar / publicar</h3>' +
        '<div class="data-actions">' +
          '<button class="btn btn-ghost" type="button" data-cmd="export-json">Descargar JSON</button>' +
          '<button class="btn btn-primary" type="button" data-cmd="export-js">Descargar config.js</button>' +
          '<button class="btn btn-ghost wide" type="button" data-cmd="copy-json">Copiar configuración</button>' +
        '</div>' +
        '<p class="hint" style="margin-top:10px">1) Descarga <b>config.js</b> (se abrirá un cuadro para elegir la carpeta) · 2) si no se abre, el archivo va a tu carpeta de <b>Descargas</b> · 3) cópialo a la carpeta del sitio reemplazando el viejo · 4) sube los archivos a tu hosting.</p>' +
      '</div>' +
      '<div class="block"><h3>Importar</h3>' +
        '<label class="file-btn" style="width:100%">Elegir archivo .json<input type="file" accept="application/json,.json" data-import></label>' +
        '<p class="hint" style="margin-top:9px">También puedes pegar el JSON:</p>' +
        '<div class="fgroup"><textarea id="importText" rows="5" placeholder="Pega aquí la configuración…"></textarea></div>' +
        '<button class="btn btn-ghost" type="button" data-cmd="import-text" style="width:100%">Cargar JSON pegado</button>' +
      '</div>' +
      '<div class="block"><h3>Zona de riesgo</h3>' +
        '<button class="btn btn-ghost" type="button" data-cmd="reset" style="width:100%;color:var(--hot);border-color:color-mix(in srgb,var(--hot) 35%,#fff)">Restaurar contenido de fábrica</button>' +
      '</div>';
  }

  function renderPanel(keepScroll) {
    var tabsEl = $('#panelTabs');
    var bodyEl = $('#panelBody');
    if (!tabsEl || !bodyEl) return;
    var scroll = keepScroll ? bodyEl.scrollTop : 0;
    tabsEl.innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + t[0] + '" class="' + (ui.tab === t[0] ? 'active' : '') + '">' + t[1] + '</button>';
    }).join('');

    var fn = {
      general: tabGeneral,
      design: tabDesign,
      texts: tabTexts,
      nav: tabNav,
      categories: tabCategories,
      searches: tabSearches,
      products: tabProducts,
      data: tabData
    }[ui.tab] || tabGeneral;

    bodyEl.innerHTML = fn();
    bodyEl.scrollTop = scroll;
  }

  /* ---------- Editor: mutaciones ---------- */
  function blankFor(path) {
    if (path === 'nav') return { label: 'Nuevo enlace', href: '#categorias' };
    if (path === 'business.social') return { label: 'Nueva red', short: '+', url: '#' };
    if (path === 'categories') return { icon: '📦', name: 'Nueva categoría', subs: ['Producto 1', 'Producto 2'] };
    if (path === 'products') {
      return {
        name: 'Nuevo producto',
        category: (cfg.categories[0] && cfg.categories[0].name) || '',
        price: '$0',
        oldPrice: '',
        unit: 'por unidad',
        min: 'Mínimo 1 unidad',
        badge: '',
        emoji: '📦',
        image: '',
        link: ''
      };
    }
    if (path === 'footer.infoLinks' || path === 'footer.legalLinks') return { label: 'Nuevo enlace', href: '#' };
    return null;
  }

  function addItem(path) {
    var arr = getPath(cfg, path);
    var item = blankFor(path);
    if (!Array.isArray(arr) || !item) return;
    arr.push(item);
    saveNow();
    renderPage();
    renderPanel();
    requestAnimationFrame(function () {
      var body = $('#panelBody');
      if (!body) return;
      if (path === 'products') {
        var all = $$('details.prod-row', body);
        var last = all[all.length - 1];
        if (last) {
          last.open = true;
          last.scrollIntoView({ block: 'nearest' });
        }
      } else {
        body.scrollTop = body.scrollHeight;
      }
    });
    toast('Elemento agregado');
  }

  function removeItem(path, index) {
    var arr = getPath(cfg, path);
    if (!Array.isArray(arr) || !arr[index]) return;
    arr.splice(index, 1);
    saveNow();
    renderPage();
    renderPanel();
    toast('Elemento eliminado');
  }

  function moveItem(path, index, dir) {
    var arr = getPath(cfg, path);
    if (!Array.isArray(arr)) return;
    var j = index + dir;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[index];
    arr[index] = arr[j];
    arr[j] = tmp;
    saveNow();
    renderPage();
    renderPanel(true);
  }

  /* ---------- Editor: archivos ---------- */
  function readAndResize(file, maxW, maxH) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxW / img.width, maxH / img.height);
          if (scale >= 1 && dataUrl.length < 180000) {
            resolve(dataUrl);
            return;
          }
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var type = /png|svg/i.test(file.type) ? 'image/png' : 'image/jpeg';
          try {
            resolve(canvas.toDataURL(type, 0.86));
          } catch (err) {
            resolve(dataUrl);
          }
        };
        img.onerror = function () { reject(new Error('imagen')); };
        img.src = dataUrl;
      };
      reader.onerror = function () { reject(new Error('lectura')); };
      reader.readAsDataURL(file);
    });
  }

  function handleUpload(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var kind = input.dataset.upload;
    var index = parseInt(input.dataset.index, 10);
    readAndResize(file, kind === 'logo' ? 420 : 1000, kind === 'logo' ? 420 : 1000)
      .then(function (dataUrl) {
        if (kind === 'logo') {
          cfg.business.logoImage = dataUrl;
        } else if (kind === 'product' && cfg.products[index]) {
          cfg.products[index].image = dataUrl;
        }
        saveNow();
        renderPage();
        renderPanel(true);
        toast('Imagen actualizada');
      })
      .catch(function () {
        toast('No se pudo leer la imagen');
      });
  }

  /* ---------- Editor: exportar / importar ---------- */
  function download(filename, content, type) {
    type = type || 'application/json';
    // Detectar si estamos en contexto seguro (HTTPS o localhost)
    var isSecure = (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    // Método 1: selector de carpeta (guarda directamente en la carpeta elegida) - solo en contexto seguro
    if (isSecure && window.showDirectoryPicker) {
      window.showDirectoryPicker().then(function (dirHandle) {
        return dirHandle.getFileHandle(filename, { create: true }).then(function (fileHandle) {
          return fileHandle.createWritable().then(function (writable) {
            return writable.write(content).then(function () {
              return writable.close();
            });
          });
        });
      }).then(function () {
        toast('✅ ' + filename + ' guardado en la carpeta que elegiste');
      }).catch(function (err) {
        if (err && err.name !== 'AbortError') {
          downloadFilePicker(filename, content, type);
        }
      });
      return true;
    }
    // Método 2: selector de archivo (permite elegir la carpeta) - solo en contexto seguro
    if (isSecure && window.showSaveFilePicker) {
      return downloadFilePicker(filename, content, type);
    }
    // Método 3: descarga automática (va a carpeta de Descargas del navegador)
    return fallbackDownload(filename, content, type);
  }

  function downloadFilePicker(filename, content, type) {
    type = type || 'application/json';
    // Método 2: selector de archivo (permite elegir la carpeta)
    if (window.showSaveFilePicker) {
      var opts = {
        suggestedName: filename,
        types: [{ description: 'Archivo JavaScript', accept: { 'text/javascript': ['.js'] } }]
      };
      if (filename.indexOf('.json') > -1) opts.types = [{ description: 'Archivo JSON', accept: { 'application/json': ['.json'] } }];
      window.showSaveFilePicker(opts).then(function (handle) {
        return handle.createWritable().then(function (writable) {
          return writable.write(content).then(function () {
            return writable.close();
          });
        });
      }).then(function () {
        toast('✅ Archivo guardado: ' + filename);
      }).catch(function (err) {
        if (err && err.name !== 'AbortError') {
          fallbackDownload(filename, content, type);
        }
      });
      return true;
    }
    return fallbackDownload(filename, content, type);
  }

  function fallbackDownload(filename, content, type) {
    type = type || 'application/json';
    try {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch (err) {
      try {
        var dataUrl = 'data:' + type + ';charset=utf-8,' + encodeURIComponent(content);
        var a2 = document.createElement('a');
        a2.href = dataUrl;
        a2.download = filename;
        a2.style.display = 'none';
        document.body.appendChild(a2);
        a2.click();
        setTimeout(function () { a2.remove(); }, 2000);
        return true;
      } catch (err2) {
        return false;
      }
    }
  }

  function exportJSON() {
    var now = new Date();
    var ts = now.getFullYear() + '' + String(now.getMonth()+1).padStart(2,'0') + '' + String(now.getDate()).padStart(2,'0') + '_' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    var filename = 'faro-sur.config_' + ts + '.json';
    var ok = download(filename, JSON.stringify(cfg, null, 2), 'application/json');
    if (ok) toast('Archivo guardado: ' + filename);
    else toast('No se pudo descargar. Usa "Copiar JSON" y guárdalo manualmente.');
  }

  function exportJS() {
    // Forzar guardado de los cambios más recientes antes de exportar
    saveNow();
    var content = '/* Configuración de Comercial Faro Sur · generada desde el editor */\n' +
      'window.FARO_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n';
    var isSecure = (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    // Nombre simple para que el usuario lo reconozca fácilmente
    var filename = 'config.js';
    var ok = download(filename, content, 'text/javascript');
    if (ok) {
      if (isSecure && window.showSaveFilePicker) {
        toast('✅ Se abrirá un cuadro para elegir dónde guardar config.js. Elige la carpeta de tu sitio.');
      } else if (isSecure && window.showDirectoryPicker) {
        toast('✅ Se abrirá un cuadro para elegir la carpeta. Guarda config.js ahí.');
      } else {
        toast('✅ Descargado: config.js → carpeta de Descargas. Reemplaza el config.js de tu sitio con este.');
      }
      // También copiar al portapapeles como respaldo
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(content).then(function() {
            toast('📋 También copiado al portapapeles. Puedes pegarlo en Notepad si el archivo no se guardó.');
          }).catch(function(){});
        }
      } catch(e){}
    } else {
      toast('No se pudo descargar. Usa "Copiar JSON" y guárdalo manualmente.');
    }
  }

  function importConfig(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      toast('El JSON no es válido');
      return;
    }
    if (!data || !isObj(data.business) || !Array.isArray(data.categories) || !Array.isArray(data.products) ||
        !data.categories.every(isObj) || !data.products.every(isObj)) {
      toast('El archivo no tiene el formato esperado');
      return;
    }
    cfg = merge(DEFAULTS, data);
    ui.term = '';
    ui.category = '';
    saveNow();
    renderPage();
    renderPanel();
    toast('Configuración importada');
  }

  function resetConfig() {
    if (!window.confirm('¿Restaurar el contenido de fábrica? Se perderán los cambios guardados en este navegador.')) return;
    cfg = merge(DEFAULTS, {});
    ui.term = '';
    ui.category = '';
    saveNow();
    renderPage();
    renderPanel();
    toast('Contenido restaurado');
  }

  function copyConfig() {
    var text = JSON.stringify(cfg, null, 2);
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* noop */ }
      ta.remove();
      toast('Configuración copiada');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Configuración copiada');
      }).catch(fallback);
    } else {
      fallback();
    }
  }

  /* ---------- Editor: panel ---------- */
  function setPanel(open) {
    ui.panel = open;
    var panel = $('#panel');
    var scrim = $('#scrim');
    if (!panel || !scrim) return;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) panel.removeAttribute('inert');
    else panel.setAttribute('inert', '');
    scrim.classList.toggle('show', open);
    document.body.classList.toggle('panel-open', open);
    if (open) {
      ui.edit = true;
      renderPage();
      renderPanel();
    } else {
      saveNow();
    }
  }

  function handleFieldInput(el) {
    if (el.matches('[data-searches]')) {
      cfg.popularSearches = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      queueSave();
      queuePageRender();
      return;
    }
    if (el.matches('[data-commas]')) {
      var items = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      setPath(cfg, el.dataset.commas, items);
      queueSave();
      queuePageRender();
      return;
    }
    if (!el.matches('[data-field]')) return;
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'range' || el.type === 'number' || el.dataset.number !== undefined) val = Number(el.value);
    else val = el.value;

    setPath(cfg, el.dataset.field, val);

    if (el.type === 'color') {
      var hex = el.parentElement.querySelector('.color-hex');
      if (hex) hex.textContent = el.value;
    }
    if (el.type === 'range') {
      var wrap = el.closest('.f-inline');
      var out = wrap && wrap.querySelector('.range-val');
      if (out) out.textContent = el.value + ' px';
    }
    queueSave();
    queuePageRender();
  }

  /* ---------- Eventos ---------- */
  function onDocumentClick(e) {
    var openBtn = e.target.closest('[data-open-panel]');
    if (openBtn) {
      setPanel(true);
      return;
    }
    var exitBtn = e.target.closest('[data-exit-edit]');
    if (exitBtn) {
      ui.edit = false;
      setPanel(false);
      renderPage();
      saveNow();
      toast('Edición desactivada');
      return;
    }
    if (e.target.closest('[data-panel-close]')) {
      setPanel(false);
      return;
    }
    if (e.target.closest('[data-export-json]')) {
      exportJSON();
      return;
    }

    if (ui.edit) {
      var anchor = e.target.closest('a');
      if (anchor) e.preventDefault();
      return;
    }

    var clear = e.target.closest('[data-clear-filter]');
    if (clear) {
      ui.term = '';
      ui.category = '';
      renderPage();
      return;
    }

    var catBtn = e.target.closest('[data-filter-cat]');
    if (catBtn) {
      e.preventDefault();
      ui.category = catBtn.dataset.filterCat;
      ui.term = '';
      renderPage();
      scrollToProducts();
      return;
    }

    var termBtn = e.target.closest('[data-search-term]');
    if (termBtn) {
      e.preventDefault();
      ui.term = termBtn.dataset.searchTerm;
      ui.category = '';
      renderPage();
      scrollToProducts();
    }
  }

  function onInlineBlur(e) {
    var el = e.target.closest ? e.target.closest('[data-edit]') : null;
    if (!el || !ui.edit) return;
    var path = el.dataset.edit;
    var val = (el.innerText || '').replace(/\s+/g, ' ').trim();
    var old = String(getPath(cfg, path) == null ? '' : getPath(cfg, path));
    if (val === old) return;
    if (!val) {
      el.innerText = old;
      return;
    }
    setPath(cfg, path, val);
    saveNow();
    renderPage();
    toast('Texto actualizado');
  }

  function onSearchSubmit(e) {
    if (!e.target || e.target.id !== 'searchForm') return;
    e.preventDefault();
    var input = $('#searchInput');
    var select = $('#searchCategory');
    ui.term = input ? input.value.trim() : '';
    ui.category = select ? select.value : '';
    renderPage();
    scrollToProducts();
  }

  function onPanelInput(e) {
    var el = e.target;
    if (!el || !el.matches) return;
    if (el.matches('[data-field],[data-searches],[data-commas]')) handleFieldInput(el);
  }

  function onPanelChange(e) {
    var el = e.target;
    if (!el || !el.matches) return;
    if (el.matches('select[data-field], input[type="checkbox"][data-field]')) handleFieldInput(el);
    if (el.matches('input[type="file"]')) {
      if (el.dataset.upload) handleUpload(el);
      else if (el.dataset.import) {
        var file = el.files && el.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { importConfig(String(reader.result || '')); };
        reader.onerror = function () { toast('No se pudo leer el archivo'); };
        reader.readAsText(file);
      }
    }
  }

  function onPanelClick(e) {
    var tab = e.target.closest('[data-tab]');
    if (tab) {
      ui.tab = tab.dataset.tab;
      renderPanel();
      return;
    }
    var add = e.target.closest('[data-add]');
    if (add) {
      addItem(add.dataset.add);
      return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      removeItem(del.dataset.del, parseInt(del.dataset.index, 10));
      return;
    }
    var mv = e.target.closest('[data-move]');
    if (mv) {
      moveItem(mv.dataset.move, parseInt(mv.dataset.index, 10), parseInt(mv.dataset.dir, 10));
      return;
    }
    var preset = e.target.closest('[data-preset]');
    if (preset) {
      var p = PRESETS[preset.dataset.preset];
      if (p) {
        cfg.theme.primary = p.primary;
        cfg.theme.accent = p.accent;
        cfg.theme.hot = p.hot;
        cfg.theme.bg = p.bg;
        saveNow();
        renderPage();
        renderPanel(true);
        toast('Paleta aplicada');
      }
      return;
    }
    var cmd = e.target.closest('[data-cmd]');
    if (!cmd) return;
    var action = cmd.dataset.cmd;
    if (action === 'clear-logo') {
      cfg.business.logoImage = '';
      saveNow();
      renderPage();
      renderPanel(true);
    } else if (action === 'clear-product-image') {
      var idx = parseInt(cmd.dataset.index, 10);
      if (cfg.products[idx]) cfg.products[idx].image = '';
      saveNow();
      renderPage();
      renderPanel(true);
    } else if (action === 'export-json') {
      exportJSON();
    } else if (action === 'export-js') {
      exportJS();
    } else if (action === 'copy-json') {
      copyConfig();
    } else if (action === 'import-text') {
      var ta = $('#importText');
      if (ta && ta.value.trim()) importConfig(ta.value.trim());
      else toast('Pega primero un JSON');
    } else if (action === 'reset') {
      resetConfig();
    }
  }

  function bindEvents() {
    var editToggle = $('#editToggle');
    if (editToggle) {
      editToggle.addEventListener('click', function () {
        setPanel(true);
        toast('Editor abierto · haz clic en los textos para cambiarlos');
      });
    }

    var scrim = $('#scrim');
    if (scrim) scrim.addEventListener('click', function () { setPanel(false); });

    var panel = $('#panel');
    if (panel) {
      panel.addEventListener('click', onPanelClick);
      panel.addEventListener('input', onPanelInput);
      panel.addEventListener('change', onPanelChange);
    }

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('focusout', onInlineBlur);
    document.addEventListener('submit', onSearchSubmit);

    document.addEventListener('paste', function (e) {
      if (!e.target.closest || !e.target.closest('[data-edit]')) return;
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ui.panel) setPanel(false);
    });

    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveNow();
    });
  }

  /* ---------- Inicio ---------- */
  renderPage();
  bindEvents();

  var params;
  try { params = new URLSearchParams(window.location.search); } catch (err) { params = null; }
  // Solo permitir edición en entorno local (file:// o localhost) O con clave de admin
  var isLocal = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '');
  var adminKey = (cfg.business && cfg.business.adminKey) ? String(cfg.business.adminKey).trim() : '';
  var urlAdmin = params ? (params.get('admin') || '') : '';
  var hasAdminAccess = adminKey && urlAdmin && urlAdmin === adminKey;
  var editMode = (isLocal && params && /^(1|true|si|sí|on)$/i.test(params.get('editar') || '')) || hasAdminAccess;
  // Ocultar botón de edición al público; solo visible con acceso de admin
  var editToggle = $('#editToggle');
  var editHint = $('#editHint');
  if (editMode) {
    if (editToggle) editToggle.style.display = 'inline-flex';
    if (editHint) editHint.style.display = 'flex';
    setPanel(true);
  } else {
    if (editToggle) editToggle.style.display = 'none';
    if (editHint) editHint.style.display = 'none';
    // Triple clic en el logo para pedir contraseña de admin
    var logoEl = document.querySelector('.brand');
    if (logoEl && adminKey) {
      var clickCount = 0;
      var clickTimer = null;
      logoEl.addEventListener('click', function (e) {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clickCount = 0; }, 800);
        if (clickCount >= 3) {
          clickCount = 0;
          var pass = prompt('Clave de administrador:');
          if (pass && pass.trim() === adminKey) {
            if (editToggle) editToggle.style.display = 'inline-flex';
            if (editHint) editHint.style.display = 'flex';
            setPanel(true);
            toast('Modo edición activado');
          } else if (pass !== null) {
            toast('Clave incorrecta');
          }
        }
      });
    }
  }
})();
