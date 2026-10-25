(function () {
  "use strict";

  var WHATSAPP_NUMBER = "221784254438"; // Vet-Horizons

  /* ---------- Header scroll state + mobile nav ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Forms: validation + WhatsApp / mailto handoff ---------- */
  function showError(field, msg) {
    var small = field.parentElement.querySelector("small.err");
    if (small) small.textContent = msg || "";
    field.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validateForm(form) {
    var valid = true;
    form.querySelectorAll("[required]").forEach(function (field) {
      var value = (field.value || "").trim();
      if (!value) {
        showError(field, "Ce champ est requis.");
        valid = false;
        return;
      }
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showError(field, "Adresse email invalide.");
        valid = false;
        return;
      }
      if (field.type === "tel" && !/^[0-9+\s.-]{7,}$/.test(value)) {
        showError(field, "Numéro de téléphone invalide.");
        valid = false;
        return;
      }
      showError(field, "");
    });
    return valid;
  }

  document.querySelectorAll("form[data-whatsapp-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;

      var data = new FormData(form);
      var lines = ["*Nouvelle demande — Vet-Horizons*"];
      data.forEach(function (value, name) {
        if (value) lines.push(name + " : " + value);
      });
      var text = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text;

      var successBox = form.parentElement.querySelector(".form-success");
      window.open(url, "_blank", "noopener");
      if (successBox) {
        form.style.display = "none";
        successBox.classList.add("is-visible");
      }
    });

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () { showError(field, ""); });
    });
  });

  /* ---------- Chatbot ---------- */
  var chatbotRoot = document.getElementById("chatbot");
  if (chatbotRoot) {
    var cbToggle = document.getElementById("chatbot-toggle");
    var cbPanel = document.getElementById("chatbot-panel");
    var cbMessages = document.getElementById("chatbot-messages");
    var cbQuick = document.getElementById("chatbot-quick");
    var cbForm = document.getElementById("chatbot-form");
    var cbInput = document.getElementById("chatbot-text");
    var STORE_KEY = "vh_chat_history_v1";

    var QUICK_MAIN = [
      { label: "Horaires d'ouverture", key: "horaires" },
      { label: "Nos services", key: "services" },
      { label: "Adresse / Itinéraire", key: "adresse" },
      { label: "Prendre rendez-vous", key: "rdv" },
      { label: "Parler à un humain", key: "humain" }
    ];

    function normalize(str) {
      return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }

    function reply(key) {
      switch (key) {
        case "horaires":
          return { text: "Nous sommes ouverts du lundi au samedi de 08h30 à 20h30, et le dimanche de 10h à 18h. 😊" };
        case "services":
          return {
            text: "Voici nos services : Consultation, Vente de médicaments, Conseils et orientations, Médecine et chirurgie animale, Insémination artificielle, Conseil et suivi d'élevage, Échographie, Aviculture et Toilettage.",
            cta: { label: "Voir tous les services →", href: "services.html" }
          };
        case "adresse":
          return {
            text: "Nous sommes situés à Almadies 2, en face de la station Shell, Dakar.",
            cta: { label: "Voir l'itinéraire →", href: "contact.html#carte" }
          };
        case "rdv":
          return {
            text: "Avec plaisir ! Vous pouvez réserver directement en ligne, c'est rapide.",
            cta: { label: "Prendre rendez-vous →", href: "contact.html#rendez-vous" }
          };
        case "humain":
          return {
            text: "Bien sûr ! Cliquez ci-dessous pour discuter directement avec notre équipe sur WhatsApp.",
            cta: { label: "Discuter sur WhatsApp →", href: "https://wa.me/" + WHATSAPP_NUMBER, external: true }
          };
        case "tarifs":
          return {
            text: "Nos tarifs varient selon le service et l'animal concerné. Contactez-nous directement pour un devis précis.",
            cta: { label: "Discuter sur WhatsApp →", href: "https://wa.me/" + WHATSAPP_NUMBER, external: true }
          };
        default:
          return {
            text: "Je n'ai pas toutes les réponses 🙂 mais notre équipe peut vous aider directement.",
            cta: { label: "Discuter sur WhatsApp →", href: "https://wa.me/" + WHATSAPP_NUMBER, external: true }
          };
      }
    }

    function matchKey(raw) {
      var t = normalize(raw);
      if (/horaire|heure|ouvert|ferme/.test(t)) return "horaires";
      if (/service|consultation|chirurgie|insemination|echograph|avicult|toilettage|medicament|elevage/.test(t)) return "services";
      if (/adresse|localisation|itinerair|situe|ou (es|etes)|carte/.test(t)) return "adresse";
      if (/rendez.?vous|rdv|reserv/.test(t)) return "rdv";
      if (/humain|whatsapp|appel|telephone|equipe|parler/.test(t)) return "humain";
      if (/prix|tarif|cout|combien/.test(t)) return "tarifs";
      return null;
    }

    function saveHistory(history) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history)); } catch (e) {}
    }
    function loadHistory() {
      try {
        var raw = sessionStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }

    var history = loadHistory();

    function renderMessage(msg) {
      var el = document.createElement("div");
      el.className = "chat-msg " + (msg.role === "user" ? "user" : "bot");
      el.textContent = msg.text;
      if (msg.cta) {
        el.appendChild(document.createElement("br"));
        var a = document.createElement("a");
        a.className = "chat-cta";
        a.href = msg.cta.href;
        a.textContent = msg.cta.label;
        if (msg.cta.external) { a.target = "_blank"; a.rel = "noopener"; }
        el.appendChild(a);
      }
      cbMessages.appendChild(el);
      cbMessages.scrollTop = cbMessages.scrollHeight;
    }

    function pushMessage(role, text, cta) {
      var msg = { role: role, text: text, cta: cta || null };
      history.push(msg);
      saveHistory(history);
      renderMessage(msg);
    }

    function showTyping(cb) {
      var typing = document.createElement("div");
      typing.className = "chat-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      cbMessages.appendChild(typing);
      cbMessages.scrollTop = cbMessages.scrollHeight;
      setTimeout(function () {
        typing.remove();
        cb();
      }, 500 + Math.random() * 400);
    }

    function botAnswer(key) {
      showTyping(function () {
        var r = reply(key);
        pushMessage("bot", r.text, r.cta);
        renderQuickReplies();
      });
    }

    function renderQuickReplies() {
      cbQuick.innerHTML = "";
      QUICK_MAIN.forEach(function (item) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = item.label;
        btn.addEventListener("click", function () {
          pushMessage("user", item.label);
          botAnswer(item.key);
        });
        cbQuick.appendChild(btn);
      });
    }

    function initConversation() {
      if (history.length) {
        history.forEach(renderMessage);
      } else {
        pushMessage(
          "bot",
          "👋 Bonjour ! Je suis l'assistant virtuel de Vet-Horizons. Comment puis-je vous aider aujourd'hui ?"
        );
      }
      renderQuickReplies();
    }

    var initialized = false;
    function openChat() {
      chatbotRoot.classList.add("is-open");
      cbToggle.setAttribute("aria-expanded", "true");
      if (!initialized) { initConversation(); initialized = true; }
      setTimeout(function () { cbInput.focus(); }, 250);
    }
    function closeChat() {
      chatbotRoot.classList.remove("is-open");
      cbToggle.setAttribute("aria-expanded", "false");
    }

    cbToggle.addEventListener("click", function () {
      if (chatbotRoot.classList.contains("is-open")) closeChat(); else openChat();
    });

    cbForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (cbInput.value || "").trim();
      if (!val) return;
      pushMessage("user", val);
      cbInput.value = "";
      var key = matchKey(val);
      botAnswer(key);
    });
  }
})();
