// Jeu de l'accueil, dans « Déjà partis » : on lance les bonnets déjà partis sur les têtes de Joon et Paco.
// Tirer en arrière (souris ou doigt), viser, lâcher. 10 bonnets par partie.
(function () {
  window.MALDA_JEU = function (zone, partis) {
    var T = window.T, J = T && T.jeu, RACINE = window.RACINE || "";
    if (!zone || !J || !partis.length) return;

    function el(tag, cls, texte) { var e = document.createElement(tag); if (cls) e.className = cls; if (texte) e.textContent = texte; return e; }
    function charge(src) { var i = new Image(); i.src = src; return i; }
    function hasard(n) { return Math.floor(Math.random() * n); }

    var TETES = [1, 2, 3, 4].map(function (n) { return charge(RACINE + "jeu/tete-" + n + ".webp"); });
    var BONNETS = partis.map(function (b) { return charge(b.photo); });

    zone.appendChild(el("p", "jeu-titre", J.titre));
    zone.appendChild(el("p", "jeu-aide", J.aide));
    var barre = el("div", "jeu-barre"), compteCoiffes = el("span"), compteReste = el("span");
    barre.appendChild(compteCoiffes); barre.appendChild(compteReste); zone.appendChild(barre);
    var terrain = el("div", "jeu-terrain"), cv = el("canvas");
    cv.setAttribute("aria-label", J.titre);
    terrain.appendChild(cv); zone.appendChild(terrain);
    var ecran = el("div", "jeu-ecran"); terrain.appendChild(ecran);

    var x, W, H, sol, fronde, tetes, tir, vise, coiffes, reste, actif = false, ordre, temps;

    function dimension() {
      var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
      x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      sol = H - 18; fronde = { x: Math.max(60, W * 0.1), y: sol - 110 };
    }
    function maj() {
      compteCoiffes.textContent = J.coiffes.replace("{n}", coiffes);
      compteReste.textContent = J.reste.replace("{n}", reste);
    }
    function accueil(titre, texte) {
      ecran.replaceChildren();
      if (titre) ecran.appendChild(el("p", "jeu-question", titre));
      if (texte) ecran.appendChild(el("p", "jeu-aide", texte));
      var bt = el("button", "bouton", titre ? J.rejouer : J.jouer); bt.type = "button";
      bt.addEventListener("click", partie);
      ecran.appendChild(bt); ecran.hidden = false;
    }
    function partie() {
      dimension(); tetes = []; tir = null; vise = null; coiffes = 0; reste = 10; temps = 0;
      ordre = partis.map(function (b, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      actif = true; ecran.hidden = true; maj(); requestAnimationFrame(boucle);
    }
    function fin() {
      actif = false;
      var v = J.verdicts[coiffes === 0 ? 0 : coiffes < 5 ? 1 : coiffes < 9 ? 2 : 3];
      accueil(J.fin.replace("{n}", coiffes), v);
    }

    function point(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener("pointerdown", function (e) { if (!actif || tir || reste <= 0) return; vise = point(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", function (e) { if (vise) vise = point(e); });
    cv.addEventListener("pointerup", function () {
      if (!vise) return;
      var dx = fronde.x - vise.x, dy = fronde.y - vise.y, f = Math.min(1, Math.hypot(dx, dy) / 150);
      if (f > 0.08) { tir = { x: fronde.x, y: fronde.y, vx: dx * 0.15 * (0.5 + f), vy: dy * 0.15 * (0.5 + f), i: ordre[(10 - reste) % ordre.length], a: 0 }; reste--; maj(); }
      vise = null;
    });

    function dessineBonnet(i, cx, cy, l, a) {
      var im = BONNETS[i], h = l * ((im.naturalHeight / im.naturalWidth) || 0.68);
      x.save(); x.translate(cx, cy); x.rotate(a || 0); x.drawImage(im, -l / 2, -h / 2, l, h); x.restore();
    }

    function boucle() {
      if (!actif) return;
      temps++;
      x.clearRect(0, 0, W, H);
      x.fillStyle = "#000"; x.fillRect(0, sol, W, 2);

      // Les têtes traversent de droite à gauche, en sautillant
      if (tetes.length < 3 && Math.random() < 0.018) {
        var n = hasard(4), taille = 70 + Math.random() * 40;
        tetes.push({ im: TETES[n], x: W + 60, base: sol, t: taille, v: 1.1 + Math.random() * 1.6 + coiffes * 0.08, ph: Math.random() * 6, coiffe: null, cri: "", criT: 0 });
      }
      tetes = tetes.filter(function (t) {
        t.x -= t.v; t.ph += 0.15;
        var im = t.im, h = t.t * ((im.naturalHeight / im.naturalWidth) || 1.25), saut = Math.abs(Math.sin(t.ph)) * 14;
        t.haut = t.base - h - saut;
        x.drawImage(im, t.x - t.t / 2, t.haut, t.t, h);
        if (t.coiffe !== null) dessineBonnet(t.coiffe, t.x, t.haut + t.t * 0.05, t.t * 0.95, Math.sin(t.ph) * 0.08);
        if (t.criT > 0) {
          t.criT--; x.font = "13px 'Cutive Mono', monospace"; x.textAlign = "center";
          var lw = x.measureText(t.cri).width + 18;
          x.fillStyle = "#000"; x.fillRect(t.x - lw / 2, t.haut - 40, lw, 24);
          x.fillStyle = "#fff"; x.fillText(t.cri, t.x, t.haut - 23);
        }
        return t.x > -80;
      });

      // La fronde, l'élastique et la trajectoire prévue
      x.strokeStyle = "#000"; x.lineWidth = 6; x.lineCap = "round"; x.beginPath();
      x.moveTo(fronde.x, sol); x.lineTo(fronde.x, fronde.y + 34);
      x.moveTo(fronde.x - 22, fronde.y); x.lineTo(fronde.x, fronde.y + 34); x.lineTo(fronde.x + 22, fronde.y); x.stroke();
      if (vise) {
        x.lineWidth = 2; x.beginPath(); x.moveTo(fronde.x - 22, fronde.y); x.lineTo(vise.x, vise.y); x.lineTo(fronde.x + 22, fronde.y); x.stroke();
        var dx = fronde.x - vise.x, dy = fronde.y - vise.y, f = Math.min(1, Math.hypot(dx, dy) / 150), px = fronde.x, py = fronde.y, vx = dx * 0.15 * (0.5 + f), vy = dy * 0.15 * (0.5 + f);
        x.fillStyle = "#000";
        for (var k = 0; k < 22; k++) { vy += 0.35; px += vx; py += vy; if (k % 2) { x.beginPath(); x.arc(px, py, 2, 0, 6.3); x.fill(); } }
        dessineBonnet(ordre[(10 - reste) % ordre.length], vise.x, vise.y, 60, 0);
      } else if (!tir && reste > 0) {
        dessineBonnet(ordre[(10 - reste) % ordre.length], fronde.x, fronde.y, 60, 0);
      }

      // Le bonnet en vol
      if (tir) {
        tir.vy += 0.35; tir.x += tir.vx; tir.y += tir.vy; tir.a += 0.18;
        dessineBonnet(tir.i, tir.x, tir.y, 60, tir.a);
        tetes.forEach(function (t) {
          if (tir && t.coiffe === null && Math.abs(tir.x - t.x) < t.t * 0.45 && tir.y > t.haut - 25 && tir.y < t.haut + t.t * 0.5) {
            t.coiffe = tir.i; t.cri = J.cris[hasard(J.cris.length)]; t.criT = 80; coiffes++; tir = null; maj();
          }
        });
        if (tir && (tir.y > H + 40 || tir.x > W + 60 || tir.x < -60)) tir = null;
      }

      if (reste <= 0 && !tir) { setTimeout(fin, 700); actif = false; return; }
      requestAnimationFrame(boucle);
    }

    window.addEventListener("resize", function () { if (actif) dimension(); });
    coiffes = 0; reste = 10; maj();
    dimension();
    accueil("", "");
  };
})();
