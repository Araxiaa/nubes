/* AMBIANCE — flocons et poussière de nuage portés par le vent de la lande (canvas léger).
   Des rafales soufflent de temps en temps. S'arrête si l'onglet est masqué ou si
   « réduire les animations » est activé. */
(function () {
    'use strict';
    var cv = document.getElementById('flocons');
    if (!cv || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var ctx = cv.getContext('2d'), w, h, grains = [], actif = true, raf, rafale = 0, prochaine = 4000;
    var N = window.innerWidth < 700 ? 22 : 48;
    var racine = document.documentElement;

    function taille() {
        var d = Math.min(window.devicePixelRatio || 1, 2);
        w = cv.width = innerWidth * d; h = cv.height = innerHeight * d;
    }
    function grain(loin) {
        var z = Math.random();   // profondeur : les grains proches sont plus gros et plus rapides
        return { x: Math.random() * w, y: loin ? Math.random() * h : -10, z: z, r: (z * 2.2 + .6) * (w / innerWidth),
                 v: z * .9 + .25, d: Math.random() * 6.28, a: z * .5 + .18 };
    }
    function dessiner(t) {
        ctx.clearRect(0, 0, w, h);
        if (t > prochaine) { rafale = 1; prochaine = t + 7000 + Math.random() * 9000; }
        rafale *= .985;
        var brume = racine.getAttribute('data-theme') === 'brume';
        var c = brume ? '96,132,170,' : '226,240,255,';
        for (var i = 0; i < grains.length; i++) {
            var g = grains[i];
            g.x += (g.v * .8 + rafale * g.z * 5) * (w / innerWidth);
            g.y += g.v * .55 + Math.sin(t / 1500 + g.d) * .3;
            if (g.x > w + 10) { g.x = -10; g.y = Math.random() * h; }
            if (g.y > h + 10) { g.y = -10; g.x = Math.random() * w; }
            ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.283);
            ctx.fillStyle = 'rgba(' + c + g.a + ')'; ctx.fill();
        }
        if (actif) raf = requestAnimationFrame(dessiner);
    }
    taille();
    for (var i = 0; i < N; i++) grains.push(grain(true));
    addEventListener('resize', taille);
    document.addEventListener('visibilitychange', function () {
        actif = !document.hidden;
        if (actif) raf = requestAnimationFrame(dessiner); else cancelAnimationFrame(raf);
    });
    raf = requestAnimationFrame(dessiner);
})();
