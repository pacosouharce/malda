// Page du bonnet personnalisable : on attrape un tissu et on le pose sur le dessus ou la bande.
// Rien n'est envoyé : le client copie son message et nous l'écrit sur Vinted.
(function () {
  var page = document.querySelector("[data-perso]");
  if (!page) return;
  var T = window.T, R = window.REGLAGES || {}, RACINE = window.RACINE;
  var prix = T.prix((R.prix_perso || "25 €").replace(/\s+€/, " €"));

  var TISSUS = [
    ["leopard", "Léopard"], ["fuchsia", "Fuchsia"], ["turquoise", "Turquoise"], ["paquerette", "Pâquerette"],
    ["jaguar", "Jaguar"], ["caramel", "Caramel"], ["porcelaine", "Porcelaine"], ["menthe", "Menthe"],
    ["panthere", "Panthère"], ["ciel", "Ciel"], ["lagon", "Lagon"], ["lilas", "Lilas"],
    ["souris", "Souris"], ["framboise", "Framboise"], ["serpentin", "Serpentin"], ["canard", "Canard"],
    ["nocturne", "Nocturne"], ["guimauve", "Guimauve"], ["vieux-rose", "Vieux rose"], ["glacier", "Glacier"],
    ["myrtille", "Myrtille"], ["taupe", "Taupe"], ["brume", "Brume"], ["pistache", "Pistache"],
    ["banquise", "Banquise"], ["prune", "Prune"], ["sapin", "Sapin"], ["minuit", "Minuit"]
  ];
  var PRENOMS = ["Gisèle", "Roland", "Odette", "Marcel", "Huguette", "Gilbert", "Lucette", "Raymond", "Micheline", "Albert", "Simone", "Lucien"];

  var LIGNE_BANDE = 0.6; // au-dessus : le dessus du bonnet ; en dessous : la bande
  var canvas = page.querySelector("[data-bonnet]"), ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var choix = { dessus: null, bande: null }, zoneActive = "dessus", decalage = 0;
  var images = {}, boutons = [];

  function charger(nom) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { ok(null); };
      i.src = RACINE + "perso/" + nom + ".webp";
    });
  }

  var calque = document.createElement("canvas");
  calque.width = W; calque.height = H;
  var cx = calque.getContext("2d");
  function habiller(zone) {
    cx.globalCompositeOperation = "source-over";
    cx.clearRect(0, 0, W, H);
    var t = choix[zone] && images["t-" + choix[zone][0]];
    if (t) {
      // Motif à taille réaliste, répété en miroir ; le raccord tombe sur le côté du bonnet
      var tw = W * 0.74, th = tw * t.height / t.width;
      for (var ligne = 0; ligne * th < H; ligne++) {
        for (var col = 0; col * tw < W; col++) {
          cx.save();
          cx.translate(col * tw + (col % 2 ? tw : 0), ligne * th + (ligne % 2 ? th : 0));
          cx.scale(col % 2 ? -1 : 1, ligne % 2 ? -1 : 1);
          cx.drawImage(t, 0, 0, tw, th);
          cx.restore();
        }
      }
    } else {
      cx.fillStyle = "#fbfaf7";
      cx.fillRect(0, 0, W, H);
    }
    cx.globalCompositeOperation = "destination-in";
    if (images["masque-" + zone]) cx.drawImage(images["masque-" + zone], 0, 0, W, H);
    ctx.drawImage(calque, 0, 0);
  }
  function dessiner() {
    ctx.clearRect(0, 0, W, H);
    habiller("dessus");
    habiller("bande");
    if (images.ombre) ctx.drawImage(images.ombre, 0, 0, W, H);
  }

  function choisirZone(z) {
    zoneActive = z;
    page.querySelectorAll("[data-zone]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-zone") === z)); });
  }

  function nomDuBonnet() {
    var d = choix.dessus[1], b = choix.bande[1], somme = decalage;
    (d + b).split("").forEach(function (c) { somme += c.charCodeAt(0); });
    return PRENOMS[somme % PRENOMS.length] + " " + d;
  }

  var etat = page.querySelector("[data-etat]");
  function resultat() {
    var ok = choix.dessus && choix.bande;
    page.querySelector("[data-choisis]").textContent = ok ? "" : T.perso_choisis;
    page.querySelector("[data-resultat]").hidden = !ok;
    if (!ok) return;
    var nom = nomDuBonnet();
    page.querySelector("[data-nom]").textContent = nom;
    page.querySelector("[data-prix-perso]").textContent = prix;
    page.querySelector("[data-message]").value = T.perso_message.replace("{prix}", prix).replace("{nom}", nom)
      .replace("{dessus}", choix.dessus[1]).replace("{bande}", choix.bande[1]);
    etat.textContent = "";
  }

  function appliquer(tissu, zone) {
    choix[zone] = tissu;
    dessiner();
    var autre = zone === "dessus" ? "bande" : "dessus";
    choisirZone(choix[autre] ? zone : autre);
    boutons.forEach(function (b) { b.el.setAttribute("aria-pressed", String(b.t === choix.dessus || b.t === choix.bande)); });
    resultat();
  }

  function zoneSous(x, y) {
    var r = canvas.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top - 20 || y > r.bottom + 20) return null;
    return (y - r.top) / r.height < LIGNE_BANDE ? "dessus" : "bande";
  }

  function brancher(el, tissu) {
    var depart = null, bouge = false;
    el.addEventListener("pointerdown", function (e) {
      depart = { x: e.clientX, y: e.clientY };
      bouge = false;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!depart) return;
      var dx = e.clientX - depart.x, dy = e.clientY - depart.y;
      if (!bouge && Math.abs(dx) + Math.abs(dy) < 6) return;
      bouge = true;
      el.classList.remove("retour");
      el.classList.add("prise");
      el.style.transform = "translate3d(" + dx + "px," + dy + "px,0) scale(1.08)";
      canvas.classList.toggle("visee", !!zoneSous(e.clientX, e.clientY));
    });
    function finir(e) {
      if (!depart) return;
      depart = null;
      canvas.classList.remove("visee");
      el.classList.remove("prise");
      if (bouge) {
        el.classList.add("retour");
        el.style.transform = "";
        var z = e.type === "pointerup" && zoneSous(e.clientX, e.clientY);
        if (z) appliquer(tissu, z);
      }
    }
    el.addEventListener("pointerup", finir);
    el.addEventListener("pointercancel", finir);
    // Un simple appui (ou la touche Entrée) habille la partie sélectionnée
    el.addEventListener("click", function () {
      if (bouge) { bouge = false; return; }
      appliquer(tissu, zoneActive);
    });
  }

  var listes = page.querySelectorAll("[data-tissus]");
  TISSUS.forEach(function (t, i) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tissu";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", t[1]);
    b.title = t[1];
    b.style.setProperty("--retard", (i * -0.7) + "s");
    var img = document.createElement("img");
    img.src = RACINE + "perso/t-" + t[0] + ".webp";
    img.alt = "";
    img.draggable = false;
    b.appendChild(img);
    li.appendChild(b);
    listes[i % 2].appendChild(li);
    brancher(b, t);
    boutons.push({ el: b, t: t });
  });

  page.querySelectorAll("[data-zone]").forEach(function (b) {
    b.addEventListener("click", function () { choisirZone(b.getAttribute("data-zone")); });
  });
  page.querySelector("[data-autre]").addEventListener("click", function () { decalage++; resultat(); });

  var vinted = page.querySelector("[data-vinted]");
  if (R.boutique_vinted) { vinted.href = R.boutique_vinted; vinted.hidden = false; }

  var message = page.querySelector("[data-message]");
  page.querySelector("[data-copier]").addEventListener("click", function () {
    function secours() {
      message.focus();
      message.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      etat.textContent = ok ? T.perso_copie : T.perso_erreur;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message.value).then(function () { etat.textContent = T.perso_copie; }, secours);
    } else secours();
  });

  var noms = ["masque-dessus", "masque-bande", "ombre"].concat(TISSUS.map(function (t) { return "t-" + t[0]; }));
  Promise.all(noms.map(function (n) { return charger(n).then(function (i) { images[n] = i; }); })).then(dessiner);
  resultat();
})();
