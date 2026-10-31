// La scène de l'accueil : la fleur au centre, les bonnets flottent autour.
// Attraper un bonnet et le poser sur la fleur ouvre sa page.
// Lâché ailleurs, il reste en l'air, flotte, et on peut le reprendre.
(function () {
  var scene = document.querySelector("[data-scene]");
  if (!scene) return;
  var R = window.REGLAGES || {};
  var enVente = (window.BONNETS || []).filter(function (b) { return !b.vendu; });
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");

  var RATIO_FLEUR = 316 / 368;
  var RATIO_BONNET = 1257 / 1767;
  var POINTE_X = 0.58, POINTE_Y = 0.3; // où arrive le bas du bonnet, enfoncé sur les pétales du haut
  var largeur = 0, hauteur = 0, base = 0, bw = 0, bh = 0;

  var fleur = { el: document.createElement("img") };
  fleur.el.className = "fleur";
  fleur.el.src = "fleur-1.svg";
  fleur.el.alt = "";
  scene.appendChild(fleur.el);

  var items = enVente.map(function (b, i) {
    var a = document.createElement("a");
    a.className = "s-bonnet";
    a.href = b.page;
    a.draggable = false;
    a.setAttribute("aria-label", b.nom + ", " + (b.prix || R.prix) + ". Ouvrir la page du bonnet");
    a.style.setProperty("--retard", (i * -0.9) + "s");
    var img = document.createElement("img");
    img.src = b.photo;
    img.alt = "";
    img.draggable = false;
    img.width = 1767;
    img.height = 1257;
    a.appendChild(img);
    scene.appendChild(a);
    var it = { el: a, x: 0, y: 0, rot: 0, s: 1, vx: 0, vy: 0, vr: 0, dy: 0, etat: "repos", maison: { x: 0, y: 0 } };
    brancher(it);
    return it;
  });

  function poser(it) {
    it.el.style.transform = "translate3d(" + it.x.toFixed(1) + "px," + (it.y + it.dy).toFixed(1) + "px,0) rotate(" + it.rot.toFixed(2) + "deg) scale(" + it.s.toFixed(3) + ")";
  }

  // ---- Mise en place : la fleur au centre, les bonnets en cercles autour
  function mesurer() {
    var etroit = scene.clientWidth < 640;
    // La scène tient dans l'écran, pour voir la fleur en entier sans descendre.
    // Calculée une fois par largeur : sur téléphone la barre d'adresse change la hauteur en défilant.
    if (scene.clientWidth !== largeur) {
      var haut = scene.getBoundingClientRect().top + window.pageYOffset;
      base = Math.max(300, Math.min(etroit ? 400 : 500, window.innerHeight - haut - 12));
    }
    largeur = scene.clientWidth;
    var fw = Math.min(largeur * (etroit ? 0.4 : 0.2), base * 0.6 / RATIO_FLEUR);
    bw = Math.max(46, fw * 0.62); // à la largeur des deux pétales du haut, et assez grand pour le doigt
    bh = bw * RATIO_BONNET;
    fleur.w = fw;
    fleur.h = fw * RATIO_FLEUR;

    // Un cercle de bonnets, puis un autre plus grand s'il n'y a plus de place
    var rx = Math.min(largeur / 2 - bw * 0.6, Math.max(fw * 0.5 + bw * 0.7, largeur * 0.3));
    var ry = base / 2 - bh * 0.7;
    var cercles = [], reste = items.length, n = 0;
    while (reste > 0) {
      var a = Math.min(largeur / 2 - bw * 0.6, rx + n * bw * 0.4), b = ry + n * bh * 1.7;
      var tour = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      var place = Math.max(1, Math.floor(tour / (bw * 1.35)));
      var ici = Math.min(place, reste);
      cercles.push({ a: a, b: b, n: ici });
      reste -= ici; n++;
    }
    hauteur = n > 1 ? Math.max(base, 2 * cercles[n - 1].b + bh * 1.4) : base;
    scene.style.height = hauteur + "px";

    fleur.x = (largeur - fw) / 2;
    fleur.y = (hauteur - fleur.h) / 2 + (items.length ? 0 : hauteur * 0.1);
    fleur.el.style.width = fleur.w + "px";
    fleur.el.style.height = fleur.h + "px";
    fleur.el.style.left = fleur.x + "px";
    fleur.el.style.top = fleur.y + "px";

    var k = 0;
    cercles.forEach(function (c) {
      for (var i = 0; i < c.n; i++, k++) {
        var it = items[k], angle = Math.PI * (1.1 + (2 * i) / c.n);
        it.maison.x = largeur / 2 + Math.cos(angle) * c.a - bw / 2;
        it.maison.y = hauteur / 2 + Math.sin(angle) * c.b - bh / 2;
        it.el.style.width = bw + "px";
        it.el.style.height = bh + "px";
        if (it.etat === "repos") { it.x = it.maison.x; it.y = it.maison.y; it.rot = 0; }
        if (it.etat === "flotte") { garder(it); }
        poser(it);
      }
    });
  }

  function garder(it) {
    it.x = Math.max(0, Math.min(largeur - bw, it.x));
    it.y = Math.max(0, Math.min(hauteur - bh, it.y));
  }

  function surFleur(it) {
    var cx = it.x + bw / 2, cy = it.y + bh / 2, m = fleur.w * 0.1;
    return cx > fleur.x - m && cx < fleur.x + fleur.w + m && cy > fleur.y - fleur.h * 0.2 && cy < fleur.y + fleur.h * 0.85;
  }

  function viser(oui) { fleur.el.classList.toggle("visee", oui); }

  // ---- Boucle d'animation commune (prise, glisse, pose), interruptible
  var dernier = 0, boucle = false;
  function lancer() {
    if (boucle) return;
    boucle = true; dernier = performance.now();
    requestAnimationFrame(pas);
  }
  function pas(t) {
    var dt = Math.min(0.032, (t - dernier) / 1000); dernier = t;
    var actif = false;
    items.forEach(function (it) {
      if (it.etat === "prise") { actif = true; tenir(it, dt); }
      else if (it.etat === "glisse") { actif = true; glisser(it, dt); }
      else if (it.etat === "pose") { actif = true; ressort(it, dt); }
      else return;
      poser(it);
    });
    if (actif) requestAnimationFrame(pas); else boucle = false;
  }

  function tenir(it, dt) {
    // Le bonnet penche dans le sens du mouvement, avec un peu d'inertie
    var cible = Math.max(-16, Math.min(16, it.vx * 0.012));
    it.rot += (cible - it.rot) * Math.min(1, dt * 12);
    it.vx *= Math.pow(0.0005, dt);
    it.s += (1.06 - it.s) * Math.min(1, dt * 18);
  }

  function glisser(it, dt) {
    // Lâché, il continue un peu sur son élan puis reste en l'air
    var frein = Math.pow(0.02, dt);
    it.vx *= frein; it.vy *= frein;
    it.x += it.vx * dt; it.y += it.vy * dt;
    if (it.x < 0 || it.x > largeur - bw) it.vx = -it.vx * 0.4;
    if (it.y < 0 || it.y > hauteur - bh) it.vy = -it.vy * 0.4;
    garder(it);
    it.rot += (it.finRot - it.rot) * Math.min(1, dt * 7);
    it.s += (1 - it.s) * Math.min(1, dt * 12);
    if (Math.abs(it.vx) + Math.abs(it.vy) < 12 && Math.abs(it.rot - it.finRot) < 0.4) {
      it.etat = "flotte";
      it.el.classList.remove("en-vol");
    }
  }

  function ressort(it, dt) {
    var c = it.cible, K = 190, D = 17;
    it.vx += ((c.x - it.x) * K - it.vx * D) * dt;
    it.vy += ((c.y - it.y) * K - it.vy * D) * dt;
    it.vr += ((c.rot - it.rot) * K - it.vr * D) * dt;
    it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
    it.s += (1 - it.s) * Math.min(1, dt * 16);
    // La fleur se tasse sous le bonnet, et le bonnet suit le mouvement de la fleur
    var u = Math.max(0, Math.min(1, (performance.now() - it.debut - 130) / 520));
    var sy = 1 - 0.09 * Math.sin(u * Math.PI * 2) * (1 - u);
    var sx = 1 + (1 - sy) * 0.6;
    fleur.el.style.transform = "scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
    it.dy = (fleur.y + fleur.h - (c.y + bh)) * (1 - sy);
  }

  // ---- Fin du geste
  function deposer(it) {
    it.etat = "pose";
    it.el.classList.add("posee");
    viser(false);
    it.cible = { x: fleur.x + fleur.w * POINTE_X - bw / 2, y: fleur.y + fleur.h * POINTE_Y - bh, rot: -3 };
    var ouvrir = function () { window.location.href = it.el.href; };
    if (reduit.matches) {
      it.x = it.cible.x; it.y = it.cible.y; it.rot = it.cible.rot; it.s = 1;
      it.etat = "posee"; poser(it);
      setTimeout(ouvrir, 700);
      return;
    }
    it.debut = performance.now();
    fleur.el.classList.add("porte");
    it.vx *= 0.2; it.vy = 0; it.vr = 0;
    lancer();
    setTimeout(ouvrir, 1050);
  }

  function lacher(it) {
    viser(false);
    garder(it);
    it.etat = "glisse";
    it.finRot = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 4);
    if (reduit.matches) {
      it.rot = it.finRot; it.s = 1; it.vx = 0; it.vy = 0;
      it.etat = "flotte"; poser(it);
      return;
    }
    it.el.classList.add("en-vol");
    it.vx = Math.max(-500, Math.min(500, it.vx));
    it.vy = Math.max(-500, Math.min(500, it.vy));
    lancer();
  }

  // ---- Pointer Events (souris, doigt, stylet)
  function brancher(it) {
    var a = it.el, id = null, dx = 0, dy = 0, px = 0, py = 0, pt = 0;

    a.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || it.etat === "pose" || it.etat === "posee" || id !== null) return;
      e.preventDefault();
      id = e.pointerId;
      a.setPointerCapture(id);
      var c = scene.getBoundingClientRect();
      dx = e.clientX - c.left - it.x;
      dy = e.clientY - c.top - it.y;
      px = e.clientX; py = e.clientY; pt = e.timeStamp;
      it.etat = "prise"; it.vx = 0; it.vy = 0;
      a.classList.add("prise");
      a.classList.remove("en-vol");
      lancer();
    });

    a.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      var c = scene.getBoundingClientRect();
      it.x = Math.max(-bw * 0.25, Math.min(largeur - bw * 0.75, e.clientX - c.left - dx));
      it.y = Math.max(-bh * 0.5, Math.min(hauteur - bh * 0.5, e.clientY - c.top - dy));
      var ecoule = Math.max(1, e.timeStamp - pt);
      it.vx = it.vx * 0.6 + ((e.clientX - px) / ecoule * 1000) * 0.4;
      it.vy = it.vy * 0.6 + ((e.clientY - py) / ecoule * 1000) * 0.4;
      px = e.clientX; py = e.clientY; pt = e.timeStamp;
      viser(surFleur(it));
      if (reduit.matches) poser(it);
    });

    function fin(e) {
      if (e.pointerId !== id) return;
      id = null;
      a.classList.remove("prise");
      if (e.type === "pointerup" && surFleur(it)) deposer(it); else lacher(it);
    }
    a.addEventListener("pointerup", fin);
    a.addEventListener("pointercancel", fin);

    // Clavier et lecteurs d'écran : Entrée ouvre la page. Un clic de souris ou un toucher ne l'ouvre pas :
    // on accède au bonnet par le geste.
    a.addEventListener("click", function (e) { if (e.detail > 0) e.preventDefault(); });
    a.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    a.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  // Retour arrière depuis une page produit : les bonnets reprennent leur place
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    items.forEach(function (it) {
      it.etat = "repos"; it.vx = it.vy = it.vr = 0; it.s = 1; it.dy = 0;
      it.el.classList.remove("posee", "prise", "en-vol");
    });
    fleur.el.classList.remove("porte");
    fleur.el.style.transform = "";
    mesurer();
  });

  mesurer();
  var attente;
  window.addEventListener("resize", function () {
    clearTimeout(attente);
    attente = setTimeout(mesurer, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
})();
