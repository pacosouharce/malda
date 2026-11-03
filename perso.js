// Page du bonnet personnalisable : on attrape un tissu et on le pose sur le dessus ou la bande.
// Le bonnet est un dessin au trait noir, comme la fleur ; les tissus remplissent le dessin.
// La demande (tissus, tour de tête, e-mail, image du bonnet) part par e-mail à MALDA via Supabase.
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

  var LIGNE_BANDE = 0.62; // au-dessus : le dessus du bonnet ; en dessous : la bande
  var canvas = page.querySelector("[data-bonnet]"), ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var choix = { dessus: null, bande: null }, zoneActive = "dessus", decalage = 0;
  var images = {}, boutons = [];

  function charger(nom) {
    return new Promise(function (ok) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { ok(null); };
      i.src = RACINE + "perso/" + nom + (nom === "bonnet-trait" ? ".svg" : ".webp");
    });
  }

  // Formes à remplir (mêmes repères que perso/bonnet-trait.svg, 900 × 593)
  var FORMES = {
    dessus: new Path2D("M100 384 C92 150 222 42 452 40 C686 38 812 160 804 384 Z"),
    bande: new Path2D("M40 380 Q300 352 620 354 L866 382 Q890 450 880 510 Q872 552 852 556 Q600 590 330 588 L52 556 Q20 520 22 450 Z")
  };
  function habiller(zone) {
    ctx.save();
    ctx.clip(FORMES[zone]);
    var t = choix[zone] && images["t-" + choix[zone][0]];
    if (t) {
      // Motif à taille réaliste, répété en miroir ; le raccord tombe sur le côté du bonnet
      var tw = W * 0.74, th = tw * t.height / t.width;
      for (var ligne = 0; ligne * th < H; ligne++) {
        for (var col = 0; col * tw < W; col++) {
          ctx.save();
          ctx.translate(col * tw + (col % 2 ? tw : 0), ligne * th + (ligne % 2 ? th : 0));
          ctx.scale(col % 2 ? -1 : 1, ligne % 2 ? -1 : 1);
          ctx.drawImage(t, 0, 0, tw, th);
          ctx.restore();
        }
      }
    } else {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
  function dessiner() {
    ctx.clearRect(0, 0, W, H);
    habiller("dessus");
    habiller("bande");
    if (images["bonnet-trait"]) ctx.drawImage(images["bonnet-trait"], 0, 0, W, H);
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

  // ---- Envoi de la demande
  var form = page.querySelector("[data-form]"), bouton = page.querySelector("[data-envoyer]");
  var champTour = form.elements.tour, champMail = form.elements.email;
  function erreur(champ, texte) {
    champ.setAttribute("aria-invalid", texte ? "true" : "false");
    if (texte) { etat.textContent = texte; champ.focus(); }
    return !texte;
  }
  function imageDuBonnet() {
    // Le dessin sur fond blanc, en JPEG léger pour l'e-mail
    var c = document.createElement("canvas");
    c.width = 720; c.height = Math.round(720 * H / W);
    var x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!choix.dessus || !choix.bande) return;
    var tour = parseInt(champTour.value, 10);
    var mail = champMail.value.trim();
    if (!erreur(champTour, tour >= 48 && tour <= 64 ? "" : T.perso_tour_ko)) return;
    if (!erreur(champMail, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail) && mail.length <= 120 ? "" : T.perso_mail_ko)) return;
    if (location.protocol === "file:" || window.EXEMPLES) { etat.textContent = T.perso_apercu; return; }
    bouton.disabled = true;
    etat.textContent = T.perso_envoi;
    fetch(R.supabase_url + "/functions/v1/commande-perso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: page.querySelector("[data-nom]").textContent,
        dessus: choix.dessus[0], bande: choix.bande[0],
        tour: tour, email: mail, langue: document.documentElement.lang,
        site: form.elements.site.value,
        image: imageDuBonnet()
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      etat.textContent = T.perso_ok;
      form.reset();
    }).catch(function () {
      etat.textContent = T.perso_ko;
    }).then(function () { bouton.disabled = false; });
  });

  var noms = ["bonnet-trait"].concat(TISSUS.map(function (t) { return "t-" + t[0]; }));
  Promise.all(noms.map(function (n) { return charger(n).then(function (i) { images[n] = i; }); })).then(dessiner);
  resultat();
})();
