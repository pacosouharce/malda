// Accueil : compteur, message « plus de bonnets » et galerie des bonnets déjà partis.
// Les bonnets en vente sont dans la scène (scene.js).
(function () {
  var R = window.REGLAGES || {};
  // Espace insécable avant € pour que le prix ne se coupe jamais en deux lignes
  R.prix = (R.prix || "20 €").replace(/\s+€/, " €");
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

  var enVente = bonnets.filter(function (b) { return !b.vendu; }).length;
  var compte = document.querySelector("[data-compte]");
  compte.textContent = enVente === 0 ? "" :
    enVente === 1 ? T.un_dispo :
    T.n_dispo.replace("{n}", enVente);
  if (enVente === 0) document.querySelector("[data-vide]").hidden = false;

  var partis = bonnets.filter(function (b) { return b.vendu; });
  if (partis.length === 0) return;

  var grille = document.querySelector("[data-grille]");
  document.querySelector("[data-partis]").hidden = false;
  partis.forEach(function (b) {
    var li = el("li", "bonnet vendu visible");
    var photo = el("a", "bonnet-photo");
    photo.href = b.page;
    photo.style.setProperty("--fond", fond());
    photo.setAttribute("aria-label", T.vendu_aria.replace("{nom}", b.nom));
    var img = el("img", "charge");
    img.src = b.photo;
    img.alt = "";
    img.width = 750;
    img.height = 1000;
    img.loading = "lazy";
    photo.appendChild(img);
    photo.appendChild(el("span", "pastille", T.vendu));
    var ligne = el("div", "bonnet-ligne");
    ligne.appendChild(el("h3", "bonnet-nom", b.nom));
    li.appendChild(photo);
    li.appendChild(ligne);
    grille.appendChild(li);
  });
})();
