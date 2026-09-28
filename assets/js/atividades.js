// Motor genérico de arrastar-e-soltar e de revelar-ao-clicar,
// usado pelas páginas atividade-1.html .. atividade-5.html.
(function () {
  'use strict';

  function initDragActivity(root) {
    var drags = root.querySelectorAll('[data-drag]');
    var drops = root.querySelectorAll('[data-drop]');
    if (!drags.length) return;

    var active = null, offsetX = 0, offsetY = 0;
    // Per-element "home": where to put it back if the drop misses, and what
    // inline styles it had before we ever touched it.
    var homes = new Map();
    var total = drops.length;

    function point(e) {
      return e.touches && e.touches.length ? e.touches[0] : e;
    }

    function rememberHome(el) {
      if (homes.has(el)) return;
      homes.set(el, {
        parent: el.parentNode,
        next: el.nextSibling,
        style: el.getAttribute('style') || ''
      });
    }

    function onDown(e, el) {
      if (el.classList.contains('is-locked')) return;
      if (e.button != null && e.button !== 0) return; // left click / primary touch only
      rememberHome(el);

      var rect = el.getBoundingClientRect();
      var p = point(e);
      offsetX = p.clientX - rect.left;
      offsetY = p.clientY - rect.top;

      // Move the piece to <body>, fixed-positioned in viewport coordinates,
      // for the duration of the drag. This is what lets it travel freely
      // over a map box or scroll container without ever being clipped by
      // that container's overflow — and it sidesteps a nastier problem:
      // toggling a container's overflow mid-drag (the previous approach)
      // can show/hide its scrollbar and shift the whole page layout right
      // under the cursor, silently invalidating every coordinate in flight.
      active = el;
      document.body.appendChild(el);
      el.style.position = 'fixed';
      el.style.margin = '0';
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      el.style.zIndex = 9999;
      el.classList.add('is-dragging');
      e.preventDefault();
    }

    function onMove(e) {
      if (!active) return;
      var p = point(e);
      active.style.left = (p.clientX - offsetX) + 'px';
      active.style.top = (p.clientY - offsetY) + 'px';
      e.preventDefault();
    }

    function overlapArea(a, b) {
      var x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      var y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    }

    function placeAt(el, targetRect) {
      // el is currently position:fixed on <body>; convert the desired
      // viewport rect into coordinates relative to el's eventual static
      // parent, then drop it back into normal flow there.
      var home = homes.get(el);
      home.parent.insertBefore(el, home.next);
      el.style.position = 'absolute';
      var parentRect = el.offsetParent.getBoundingClientRect();
      el.style.left = (targetRect.left - parentRect.left) + 'px';
      el.style.top = (targetRect.top - parentRect.top) + 'px';
      el.style.width = '';
      el.style.height = '';
    }

    function onUp() {
      if (!active) return;
      var el = active;
      active = null;
      el.classList.remove('is-dragging');
      el.style.zIndex = '';

      var dragRect = el.getBoundingClientRect();
      var dragArea = dragRect.width * dragRect.height;
      var dragCx = dragRect.left + dragRect.width / 2;
      var dragCy = dragRect.top + dragRect.height / 2;

      // Among zones the piece actually overlaps, pick the one whose CENTER
      // is closest to the piece's center. Ranking by raw or fractional
      // overlap area instead breaks down in two common cases: a huge target
      // (e.g. a whole map shape) can out-score a tiny nearby chip target
      // with only a sliver of overlap, and several same-size targets packed
      // close together (e.g. a list of small answer boxes) can each claim a
      // similar overlap fraction of a piece dropped near their shared edge.
      // Center-to-center distance has neither problem.
      var best = null, bestDist = Infinity;
      drops.forEach(function (dz) {
        if (dz.classList.contains('is-locked')) return;
        var zoneRect = dz.getBoundingClientRect();
        var overlap = overlapArea(dragRect, zoneRect);
        if (overlap <= 0) return;
        var zoneArea = zoneRect.width * zoneRect.height;
        var fraction = overlap / Math.min(dragArea, zoneArea);
        if (fraction < 0.2) return; // still require a meaningful overlap
        var dist = Math.hypot(dragCx - (zoneRect.left + zoneRect.width / 2), dragCy - (zoneRect.top + zoneRect.height / 2));
        if (dist < bestDist) { bestDist = dist; best = dz; }
      });

      var isMatch = best && best.dataset.drop === el.dataset.drag;

      if (isMatch) {
        placeAt(el, best.getBoundingClientRect());
        el.classList.add('is-locked', 'is-correct');
        best.classList.add('is-locked');
        checkDone();
      } else {
        // Missed — put it back exactly where it started: same parent, same
        // spot in the sibling order, same inline style as before the drag.
        var home = homes.get(el);
        home.parent.insertBefore(el, home.next);
        el.setAttribute('style', home.style);
      }
    }

    function checkDone() {
      var done = root.querySelectorAll('[data-drag].is-correct').length;
      if (done >= total) {
        var banner = root.querySelector('[data-ativ-success]');
        if (banner) banner.classList.add('is-visible');
      }
    }

    if (window.PointerEvent) {
      drags.forEach(function (el) {
        el.addEventListener('pointerdown', function (e) { onDown(e, el); });
      });
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    } else {
      drags.forEach(function (el) {
        el.addEventListener('mousedown', function (e) { onDown(e, el); });
        el.addEventListener('touchstart', function (e) { onDown(e, el); }, { passive: false });
      });
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchend', onUp);
    }
  }

  function initRevealActivity(root) {
    var tabs = root.querySelectorAll('[data-reveal-tab]');
    var panels = root.querySelectorAll('[data-reveal-panel]');
    if (tabs.length) {
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function (e) {
          e.preventDefault();
          var target = tab.getAttribute('data-reveal-tab');
          tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
          panels.forEach(function (p) {
            p.classList.toggle('is-active', p.getAttribute('data-reveal-panel') === target);
          });
        });
      });
    }

    root.querySelectorAll('[data-reveal-term]').forEach(function (term) {
      term.addEventListener('click', function (e) {
        e.preventDefault();
        var id = term.getAttribute('data-reveal-term');
        var layer = root.querySelector('[data-reveal-layer="' + id + '"]');
        if (layer) layer.classList.toggle('is-visible');
        term.classList.toggle('is-active');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-drag-activity]').forEach(initDragActivity);
    document.querySelectorAll('[data-reveal-activity]').forEach(initRevealActivity);

    document.querySelectorAll('[data-ativ-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.reload(); });
    });
  });
})();
