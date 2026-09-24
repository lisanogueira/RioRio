// Motor genérico de arrastar-e-soltar e de revelar-ao-clicar,
// usado pelas páginas atividade-1.html .. atividade-5.html.
(function () {
  'use strict';

  function initDragActivity(root) {
    var drags = root.querySelectorAll('[data-drag]');
    var drops = root.querySelectorAll('[data-drop]');
    if (!drags.length) return;

    var active = null, offsetX = 0, offsetY = 0, startLeft = 0, startTop = 0;
    var total = drops.length;

    function point(e) {
      return e.touches && e.touches.length ? e.touches[0] : e;
    }

    function freeze(el) {
      // Elements that start in normal document flow (e.g. chips laid out in
      // a flex bank list) must be pinned to absolute px coordinates before
      // they can be dragged around freely. Pulling one out of the flow can
      // shrink/reflow its flex container (fewer chips left in the row), which
      // would silently shift el's own offsetParent underneath it — so a
      // same-size invisible placeholder is left behind to hold that space.
      if (getComputedStyle(el).position === 'absolute') return;
      var rect = el.getBoundingClientRect();
      var parent = el.offsetParent || document.body;
      var parentRect = parent.getBoundingClientRect();

      var placeholder = document.createElement('span');
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.display = getComputedStyle(el).display;
      placeholder.style.width = rect.width + 'px';
      placeholder.style.height = rect.height + 'px';
      placeholder.style.visibility = 'hidden';
      el.parentNode.insertBefore(placeholder, el);

      el.style.position = 'absolute';
      el.style.margin = '0';
      el.style.left = (rect.left - parentRect.left) + 'px';
      el.style.top = (rect.top - parentRect.top) + 'px';
    }

    function setStageClipping(disabled) {
      // While a piece is being dragged it must be able to visually leave the
      // map box (e.g. travel down to an answer list below it) — toggle off
      // the stage's scroll-container clipping for the duration of the drag.
      root.querySelectorAll('.ativ-stage-scroll').forEach(function (el) {
        el.classList.toggle('is-dragging-active', disabled);
      });
    }

    function onDown(e, el) {
      if (el.classList.contains('is-locked')) return;
      if (e.button != null && e.button !== 0) return; // left click / primary touch only
      freeze(el);
      active = el;
      var p = point(e);
      var rect = el.getBoundingClientRect();
      var parentRect = el.offsetParent.getBoundingClientRect();
      startLeft = rect.left - parentRect.left;
      startTop = rect.top - parentRect.top;
      offsetX = p.clientX - rect.left;
      offsetY = p.clientY - rect.top;
      el.classList.add('is-dragging');
      el.style.zIndex = 9999;
      setStageClipping(true);
      e.preventDefault();
    }

    function onMove(e) {
      if (!active) return;
      var p = point(e);
      var parentRect = active.offsetParent.getBoundingClientRect();
      var x = p.clientX - parentRect.left - offsetX;
      var y = p.clientY - parentRect.top - offsetY;
      active.style.left = x + 'px';
      active.style.top = y + 'px';
      e.preventDefault();
    }

    function overlapArea(a, b) {
      var x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      var y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    }

    function onUp(e) {
      if (!active) return;
      var el = active;
      active = null;
      el.classList.remove('is-dragging');
      el.style.zIndex = '';
      setStageClipping(false);

      var dragRect = el.getBoundingClientRect();
      var dragArea = dragRect.width * dragRect.height;
      var best = null, bestArea = 0;
      drops.forEach(function (dz) {
        if (dz.classList.contains('is-locked')) return;
        var a = overlapArea(dragRect, dz.getBoundingClientRect());
        if (a > bestArea) { bestArea = a; best = dz; }
      });

      // Accept the drop as soon as roughly a fifth of the piece (or of the
      // target, whichever is smaller — matters for the tiny map pins) sits
      // over the right target. Real fingers and mice are imprecise.
      var bestDzArea = best ? (function () { var r = best.getBoundingClientRect(); return r.width * r.height; })() : 0;
      var threshold = 0.2 * Math.min(dragArea, bestDzArea || dragArea);
      var isMatch = best && bestArea > threshold && best.dataset.drop === el.dataset.drag;

      if (isMatch) {
        var parentRect = el.offsetParent.getBoundingClientRect();
        var dzRect = best.getBoundingClientRect();
        el.style.left = (dzRect.left - parentRect.left) + 'px';
        el.style.top = (dzRect.top - parentRect.top) + 'px';
        el.classList.add('is-locked', 'is-correct');
        best.classList.add('is-locked');
        checkDone();
      } else {
        el.style.left = startLeft + 'px';
        el.style.top = startTop + 'px';
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
