// Interações das páginas atividade-1.html .. atividade-5.html.
(function () {
  'use strict';

  function initDragActivity(root) {
    var drags = Array.prototype.slice.call(root.querySelectorAll('[data-drag]'));
    var drops = Array.prototype.slice.call(root.querySelectorAll('[data-drop]'));
    if (!drags.length || !drops.length) return;

    var active = null, selected = null, offsetX = 0, offsetY = 0;
    var startX = 0, startY = 0, moved = false;
    var homes = new Map();
    var requiredAnswers = drops.length;

    var help = document.createElement('p');
    help.className = 'ativ-help';
    help.textContent = 'Arraste uma peça até o local correto ou selecione a peça e depois selecione o destino.';
    var firstInteractive = root.querySelector('.ativ-stage-scroll, .ativ-bank, .ativ-answers');
    if (firstInteractive) root.insertBefore(help, firstInteractive);

    var status = document.createElement('p');
    status.className = 'ativ-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    root.appendChild(status);

    function announce(message, state) {
      status.textContent = message;
      status.classList.remove('is-error', 'is-progress');
      if (state) status.classList.add(state);
    }

    function point(e) { return e.touches && e.touches.length ? e.touches[0] : e; }

    function rememberHome(el) {
      if (homes.has(el)) return;
      homes.set(el, { parent: el.parentNode, next: el.nextSibling, style: el.getAttribute('style') || '' });
    }

    function restoreHome(el) {
      var home = homes.get(el);
      if (!home) return;
      home.parent.insertBefore(el, home.next);
      if (home.style) el.setAttribute('style', home.style);
      else el.removeAttribute('style');
      el.classList.remove('is-dragging');
    }

    function setSelected(el) {
      if (selected) {
        selected.classList.remove('is-selected');
        selected.setAttribute('aria-pressed', 'false');
      }
      selected = selected === el ? null : el;
      if (selected) {
        selected.classList.add('is-selected');
        selected.setAttribute('aria-pressed', 'true');
        announce('Peça selecionada. Agora escolha o destino.', 'is-progress');
      } else announce('Seleção cancelada.');
    }

    function pieceName(el) {
      var row = el.closest('.ativ-bank__row');
      var label = row && row.querySelector('.ativ-bank__label');
      return (label ? label.textContent : el.textContent).trim() || 'peça';
    }

    function dropName(drop) {
      var row = drop.closest('.ativ-answers__row');
      var label = row && row.querySelector('.ativ-answers__label');
      return (label ? label.textContent : drop.getAttribute('aria-label')) || 'destino no mapa';
    }

    function checkDone() {
      var done = root.querySelectorAll('[data-drag].is-correct').length;
      if (done >= requiredAnswers) {
        var banner = root.querySelector('[data-ativ-success]');
        if (banner) banner.classList.add('is-visible');
        announce('Parabéns! Você concluiu todos os ' + requiredAnswers + ' itens.');
      } else announce(done + ' de ' + requiredAnswers + ' itens corretos.', 'is-progress');
    }

    function placeInDrop(el, drop) {
      rememberHome(el);
      var backgroundImage = el.style.backgroundImage;
      drop.appendChild(el);
      el.removeAttribute('style');
      if (backgroundImage) el.style.backgroundImage = backgroundImage;
      el.classList.remove('is-dragging', 'is-selected');
      el.classList.add('is-locked', 'is-correct');
      el.setAttribute('aria-pressed', 'false');
      el.setAttribute('tabindex', '-1');
      drop.classList.add('is-locked');
      drop.setAttribute('tabindex', '-1');
      drop.setAttribute('aria-disabled', 'true');
      selected = null;
      announce('Correto: ' + pieceName(el) + ' em ' + dropName(drop) + '.', 'is-progress');
      checkDone();
    }

    function tryDrop(el, drop) {
      if (!el || !drop || el.classList.contains('is-locked') || drop.classList.contains('is-locked')) return;
      if (drop.dataset.drop === el.dataset.drag) placeInDrop(el, drop);
      else {
        announce('Ainda não. Tente outro destino para essa peça.', 'is-error');
        drop.classList.add('is-wrong');
        window.setTimeout(function () { drop.classList.remove('is-wrong'); }, 450);
      }
    }

    function overlapArea(a, b) {
      var x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      var y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y;
    }

    function onDown(e, el) {
      if (el.classList.contains('is-locked') || (e.button != null && e.button !== 0)) return;
      rememberHome(el);
      var rect = el.getBoundingClientRect(), p = point(e);
      startX = p.clientX; startY = p.clientY;
      offsetX = startX - rect.left; offsetY = startY - rect.top;
      moved = false; active = el;
      document.body.appendChild(el);
      el.style.position = 'fixed'; el.style.margin = '0';
      el.style.width = rect.width + 'px'; el.style.height = rect.height + 'px';
      el.style.left = rect.left + 'px'; el.style.top = rect.top + 'px';
      el.style.zIndex = '9999'; el.classList.add('is-dragging');
      e.preventDefault();
    }

    function onMove(e) {
      if (!active) return;
      var p = point(e);
      if (Math.hypot(p.clientX - startX, p.clientY - startY) > 5) moved = true;
      active.style.left = (p.clientX - offsetX) + 'px';
      active.style.top = (p.clientY - offsetY) + 'px';
      e.preventDefault();
    }

    function onUp() {
      if (!active) return;
      var el = active; active = null;
      if (!moved) { restoreHome(el); setSelected(el); return; }

      var dragRect = el.getBoundingClientRect();
      var dragArea = dragRect.width * dragRect.height;
      var dragCx = dragRect.left + dragRect.width / 2;
      var dragCy = dragRect.top + dragRect.height / 2;
      var best = null, bestDist = Infinity;
      drops.forEach(function (drop) {
        if (drop.classList.contains('is-locked')) return;
        var zoneRect = drop.getBoundingClientRect();
        var overlap = overlapArea(dragRect, zoneRect);
        if (overlap <= 0 || overlap / Math.min(dragArea, zoneRect.width * zoneRect.height) < 0.2) return;
        var dist = Math.hypot(dragCx - (zoneRect.left + zoneRect.width / 2), dragCy - (zoneRect.top + zoneRect.height / 2));
        if (dist < bestDist) { bestDist = dist; best = drop; }
      });
      restoreHome(el);
      if (best) tryDrop(el, best);
      else announce('A peça não chegou a um destino. Tente novamente.', 'is-error');
    }

    drags.forEach(function (el) {
      el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', 'false'); el.setAttribute('aria-label', 'Selecionar ' + pieceName(el));
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(el); }
      });
    });
    drops.forEach(function (drop) {
      drop.setAttribute('role', 'button'); drop.setAttribute('tabindex', '0');
      drop.setAttribute('aria-label', 'Destino: ' + dropName(drop) + ' (' + drop.dataset.drop.replace(/-/g, ' ') + ')');
      drop.addEventListener('click', function () { tryDrop(selected, drop); });
      drop.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryDrop(selected, drop); }
      });
    });

    if (window.PointerEvent) {
      drags.forEach(function (el) { el.addEventListener('pointerdown', function (e) { onDown(e, el); }); });
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
    announce('0 de ' + requiredAnswers + ' itens corretos.', 'is-progress');
  }

  function initRevealActivity(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-reveal-tab]'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-reveal-panel]'));
    function activateTab(tab) {
      var target = tab.getAttribute('data-reveal-tab');
      tabs.forEach(function (item) {
        var active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.setAttribute('tabindex', active ? '0' : '-1');
      });
      panels.forEach(function (panel) { panel.classList.toggle('is-active', panel.getAttribute('data-reveal-panel') === target); });
    }
    tabs.forEach(function (tab, index) {
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      tab.addEventListener('click', function (e) { e.preventDefault(); activateTab(tab); });
      tab.addEventListener('keydown', function (e) {
        var current = tabs.indexOf(tab);
        var next = e.key === 'ArrowRight' ? current + 1 : e.key === 'ArrowLeft' ? current - 1 : -1;
        if (next !== -1) {
          e.preventDefault();
          var target = tabs[(next + tabs.length) % tabs.length];
          activateTab(target); target.focus();
        }
      });
    });
    root.querySelectorAll('[data-reveal-term]').forEach(function (term) {
      term.setAttribute('aria-pressed', 'false');
      term.addEventListener('click', function (e) {
        e.preventDefault();
        var id = term.getAttribute('data-reveal-term');
        var layer = root.querySelector('[data-reveal-layer="' + id + '"]');
        var visible = !term.classList.contains('is-active');
        if (layer) layer.classList.toggle('is-visible', visible);
        term.classList.toggle('is-active', visible);
        term.setAttribute('aria-pressed', visible ? 'true' : 'false');
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
