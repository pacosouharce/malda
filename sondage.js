// Questionnaire d'arrivée : « Tu préfères quel bonnet ? » parmi 4 bonnets tirés au hasard.
// À chaque nouvelle visite, on montre en priorité des bonnets pas encore proposés à ce visiteur.
// Une fois qu'il a répondu, on ne lui redemande pas avant sa prochaine visite (pas à chaque rechargement).
(function () {
  var R = window.REGLAGES || {};
  var tous = window.BONNETS || [];
  var fond = window.MALDA_FOND || function () { return "#f1eee8"; };
  var NB = 4;
  if (tous.length < 2) return; // pas de vrai choix possible

  function lire(stockage, cle) {
    try { return window[stockage].getItem(cle); } catch (e) { return null; }
  }
  function ecrire(stockage, cle, valeur) {
    try { window[stockage].setItem(cle, valeur); } catch (e) {}
  }
  if (lire("sessionStorage", "malda-avis") === "fait") return;

  // Tirage : d'abord les bonnets jamais proposés, puis on complète avec les autres
  var dejaVus = [];
  try { dejaVus = JSON.parse(lire("localStorage", "malda-avis-vus") || "[]"); } catch (e) {}
  function melanger(liste) {
    var l = liste.slice();
    for (var i = l.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = l[i]; l[i] = l[j]; l[j] = t;
    }
    return l;
  }
  var nouveaux = melanger(tous.filter(function (b) { return dejaVus.indexOf(b.id) < 0; }));
  var anciens = melanger(tous.filter(function (b) { return dejaVus.indexOf(b.id) >= 0; }));
  var tirage = nouveaux.concat(anciens).slice(0, NB);
  // Quand tout a été proposé, on recommence un tour
  var vus = nouveaux.length <= NB ? [] : dejaVus;
  tirage.forEach(function (b) { if (vus.indexOf(b.id) < 0) vus.push(b.id); });
  ecrire("localStorage", "malda-avis-vus", JSON.stringify(vus));

  // Fenêtre
  function el(tag, cls, texte) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte) e.textContent = texte;
    return e;
  }
  var vote = false;
  var dialog = el("dialog", "avis");
  dialog.setAttribute("aria-labelledby", "avis-titre");
  var titre = el("h2", "avis-titre", "Petite enquête");
  titre.id = "avis-titre";
  titre.tabIndex = -1;
  titre.setAttribute("autofocus", ""); // le focus va sur le titre, pas sur le premier bonnet
  var question = el("p", "avis-question", "On a besoin de ton avis : tu préfères quel bonnet ?");
  var choix = el("div", "avis-choix");
  choix.setAttribute("role", "group");
  choix.setAttribute("aria-label", "Choisis ton bonnet préféré");

  tirage.forEach(function (b, i) {
    var nom = b.nom || ("bonnet " + (b.couleur || "")).trim();
    var bouton = el("button", "avis-option");
    bouton.type = "button";
    var photo = el("span", "avis-photo");
    photo.style.setProperty("--fond", fond(b.couleur, i));
    var img = el("img");
    img.src = b.photo;
    img.alt = "";
    img.width = 750;
    img.height = 1000;
    photo.appendChild(img);
    bouton.appendChild(photo);
    bouton.appendChild(el("span", "avis-nom", nom));
    bouton.addEventListener("click", function () { voter(b, bouton); });
    choix.appendChild(bouton);
  });

  var merci = el("p", "avis-merci", "Merci ! Bonne visite.");
  merci.setAttribute("role", "status");

  dialog.appendChild(titre);
  dialog.appendChild(question);
  dialog.appendChild(choix);
  dialog.appendChild(merci);
  document.body.appendChild(dialog);

  // Obligatoire : Échap ne ferme pas la fenêtre (et si le navigateur la ferme quand même, on la rouvre)
  dialog.addEventListener("cancel", function (e) { e.preventDefault(); });
  dialog.addEventListener("keydown", function (e) { if (e.key === "Escape") e.preventDefault(); });
  dialog.addEventListener("close", function () {
    if (!vote && dialog.isConnected && dialog.showModal) dialog.showModal();
  });

  document.documentElement.classList.add("avis-ouvert");
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");

  function voter(b, bouton) {
    if (vote) return;
    vote = true;
    envoyer(b);
    ecrire("sessionStorage", "malda-avis", "fait");
    dialog.classList.add("repondu");
    bouton.classList.add("choisi");
    choix.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
    setTimeout(fermer, 1100);
  }

  function fermer() {
    dialog.classList.add("sortie");
    setTimeout(function () {
      if (dialog.close) dialog.close(); else dialog.removeAttribute("open");
      dialog.remove();
      document.documentElement.classList.remove("avis-ouvert");
    }, 220);
  }

  // Envoi de la réponse à la base Supabase : les bonnets proposés et celui choisi.
  // Aucune donnée personnelle n'est envoyée.
  function envoyer(b) {
    if (!R.supabase_url || !R.supabase_cle || !window.fetch) return;
    // Pas d'envoi pour les exemples ni quand le site est ouvert depuis l'ordinateur (aperçu)
    if (window.EXEMPLES || location.protocol === "file:") return;
    try {
      fetch(R.supabase_url + "/rest/v1/enquete_reponses", {
        method: "POST",
        keepalive: true,
        headers: {
          "apikey": R.supabase_cle,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          choisi: b.id,
          choisi_nom: nomDe(b),
          proposes: tirage.map(function (x) { return x.id; }),
          proposes_noms: tirage.map(nomDe)
        })
      }).catch(function () {});
    } catch (e) {}
  }
  function nomDe(b) { return b.nom || ("bonnet " + (b.couleur || "")).trim(); }
})();
