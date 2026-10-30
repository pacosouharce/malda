// Affiche les bonnets de bonnets.js (fabriqué par preparer.py).
(function () {
  var R = window.REGLAGES || {};
  // Espace insécable avant € pour que le prix ne se coupe jamais en deux lignes
  R.prix = (R.prix || "20 €").replace(/\s+€/, "\u00a0€");
  var bonnets = window.BONNETS || [];
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

  var FLECHE = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 11 3M5 3h6v6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  function lienVinted(texte, href) {
    var a = el("a", "bouton");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = "<span></span>" + FLECHE;
    a.firstChild.textContent = texte;
    return a;
  }

  // Marque et prix
  document.querySelectorAll("[data-marque]").forEach(function (n) { n.textContent = R.marque || "MALDA"; });
  document.querySelectorAll("[data-prix]").forEach(function (n) { n.textContent = R.prix; });

  var enVente = bonnets.filter(function (b) { return !b.vendu; }).length;
  var compte = document.querySelector("[data-compte]");
  compte.textContent = enVente === 0 ? "" :
    enVente === 1 ? "1 bonnet disponible en ce moment." :
    enVente + " bonnets disponibles en ce moment.";

  var grille = document.querySelector("[data-grille]");
  if (enVente === 0) {
    var vide = document.querySelector("[data-vide]");
    vide.hidden = false;
    if (R.boutique_vinted) vide.appendChild(lienVinted("Voir ma boutique Vinted", R.boutique_vinted));
    if (bonnets.length === 0) return;
  }

  bonnets.forEach(function (b, i) {
    var nom = "bonnet " + (b.couleur || "");
    var li = el("li", b.vendu ? "bonnet vendu" : "bonnet");

    var photo = el(b.vendu ? "div" : "a", "bonnet-photo");
    if (!b.vendu) {
      photo.href = b.lien;
      photo.target = "_blank";
      photo.rel = "noopener";
      photo.tabIndex = -1;
      photo.setAttribute("aria-hidden", "true");
    }
    photo.style.setProperty("--fond", fond(b.couleur, i));
    var img = el("img");
    img.src = b.photo;
    img.alt = "";
    img.width = 750;
    img.height = 1000;
    if (i > 3) img.loading = "lazy";
    img.decoding = "async";
    // Fondu à l'arrivée de la photo (immédiat si elle est déjà en cache)
    var montrer = function () { img.classList.add("charge"); };
    img.addEventListener("load", montrer);
    img.addEventListener("error", montrer);
    if (img.complete) montrer();
    photo.appendChild(img);
    if (b.vendu) photo.appendChild(el("span", "pastille", "Vendu"));

    var ligne = el("div", "bonnet-ligne");
    ligne.appendChild(el("h3", "bonnet-nom", nom.trim()));
    if (!b.vendu) ligne.appendChild(el("span", "bonnet-prix", R.prix));

    var infos = [b.matiere, b.taille].filter(Boolean).join(" · ");
    var bouton;
    if (b.vendu) {
      bouton = el("p", "bouton bouton-vendu", "Déjà parti");
    } else {
      bouton = lienVinted("Voir sur Vinted", b.lien);
      bouton.setAttribute("aria-label", "Voir le " + nom.trim() + " sur Vinted");
    }

    li.appendChild(photo);
    li.appendChild(ligne);
    if (infos) li.appendChild(el("p", "bonnet-infos", infos));
    li.appendChild(bouton);
    grille.appendChild(li);
  });

  // Entrée en douceur quand un bonnet arrive à l'écran
  var cartes = grille.querySelectorAll(".bonnet");
  if (!("IntersectionObserver" in window)) {
    cartes.forEach(function (c) { c.classList.add("visible"); });
    return;
  }
  var vus = new IntersectionObserver(function (entrees) {
    var n = 0;
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.setProperty("--retard", (n++ * 70) + "ms");
      e.target.classList.add("visible");
      vus.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  cartes.forEach(function (c) { vus.observe(c); });
})();
