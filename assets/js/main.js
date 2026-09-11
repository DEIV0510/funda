/* =========================================================================
   FUNDASPED · comportamiento de la página
   JavaScript sin dependencias. Todo lo esencial (enlaces, WhatsApp, correo,
   contenidos) funciona también con el script desactivado.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Este archivo arrancó: cancelamos la red de seguridad que mostraría todas
  // las secciones de golpe y dejaría sin efecto el reveal al hacer scroll.
  clearTimeout(window.__fundaspedFallback);

  /* ------------------------------- Utilidades ---------------------------- */
  var WA_NUM = '573207584383';
  var WA_BASE = 'Hola FUNDASPED, ';

  function waLink(texto) {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(WA_BASE + texto);
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* --------------------------- Pantalla de carga ------------------------- */
  (function loader() {
    var el = document.getElementById('loader');
    if (!el) { root.classList.add('ready'); return; }

    // Visitas siguientes en la misma sesión: sin pantalla de carga.
    var visto = false;
    try { visto = sessionStorage.getItem('fundasped-visto') === '1'; } catch (e) { /* modo privado */ }

    function cerrar() {
      el.classList.add('off');
      root.classList.add('ready');
      window.setTimeout(function () { el.hidden = true; }, 500);
      try { sessionStorage.setItem('fundasped-visto', '1'); } catch (e) { /* modo privado */ }
    }

    if (visto || reduce) { el.hidden = true; root.classList.add('ready'); return; }

    var inicio = Date.now();
    var MIN = 620, MAX = 1200;
    function alTerminar() {
      var espera = Math.max(0, Math.min(MIN - (Date.now() - inicio), MIN));
      window.setTimeout(cerrar, espera);
    }
    if (document.readyState === 'complete') alTerminar();
    else window.addEventListener('load', alTerminar, { once: true });
    window.setTimeout(cerrar, MAX);
  })();

  /* -------------------------------- Header ------------------------------- */
  (function header() {
    var hdr = document.getElementById('hdr');
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!hdr) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        hdr.classList.toggle('stuck', window.scrollY > 24);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!burger || !nav) return;
    function setMenu(abierto) {
      nav.classList.toggle('open', abierto);
      burger.setAttribute('aria-expanded', String(abierto));
      burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('no-scroll', abierto);
    }
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && nav.classList.contains('open')) setMenu(false);
    });
  })();

  /* ------------------------- Reveal y cifras animadas --------------------- */
  (function reveal() {
    // Un barrido propio en vez de IntersectionObserver: con scroll rápido o por
    // inercia el observer se salta entradas y deja secciones en opacity 0.
    var pendientes = $$('.reveal').concat($$('.sec-head'));

    function mostrar(el) {
      el.classList.add(el.classList.contains('sec-head') ? 'in-view' : 'in');
      var num = el.querySelector('[data-count]');
      if (num) contar(num);
    }

    function contar(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var fin = parseInt(el.dataset.count, 10);
      var suf = el.dataset.suffix || '';
      if (reduce || !fin) { el.textContent = fin + suf; return; }
      var dur = 1000, t0 = null;
      function paso(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) window.requestAnimationFrame(paso);
      }
      el.textContent = '0' + suf;
      window.requestAnimationFrame(paso);
    }

    var pendiente = false;
    function barrer() {
      pendiente = false;
      var limite = (window.innerHeight || 0) * 0.92;
      for (var i = pendientes.length - 1; i >= 0; i--) {
        if (pendientes[i].getBoundingClientRect().top < limite) {
          mostrar(pendientes[i]);
          pendientes.splice(i, 1);
        }
      }
      if (!pendientes.length) {
        window.removeEventListener('scroll', pedir);
        window.removeEventListener('resize', pedir);
      }
    }
    function pedir() {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(barrer);
    }

    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    barrer();
    // Tras cargar las fuentes y las imágenes las alturas cambian: repasamos.
    window.addEventListener('load', pedir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedir);
  })();

  /* ------------------------------ Scrollspy ------------------------------ */
  (function spy() {
    var enlaces = $$('.nav a[href^="#"]');
    if (!enlaces.length || !('IntersectionObserver' in window)) return;
    var mapa = {};
    var secciones = enlaces.map(function (a) {
      var id = a.getAttribute('href').slice(1);
      mapa[id] = a;
      return document.getElementById(id);
    }).filter(Boolean);

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = mapa[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          enlaces.forEach(function (x) { x.classList.remove('on'); });
          a.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach(function (s) { io.observe(s); });
  })();

  /* ------------------------- Acordeón de los módulos --------------------- */
  (function modulos() {
    var mods = $$('.mod');
    if (!mods.length) return;

    function abrir(mod) {
      mods.forEach(function (m) {
        var es = m === mod;
        m.toggleAttribute('data-open', es);
        var b = $('.mod-h', m);
        if (b) b.setAttribute('aria-expanded', String(es));
      });
    }
    abrir(mods[0]);

    var fino = window.matchMedia('(hover: hover) and (pointer: fine)');
    mods.forEach(function (m) {
      var btn = $('.mod-h', m);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (m.hasAttribute('data-open')) return; // el módulo abierto se mantiene visible
        abrir(m);
      });
      m.addEventListener('mouseenter', function () {
        if (fino.matches && !reduce) abrir(m);
      });
      btn.addEventListener('focus', function () { abrir(m); });
    });
  })();

  /* ---------------------------- Diálogos (overlay) ----------------------- */
  var overlay = (function () {
    var ov = document.getElementById('ov');
    var box = document.getElementById('ov-box');
    var body = document.getElementById('ov-body');
    var previo = null;
    if (!ov || !box || !body) return { abrir: function () {}, cerrar: function () {} };

    function focusables() {
      return $$('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])', box)
        .filter(function (el) { return el.offsetParent !== null; });
    }

    function cerrar() {
      ov.hidden = true;
      document.body.classList.remove('no-scroll');
      body.innerHTML = '';
      box.classList.remove('is-img');
      if (previo && previo.focus) previo.focus();
      previo = null;
    }

    function abrir(html, esImagen, etiqueta) {
      previo = document.activeElement;
      body.innerHTML = html;
      box.classList.toggle('is-img', !!esImagen);
      box.setAttribute('aria-label', etiqueta || 'Información');
      ov.hidden = false;
      document.body.classList.add('no-scroll');
      box.focus();
    }

    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (ov.hidden) return;
      if (e.key === 'Escape') { cerrar(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      var primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === box)) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primero.focus();
      }
    });

    return { abrir: abrir, cerrar: cerrar };
  })();

  /* ------------------------- Galería y certificación --------------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-full]');
    if (!btn) return;
    var src = btn.getAttribute('data-full');
    var cap = btn.getAttribute('data-cap') || '';
    overlay.abrir(
      '<figure class="ov-fig"><img src="' + src + '" alt="' + cap.replace(/"/g, '&quot;') + '">' +
      (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>',
      true,
      cap
    );
  });

  /* ------------------------------- Propuestas ---------------------------- */
  var PROPUESTAS = {
    '1': {
      n: '01',
      titulo: 'Mil Lectores Expertos',
      para: 'Estudiantes de grado 11°',
      objetivo: 'Preparación para las becas universitarias del Estado.',
      texto: [
        'El proyecto Mil Lectores Expertos acompaña a los estudiantes de grado 11° en su preparación para las pruebas de Estado y para el acceso a las becas universitarias que ofrece el Estado.',
        'El trabajo se apoya en las 20 técnicas del programa: percepción y lectura veloz, comprensión y preparación de exámenes. Al finalizar, cada participante recibe su certificado como Lector Experto en Técnicas de Lectura Rápida.'
      ]
    },
    '2': {
      n: '02',
      titulo: 'Talleres de diagnóstico en competencia lectora',
      para: 'Grados 3°, 5°, 9° y 11°',
      objetivo: 'Identificar dificultades y diseñar estrategias de mejoramiento.',
      texto: [
        'Los talleres se dirigen a los grados 3°, 5°, 9° y 11° con el fin de identificar las dificultades de los niños y jóvenes en competencia lectora y, a partir de ahí, diseñar estrategias de mejoramiento de los procesos educativos de la institución.',
        'La inversión por estudiante es accesible y puede ajustarse según la cobertura solicitada; con gusto compartimos las condiciones en una reunión con su equipo.',
        'Como contraprestación, FUNDASPED capacita gratuitamente a los docentes de la institución en las técnicas de lectura, mostrándoles los enfoques metodológicos para el mejoramiento de la calidad educativa.'
      ]
    },
    '3': {
      n: '03',
      titulo: 'Promoción anticipada para estudiantes no promovidos',
      para: 'Estudiantes que no fueron promovidos',
      objetivo: 'Alcanzar los resultados necesarios para ser promovidos en el primer periodo.',
      texto: [
        'Invitación al proyecto Mil Lectores Expertos para los estudiantes de la institución que no fueron promovidos.',
        'El objetivo es que, a través de la capacitación en técnicas de lectura rápida, alcancen los resultados necesarios para ser promovidos de manera anticipada durante el primer periodo académico.'
      ]
    },
    '4': {
      n: '04',
      titulo: 'Textos educativos «El arte de leer»',
      para: 'Grado cero o preescolar y grado primero',
      objetivo: 'Material de lectura para acompañar los grados iniciales.',
      texto: [
        'FUNDASPED cuenta con los textos educativos El arte de leer para grado cero o preescolar y El arte de leer para grado primero.',
        'Compartimos con gusto los detalles de estos materiales y la forma de vincularlos al trabajo de aula de su institución.'
      ]
    }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-prop]');
    if (!btn) return;
    var p = PROPUESTAS[btn.getAttribute('data-prop')];
    if (!p) return;
    var html =
      '<p class="ov-eyebrow"><span class="folio">' + p.n + '</span> Propuesta</p>' +
      '<h2 class="ov-title" id="ov-title">' + p.titulo + '</h2>' +
      '<dl class="ov-meta">' +
        '<div><dt>Para quién</dt><dd>' + p.para + '</dd></div>' +
        '<div><dt>Objetivo</dt><dd>' + p.objetivo + '</dd></div>' +
      '</dl>' +
      p.texto.map(function (t) { return '<p>' + t + '</p>'; }).join('') +
      '<div class="ov-cta">' +
        '<a class="btn btn-gold" href="' + waLink('me interesa la propuesta «' + p.titulo + '» para mi institución.') + '" target="_blank" rel="noopener">Hablar por WhatsApp</a>' +
        '<a class="btn btn-line" href="#contacto" data-close>Solicitar reunión</a>' +
      '</div>';
    overlay.abrir(html, false, p.titulo);
  });

  /* -------------------------------- Donación ----------------------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-modal="donar"]');
    if (!btn) return;
    var html =
      '<p class="ov-eyebrow">Donaciones</p>' +
      '<h2 class="ov-title" id="ov-title">Cómo hacer su aporte</h2>' +
      '<p>FUNDASPED es una entidad sin ánimo de lucro. Los aportes se destinan a los talleres de diagnóstico, la capacitación gratuita a docentes, los materiales de lectura para los grados iniciales y las becas de estudiantes del programa.</p>' +
      '<p><strong>Escríbanos por WhatsApp o correo y le compartiremos los medios disponibles</strong> para hacer su donación, junto con el detalle de a qué se destinará.</p>' +
      '<div class="ov-cta">' +
        '<a class="btn btn-gold" href="' + waLink('quiero hacer una donación para apoyar el programa de lectura.') + '" target="_blank" rel="noopener">Escribir por WhatsApp</a>' +
        '<a class="btn btn-line" href="mailto:aspededucacion@gmail.com?subject=Donaci%C3%B3n%20-%20FUNDASPED">Escribir al correo</a>' +
      '</div>';
    overlay.abrir(html, false, 'Cómo donar');
  });

  /* --------------------------- Formulario de contacto -------------------- */
  (function formulario() {
    var form = document.getElementById('form');
    var error = document.getElementById('f-error');
    if (!form) return;

    // Cuando exista un backend, basta con apuntar ENDPOINT a la ruta que lo
    // reciba; mientras tanto la solicitud se entrega por WhatsApp.
    var ENDPOINT = null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var datos = {};
      $$('input,select', form).forEach(function (el) {
        datos[el.name] = (el.value || '').trim();
        el.removeAttribute('aria-invalid');
      });

      var faltan = $$('[required]', form).filter(function (el) { return !el.value.trim(); });
      if (faltan.length) {
        faltan.forEach(function (el) { el.setAttribute('aria-invalid', 'true'); });
        error.textContent = 'Complete los campos obligatorios: nombre, institución y teléfono.';
        error.hidden = false;
        faltan[0].focus();
        return;
      }
      if (datos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo)) {
        var mail = $('#f-mail', form);
        mail.setAttribute('aria-invalid', 'true');
        error.textContent = 'Revise el correo: no parece una dirección válida.';
        error.hidden = false;
        mail.focus();
        return;
      }
      error.hidden = true;

      var lineas = [
        'soy ' + datos.nombre + (datos.cargo ? ', ' + datos.cargo : '') + ' de ' + datos.institucion + '.',
        datos.municipio ? 'Municipio: ' + datos.municipio + '.' : '',
        'Interés: ' + datos.interes + '.',
        'Teléfono: ' + datos.telefono + '.',
        datos.correo ? 'Correo: ' + datos.correo + '.' : '',
        'Quisiera recibir información del programa de Técnicas de Lectura Rápida, Comprensión y Retención.'
      ].filter(Boolean);

      if (ENDPOINT) {
        // Punto de conexión para un backend futuro.
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        }).catch(function () { /* la vía de WhatsApp sigue disponible */ });
      }

      window.open(waLink(lineas.join(' ')), '_blank', 'noopener');
      form.reset();
    });
  })();

  /* ------------------------ Paralaje muy leve en fotos ------------------- */
  (function parallax() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var els = $('[data-par]');
    if (!els.length) return;

    var visibles = [];
    var pendiente = false;

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var i = visibles.indexOf(en.target);
        if (en.isIntersecting && i < 0) visibles.push(en.target);
        else if (!en.isIntersecting && i >= 0) visibles.splice(i, 1);
      });
      colocar();
    }, { rootMargin: '150px 0px' });
    els.forEach(function (el) { io.observe(el); });

    function colocar() {
      pendiente = false;
      var vh = window.innerHeight || 1;
      visibles.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;        // -1 arriba, +1 abajo
        var d = p * parseFloat(el.dataset.par || 0) * 210;
        el.style.setProperty('--par', d.toFixed(1) + 'px');
      });
    }

    window.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(colocar);
    }, { passive: true });
    window.addEventListener('resize', colocar);
    colocar();
  })();

  /* --------------------------------- Varios ------------------------------ */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
