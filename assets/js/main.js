/* =================================================================
   RioRio — comportamento da página (progressive enhancement)
   Sem dependências. Tudo é opcional: sem JS, a página funciona.
   Módulos:
     1. Ano do rodapé
     2. Header sólido ao rolar
     3. Menu mobile acessível
     4. Reveal on scroll (IntersectionObserver)
     5. Parallax do hero (só ponteiro fino, sem reduced-motion)
     6. Progresso da linha do tempo
     7. aria-current na navegação (scroll spy)
     8. Lightbox do acervo (foco, Esc, prev/próximo, scroll lock)
     9. Formulário de contato -> WhatsApp
   ================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Ano ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- 2. Header sólido ao rolar ---------- */
  var header = $("[data-header]");
  if (header) {
    var onScrollHeader = function () {
      if (window.scrollY > 24) header.setAttribute("data-solid", "");
      else header.removeAttribute("data-solid");
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* ---------- 3. Menu mobile ---------- */
  var toggle = $("[data-nav-toggle]");
  var menu = $("[data-nav-menu]");
  if (toggle && menu) {
    var setNav = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      if (open) { menu.setAttribute("data-open", ""); document.body.setAttribute("data-nav-open", ""); }
      else { menu.removeAttribute("data-open"); document.body.removeAttribute("data-nav-open"); }
    };
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    // fecha ao clicar num link do menu
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    // Esc fecha
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false); toggle.focus();
      }
    });
  }

  /* ---------- 4. Reveal on scroll ---------- */
  var revealables = $$("[data-reveal], .hero, .criu-intro__art, [data-book], [data-criu]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target); // anima só uma vez
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });

    // Rede de segurança: revela o que estiver na viewport, para o conteúdo nunca
    // ficar preso invisível (deep-link para âncora, layout shift de imagens lazy, etc.).
    var revealVisible = function () {
      var vh = window.innerHeight;
      revealables.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) { el.classList.add("is-in"); io.unobserve(el); }
      });
    };
    window.addEventListener("load", function () {
      revealVisible(); setTimeout(revealVisible, 300); setTimeout(revealVisible, 1000);
    });
    window.addEventListener("hashchange", function () { setTimeout(revealVisible, 80); });
    window.addEventListener("scroll", revealVisible, { passive: true });
  } else {
    // sem IO ou reduced-motion: mostra tudo
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 5. Parallax do hero (leve, só ponteiro fino) ---------- */
  var finePointer = window.matchMedia("(pointer:fine)").matches;
  var hero = $(".hero");
  var book = $("[data-book]");
  var criu = $(".criu--hero");
  if (hero && book && finePointer && !reduceMotion) {
    var raf = null, tx = 0, ty = 0;
    var applyParallax = function () {
      raf = null;
      book.style.setProperty("transform", "translate(" + (tx * 10) + "px," + (ty * 8) + "px)");
      if (criu) criu.style.setProperty("transform", "translate(" + (tx * -16) + "px," + (ty * -10) + "px)");
    };
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5);
      ty = ((e.clientY - r.top) / r.height - 0.5);
      if (!raf) raf = requestAnimationFrame(applyParallax);
    });
    hero.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(applyParallax); });
  }

  /* ---------- 6. Progresso da linha do tempo ---------- */
  var tl = $("[data-timeline]");
  var progress = $("[data-tl-progress]");
  if (tl && progress && !reduceMotion) {
    var updateTl = function () {
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = r.height + vh * 0.5;
      var seen = Math.min(Math.max(vh * 0.55 - r.top, 0), total);
      progress.style.height = (seen / total * 100) + "%";
    };
    updateTl();
    window.addEventListener("scroll", updateTl, { passive: true });
    window.addEventListener("resize", updateTl);
  } else if (progress) {
    progress.style.height = "100%";
  }

  /* ---------- 7. Scroll spy (aria-current) ---------- */
  var navLinks = $$('.nav__menu a[href^="#"]');
  var sections = navLinks
    .map(function (a) { var id = a.getAttribute("href").slice(1); return document.getElementById(id); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            var match = a.getAttribute("href") === "#" + entry.target.id;
            if (match) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 8. Lightbox (acervo + imagens antigas) ---------- */
  var galleries = $$("[data-gallery]");
  var lb = $("[data-lightbox]");
  if (galleries.length && lb) {
    var lbImg = $("[data-lightbox-img]", lb);
    var lbCap = $("[data-lightbox-cap]", lb);
    var dialog = $("[data-lightbox-dialog]", lb);
    var current = 0;
    var links = [];          // conjunto ativo (da galeria clicada)
    var lastFocused = null;

    /* zoom dentro da foto (pinça / toque duplo / arrastar), sempre a partir do centro */
    var zoom = { s: 1, x: 0, y: 0 };
    var pointers = {};
    var pinchStart = 0, pinchScale = 1;
    var applyZoom = function () {
      var maxX = (lbImg.clientWidth * (zoom.s - 1)) / 2, maxY = (lbImg.clientHeight * (zoom.s - 1)) / 2;
      zoom.x = Math.max(-maxX, Math.min(maxX, zoom.x));
      zoom.y = Math.max(-maxY, Math.min(maxY, zoom.y));
      lbImg.style.transform = zoom.s === 1 ? "" : "translate(" + zoom.x + "px," + zoom.y + "px) scale(" + zoom.s + ")";
      lbImg.classList.toggle("is-zoomed", zoom.s > 1);
    };
    var resetZoom = function () { zoom.s = 1; zoom.x = 0; zoom.y = 0; pointers = {}; applyZoom(); };
    var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    lbImg.addEventListener("pointerdown", function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2) { pinchStart = dist(pointers[ids[0]], pointers[ids[1]]); pinchScale = zoom.s; }
    });
    lbImg.addEventListener("pointermove", function (e) {
      var p = pointers[e.pointerId];
      if (!p) return;
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinchStart) {
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        zoom.s = Math.max(1, Math.min(4, pinchScale * dist(pointers[ids[0]], pointers[ids[1]]) / pinchStart));
        if (zoom.s === 1) { zoom.x = 0; zoom.y = 0; }
        applyZoom();
      } else if (ids.length === 1 && zoom.s > 1) {
        zoom.x += e.clientX - p.x; zoom.y += e.clientY - p.y;
        pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        applyZoom();
      }
    });
    var endPointer = function (e) { delete pointers[e.pointerId]; pinchStart = 0; };
    lbImg.addEventListener("pointerup", endPointer);
    lbImg.addEventListener("pointercancel", endPointer);
    lbImg.addEventListener("dblclick", function () {
      if (zoom.s > 1) resetZoom(); else { zoom.s = 2.5; applyZoom(); }
    });

    var show = function (i) {
      resetZoom();
      current = (i + links.length) % links.length;
      var link = links[current];
      var img = $("img", link);
      lbImg.setAttribute("src", link.getAttribute("href"));
      lbImg.setAttribute("alt", img ? img.getAttribute("alt") : "");
      lbCap.textContent = link.getAttribute("data-caption") || "";
    };
    var onKey = function (e) {
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowRight") { show(current + 1); }
      else if (e.key === "ArrowLeft") { show(current - 1); }
      else if (e.key === "Tab") {
        // trava o foco dentro do modal
        var f = $$("button, [href], [tabindex]:not([tabindex='-1'])", lb)
          .filter(function (el) { return el.offsetParent !== null || el === dialog; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    var open = function (i) {
      lastFocused = document.activeElement;
      show(i);
      lb.hidden = false;
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      dialog.focus();
      document.addEventListener("keydown", onKey);
    };
    var close = function () {
      lb.hidden = true;
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      if (lastFocused) lastFocused.focus();
    };

    galleries.forEach(function (gallery) {
      var gLinks = $$(".gallery__link", gallery);
      gLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          // ativa só as imagens visíveis desta galeria (respeita o filtro)
          links = gLinks.filter(function (l) { return !l.parentNode.hidden; });
          open(links.indexOf(link));
        });
      });
    });
    $$("[data-lightbox-close]", lb).forEach(function (el) { el.addEventListener("click", close); });
    var prevBtn = $("[data-lightbox-prev]", lb);
    var nextBtn = $("[data-lightbox-next]", lb);
    if (prevBtn) prevBtn.addEventListener("click", function () { show(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(current + 1); });
  }

  /* ---------- 8b. Filtros do acervo ---------- */
  $$("[data-filter-group]").forEach(function (group) {
    var grid = document.getElementById(group.getAttribute("data-filter-group"));
    if (!grid) return;
    var chips = $$("[data-filter]", group);
    var items = $$("[data-cat]", grid);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        items.forEach(function (li) { li.hidden = f !== "all" && li.getAttribute("data-cat") !== f; });
      });
    });
  });

  /* ---------- 8c. Lupa nos quadrinhos da linha do tempo (mouse) ---------- */
  if (window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var ZOOM = 3, LENS = 170;
    $$(".tl__zoom").forEach(function (a) {
      var img = $("img", a), lens = null, preloaded = false;
      var ensure = function () {
        if (lens) return;
        lens = document.createElement("span");
        lens.className = "tl__lens";
        lens.setAttribute("aria-hidden", "true");
        lens.style.backgroundImage = "url('" + a.getAttribute("href") + "')";
        a.appendChild(lens);
      };
      a.addEventListener("mouseenter", function () {
        if (!preloaded) { preloaded = true; var pre = new Image(); pre.src = a.getAttribute("href"); }
        ensure();
      });
      a.addEventListener("mousemove", function (e) {
        ensure();
        var r = img.getBoundingClientRect();
        var x = Math.max(0, Math.min(r.width, e.clientX - r.left));
        var y = Math.max(0, Math.min(r.height, e.clientY - r.top));
        lens.style.width = lens.style.height = LENS + "px";
        lens.style.left = (img.offsetLeft + x - LENS / 2) + "px";
        lens.style.top = (img.offsetTop + y - LENS / 2) + "px";
        lens.style.backgroundSize = (r.width * ZOOM) + "px " + (r.height * ZOOM) + "px";
        lens.style.backgroundPosition = (LENS / 2 - x * ZOOM) + "px " + (LENS / 2 - y * ZOOM) + "px";
        lens.classList.add("is-on");
      });
      a.addEventListener("mouseleave", function () { if (lens) lens.classList.remove("is-on"); });
    });
  }

  /* ---------- 9. Formulário -> WhatsApp ---------- */
  var form = $("[data-contact-form]");
  if (form) {
    var statusEl = $("[data-form-status]", form);
    var validateField = function (input) {
      var field = input.closest(".field");
      var err = $(".field__error", field);
      var invalid = input.hasAttribute("required") && !input.value.trim();
      if (field) field.toggleAttribute("data-invalid", invalid);
      if (err) err.hidden = !invalid;
      return !invalid;
    };
    $$("input[required], textarea[required]", form).forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").hasAttribute("data-invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("input[required], textarea[required]", form).forEach(function (input) {
        if (!validateField(input)) ok = false;
      });
      if (!ok) {
        if (statusEl) { statusEl.style.color = "var(--rosa)"; statusEl.textContent = "Confira os campos destacados."; }
        var firstInvalid = $(".field[data-invalid] input, .field[data-invalid] textarea", form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var nome = $("#f-nome").value.trim();
      var escola = $("#f-escola").value.trim();
      var assunto = $("#f-assunto").value;
      var msg = $("#f-msg").value.trim();
      var texto = "Olá! Sou " + nome
        + (escola ? " (" + escola + ")" : "")
        + ".\nAssunto: " + assunto
        + "\n\n" + msg;
      var url = "https://wa.me/5521993195634?text=" + encodeURIComponent(texto);
      if (statusEl) { statusEl.style.color = "var(--verde)"; statusEl.textContent = "Abrindo o WhatsApp…"; }
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- 10. Atividade interativa: associar morros ---------- */
  var quiz = $("[data-quiz]");
  if (quiz) {
    var selects = $$("select[data-answer]", quiz);
    var quizStatus = $("[data-quiz-status]", quiz);
    var checkBtn = $("[data-quiz-check]", quiz);
    var resetBtn = $("[data-quiz-reset]", quiz);

    var setRowState = function (row, state) {
      row.setAttribute("data-state", state); // "ok" | "no" | ""
      var fb = $(".quiz__feedback", row);
      if (fb) fb.textContent = state === "ok" ? "✓ certo" : state === "no" ? "✗ tente de novo" : "";
    };
    if (checkBtn) checkBtn.addEventListener("click", function () {
      var right = 0, answered = 0;
      selects.forEach(function (sel) {
        var row = sel.closest("[data-quiz-row]");
        if (!sel.value) { setRowState(row, ""); return; }
        answered++;
        var ok = sel.value === sel.getAttribute("data-answer");
        if (ok) right++;
        setRowState(row, ok ? "ok" : "no");
      });
      if (quizStatus) {
        if (answered < selects.length) {
          quizStatus.style.color = "var(--tinta-70)";
          quizStatus.textContent = "Escolha um número para cada morro.";
        } else if (right === selects.length) {
          quizStatus.style.color = "var(--verde)";
          quizStatus.textContent = "Muito bem! Você identificou os três morros. 🎉";
        } else {
          quizStatus.style.color = "var(--rosa)";
          quizStatus.textContent = "Você acertou " + right + " de " + selects.length + ". Observe a imagem e tente de novo.";
        }
      }
    });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      selects.forEach(function (sel) {
        sel.value = "";
        setRowState(sel.closest("[data-quiz-row]"), "");
      });
      if (quizStatus) quizStatus.textContent = "";
      selects[0] && selects[0].focus();
    });
  }
})();
