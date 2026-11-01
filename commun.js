// Commun à toutes les pages : lien vers la boutique Vinted (si réglé dans reglages.js).
(function () {
  // Le site refuse de s'afficher caché dans la page d'un autre site
  if (window.top !== window.self) {
    try { window.top.location.href = window.location.href; } catch (e) { document.documentElement.hidden = true; }
  }
  var R = window.REGLAGES || {};
  var b = document.querySelector("[data-boutique]");
  if (b && R.boutique_vinted) {
    b.href = R.boutique_vinted;
    b.hidden = false;
  }
})();
