// Accueil : compteur, message « plus de bonnets » et galerie des bonnets déjà partis.
// Les bonnets en vente sont dans la scène (scene.js).
(function () {
  var R = window.REGLAGES || {};
  // Espace insécable avant € pour que le prix ne se coupe jamais en deux lignes
  R.prix = (R.prix || "19,90 €").replace(/\s+€/, " €");
  var bonnets = window.BONNETS || [];
  var T = window.T;
  // Dans site/en/, de/ et es/, les photos sont un dossier plus haut ; le format du prix dépend de la langue
  R.prix = T.prix(R.prix);
  bonnets.forEach(function (b) {
    b.photo = window.RACINE + b.photo;
    b.prix = T.prix(b.prix);
  });
  document.documentElement.classList.add("js");

  // Fond neutre derrière chaque photo : la couleur vient uniquement des bonnets
  function fond() { return "#f3f3f3"; }
  window.MALDA_FOND = fond; // aussi utilisé par sondage.js

  function el(tag, cls, texte) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte) e.textContent = texte;
    return e;
  }

  document.querySelectorAll("[data-prix]").forEach(function (n) { n.textContent = R.prix; });

  (window.MALDA_PRET || Promise.resolve()).then(function () {
  var enVente = bonnets.filter(function (b) { return !b.vendu; }).length;
  var compte = document.querySelector("[data-compte]");
  compte.textContent = enVente === 0 ? "" :
    enVente === 1 ? T.un_dispo :
    T.n_dispo.replace("{n}", enVente);
  if (enVente === 0) document.querySelector("[data-vide]").hidden = false;

  var partis = bonnets.filter(function (b) { return b.vendu; });
  if (partis.length === 0) return;

  quiz(partis);
  var grille = document.querySelector("[data-grille]");
  document.querySelector("[data-partis]").hidden = false;
  partis.forEach(function (b) {
    var li = el("li", "bonnet vendu visible");
    var photo = el("a", "bonnet-photo");
    photo.href = b.page;
    photo.style.setProperty("--fond", fond());
    photo.setAttribute("aria-label", T.vendu_aria.replace("{nom}", b.nom));
    // Une photo portée de la fiche plutôt que le bonnet détouré, en couleurs
    var portee = (window.PORTEES || {})[b.id];
    var img = el("img", portee ? "charge portee" : "charge");
    img.src = portee ? window.RACINE + portee : b.photo;
    img.alt = "";
    img.width = portee ? 800 : 750;
    img.height = portee ? 1200 : 1000;
    img.loading = "lazy";
    photo.appendChild(img);
    photo.appendChild(el("span", "pastille", T.vendu));
    var ligne = el("div", "bonnet-ligne");
    ligne.appendChild(el("h3", "bonnet-nom", b.nom));
    li.appendChild(photo);
    li.appendChild(ligne);
    grille.appendChild(li);
  });

  // Quiz « Quel bonnet parti aurais-tu été ? » : 3 questions stupides tirées au hasard
  // (20 débuts × 15 personnages = 300), avec des réponses qui n'ont rien à voir.
  function quiz(partis) {
    var zone = document.querySelector("[data-quiz]"), Q = T.quiz;
    if (!zone || !Q) return;
    function hasard(n) { return Math.floor(Math.random() * n); }
    function tirer(liste, n) { var copie = liste.slice(), sortie = []; while (sortie.length < n && copie.length) sortie.push(copie.splice(hasard(copie.length), 1)[0]); return sortie; }
    function question() {
      var g = Q.gabarits[hasard(Q.gabarits.length)].replace("{x}", Q.choses[hasard(Q.choses.length)]);
      return g.charAt(0).toUpperCase() + g.slice(1);
    }
    var etape, total;
    function demarrer() { etape = 0; total = 0; poser(); }
    function poser() {
      zone.replaceChildren();
      zone.appendChild(el("p", "quiz-titre", Q.titre));
      if (etape === 0) zone.appendChild(el("p", "quiz-aide", Q.aide));
      zone.appendChild(el("p", "quiz-etape", Q.suite.replace("{n}", etape + 1)));
      zone.appendChild(el("h3", "quiz-question", question()));
      tirer(Q.reponses, 3).forEach(function (r, k) {
        var bt = el("button", "quiz-reponse", r);
        bt.type = "button";
        bt.addEventListener("click", function () { total += k + 1 + hasard(5); etape++; etape < 3 ? poser() : resultat(); });
        zone.appendChild(bt);
      });
    }
    function resultat() {
      var b = partis[(total + hasard(partis.length)) % partis.length];
      var portee = (window.PORTEES || {})[b.id];
      zone.replaceChildren();
      zone.appendChild(el("p", "quiz-titre", Q.res));
      zone.appendChild(el("h3", "quiz-question", b.nom));
      var img = el("img", "quiz-photo");
      img.src = portee ? window.RACINE + portee : b.photo;
      img.alt = b.nom;
      zone.appendChild(img);
      zone.appendChild(el("p", "quiz-aide", Q.parti));
      var actions = el("div", "quiz-actions");
      var voir = el("a", "quiz-lien", Q.voir); voir.href = b.page;
      var encore = el("button", "bouton", Q.encore); encore.type = "button";
      encore.addEventListener("click", demarrer);
      actions.appendChild(encore); actions.appendChild(voir);
      zone.appendChild(actions);
    }
    demarrer();
  }
  });
})();
