// Commun à toutes les pages : lien vers la boutique Vinted (si réglé dans reglages.js).
(function () {
  // Le site refuse de s'afficher caché dans la page d'un autre site
  if (window.top !== window.self) {
    try { window.top.location.href = window.location.href; } catch (e) { document.documentElement.hidden = true; }
  }
  var R = window.REGLAGES || {};
  // Bonnets vendus sur Vinted depuis la dernière publication : lus dans le registre des ventes
  // (rempli par le script Gmail). Le site les affiche comme vendus sans attendre une republication.
  window.MALDA_PRET = new Promise(function (fini) {
    if (!R.supabase_url || !window.fetch || location.protocol === "file:") return fini();
    var minuteur = setTimeout(fini, 1500); // si le registre ne répond pas, la page s'affiche quand même
    fetch(R.supabase_url + "/rest/v1/bonnets_vendus?select=id_bonnet", { headers: { apikey: R.supabase_cle } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (lignes) {
        var vendus = {};
        lignes.forEach(function (l) { if (/^B\d{3}$/.test(l.id_bonnet)) vendus[l.id_bonnet] = true; });
        (window.BONNETS || []).forEach(function (b) { if (vendus[b.id]) b.vendu = true; });
        window.MALDA_VENDUS = vendus;
        document.querySelectorAll("[data-vente]").forEach(function (n) {
          if (!vendus[n.getAttribute("data-vente")]) return;
          var p = document.createElement("p");
          p.className = "bouton bouton-vendu";
          p.textContent = n.getAttribute("data-parti");
          n.replaceChildren(p);
        });
      })
      .catch(function () {})
      .then(function () { clearTimeout(minuteur); fini(); });
  });

  var b = document.querySelector("[data-boutique]");
  if (b && R.boutique_vinted) {
    b.href = R.boutique_vinted;
    b.hidden = false;
  }
})();
