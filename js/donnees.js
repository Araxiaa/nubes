/* ==========================================================================
   DONNÉES — contenu du site depuis Supabase (table « nubes_contenus »).
   Rapide : on affiche tout de suite la dernière version mémorisée (ou js/data/contenu.js),
   puis on met à jour dès que la base répond. Hors ligne, le site reste complet.
   Usage :  Donnees.charger(function (contenu) { ...afficher... })  (peut être appelé 2 fois)
   ========================================================================== */
(function () {
    'use strict';

    var C = window.SITE_CONFIG;
    var CACHE = 'nubes-contenu-v1';

    function lireCache() {
        try { return JSON.parse(localStorage.getItem(CACHE)) || {}; } catch (e) { return {}; }
    }
    function fusion(base) {
        var o = {};
        Object.keys(window.DEFAUT).forEach(function (k) {
            o[k] = base[k] != null ? window.Outils.completer(base[k], window.DEFAUT[k]) : window.DEFAUT[k];
        });
        return o;
    }

    window.Donnees = {
        charger: function (rendre) {
            var cache = lireCache();
            var vu = JSON.stringify(cache);
            rendre(fusion(cache));
            if (!C || !C.url || !window.fetch) return;

            var ctrl = window.AbortController ? new AbortController() : null;
            var delai = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
            fetch(C.url + '/rest/v1/' + C.table + '?select=cle,valeur', {
                headers: { apikey: C.cle }, signal: ctrl ? ctrl.signal : undefined
            })
                .then(function (r) { return r.ok ? r.json() : []; })
                .then(function (lignes) {
                    if (!lignes.length) return;
                    var neuf = {};
                    lignes.forEach(function (l) { if (l.valeur != null) neuf[l.cle] = l.valeur; });
                    var texte = JSON.stringify(neuf);
                    if (texte === vu) return;
                    try { localStorage.setItem(CACHE, texte); } catch (e) {}
                    rendre(fusion(neuf));
                })
                .catch(function () { /* on garde ce qui est affiché */ })
                .then(function () { clearTimeout(delai); });
        },
        defaut: function () { return fusion({}); }
    };
})();
