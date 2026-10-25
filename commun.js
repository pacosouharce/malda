// Commun à toutes les pages : lien vers la boutique Vinted (si réglé dans reglages.js).
(function () {
  var R = window.REGLAGES || {};
  var b = document.querySelector("[data-boutique]");
  if (b && R.boutique_vinted) {
    b.href = R.boutique_vinted;
    b.hidden = false;
  }
})();
