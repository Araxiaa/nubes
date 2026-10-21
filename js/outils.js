/* OUTILS — petites fonctions partagées (site et dashboard). */
(function () {
    'use strict';

    function esc(t) {
        return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Texte avec mise en forme minimale (rien d'autre n'est jamais interprété) :
    //   **gras**   *italique*   ==surligné==   {{murmure}}   (et, comme avant, <b> <i> <em> <strong>)
    function riche(t) {
        return esc(t)
            .replace(/&lt;(\/?)(b|i|em|strong)&gt;/g, '<$1$2>')
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
            .replace(/==(.+?)==/g, '<mark>$1</mark>')
            .replace(/\{\{(.+?)\}\}/g, '<span class="murmure">$1</span>');
    }

    // Complète une rubrique venue de la base avec les champs ajoutés depuis (jamais l'inverse) :
    // un champ absent prend la valeur de départ, un champ présent (même vide) est respecté.
    function completer(valeur, defaut) {
        if (!valeur || !defaut || typeof valeur !== 'object' || typeof defaut !== 'object' || Array.isArray(valeur) || Array.isArray(defaut)) return valeur;
        var o = {};
        Object.keys(defaut).forEach(function (k) { o[k] = defaut[k]; });
        Object.keys(valeur).forEach(function (k) { o[k] = valeur[k]; });
        return o;
    }

    // Nom de fichier -> adresse (https://… tel quel, sinon dossier assets/photos/)
    function url(f) {
        return /^https?:\/\//.test(f) ? f : 'assets/photos/' + encodeURIComponent(f);
    }
    // Miniature : nom-m.webp pour les illustrations locales, sinon l'image elle-même
    function miniature(f) {
        return /^https?:\/\//.test(f) ? f : url(String(f).replace(/\.webp$/, '-m.webp'));
    }

    function avatar(nom, fichier, classe) {
        var ini = esc(String(nom || '?').trim().charAt(0).toUpperCase());
        var img = fichier ? '<img src="' + url(fichier) + '" alt="" width="72" height="72" loading="lazy" decoding="async">' : '';
        return '<div class="avatar ' + (classe || '') + '" data-initiale="' + ini + '">' + img + '</div>';
    }
    // Retire les images introuvables pour laisser voir l'initiale
    function avatars(racine) {
        Array.prototype.forEach.call((racine || document).querySelectorAll('.avatar img'), function (img) {
            function retirer() { if (img.parentNode) img.parentNode.removeChild(img); }
            img.addEventListener('error', retirer);
            if (img.complete && img.naturalWidth === 0) retirer();
        });
    }

    var CHEMINS = {
        coeur: 'M12 20.5C5 15.6 2.5 12 2.5 8.6 2.5 6 4.5 4 7 4c1.9 0 3.7 1.1 5 3 1.3-1.9 3.1-3 5-3 2.5 0 4.5 2 4.5 4.6 0 3.4-2.5 7-9.5 11.9z',
        etoile: 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z',
        crane: 'M12 3C7.6 3 4.5 6 4.5 10c0 2.4 1.1 4.2 2.5 5.2V19h2v-2h1.5v2h3v-2H15v2h2v-3.8c1.4-1 2.5-2.8 2.5-5.2C19.5 6 16.4 3 12 3zM8.7 9.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm6.6 0a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z'
    };
    function icone(n) {
        return '<svg class="sym sym-' + n + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + CHEMINS[n === 'sombre' ? 'coeur' : n] + '"' + (n === 'crane' ? ' fill-rule="evenodd"' : '') + '/></svg>';
    }
    // affinite : 1 à 3 = appréciation, -1 à -3 = aversion, 0 = neutre ; mitige = + un cœur sombre
    function coeurs(r) {
        var s = '', sens = [], a = r.affinite;
        if (typeof a === 'number') {
            if (a > 0) { s += new Array(a + 1).join(icone('coeur')); sens.push('appréciation ' + a + '/3'); }
            else if (a < 0) { s += new Array(-a + 1).join(icone('sombre')); sens.push('aversion ' + (-a) + '/3'); }
            else { s += icone('coeur') + icone('sombre'); sens.push('neutre'); }
        }
        if (r.mitige) { s += icone('sombre'); sens.push('mitigé'); }
        if (r.respect) { s += icone('etoile'); sens.push('respect'); }
        if (r.mort) { s += icone('crane'); sens.push('décédé(e)'); }
        return s ? '<span class="coeurs" role="img" aria-label="' + esc(sens.join(', ')) + '">' + s + '</span>' : '';
    }

    /* ---------- Lunes ---------- */
    function nombre(l) { var n = parseFloat(l); return isNaN(n) ? null : n; }
    function lune(l) {
        if (l == null || l === '') return '';
        var n = nombre(l);
        if (n != null && String(l).trim() === String(n)) return n + (n > 1 ? ' lunes' : ' lune');
        return String(l);
    }

    /* ---------- Relations : un chat + la liste datée de ses avis ---------- */
    // Accepte aussi l'ancien format (affinite / respect / texte directement sur le chat)
    function relation(r) {
        var o = {};
        Object.keys(r).forEach(function (k) { if (k !== 'affinite' && k !== 'respect' && k !== 'texte' && k !== 'mitige') o[k] = r[k]; });
        var avis = Array.isArray(r.avis) ? r.avis.slice() : [];
        if (!avis.length && (r.texte || typeof r.affinite === 'number' || r.respect)) {
            avis = [{ lune: r.lune, affinite: r.affinite, respect: r.respect, mitige: r.mitige, texte: r.texte }];
        }
        // du plus ancien au plus récent (à lune égale, l'ordre saisi est conservé)
        o.avis = avis.map(function (a, i) { return { a: a, i: i }; })
            .sort(function (x, y) { return ((nombre(x.a.lune) || 0) - (nombre(y.a.lune) || 0)) || (x.i - y.i); })
            .map(function (x) { return x.a; });
        o.dernier = o.avis[o.avis.length - 1] || {};
        return o;
    }
    // Cœurs d'un avis (le crâne dépend du chat, pas de l'avis)
    function coeursAvis(a, rel) { return coeurs({ affinite: a.affinite, mitige: a.mitige, respect: a.respect, mort: rel && rel.mort }); }

    // Courbe d'évolution de l'affinité (de -3 aversion à +3 appréciation)
    function courbe(avis, grande) {
        var pts = avis.filter(function (a) { return typeof a.affinite === 'number'; });
        if (pts.length < 2) return '';
        var W = grande ? 360 : 84, H = grande ? 150 : 26, px = grande ? 26 : 3, py = grande ? 22 : 3;
        var ln = pts.map(function (a) { return nombre(a.lune); });
        var min = Math.min.apply(null, ln), max = Math.max.apply(null, ln);
        var lineaire = ln.every(function (v) { return v != null; }) && max > min;
        var xy = pts.map(function (a, i) {
            var x = px + (W - 2 * px) * (lineaire ? (ln[i] - min) / (max - min) : i / (pts.length - 1));
            return [x, py + (H - 2 * py) * (3 - a.affinite) / 6];
        });
        var ligne = xy.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        var s = '<svg class="courbe' + (grande ? ' grande' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Évolution de l\'affinité">';
        if (grande) {
            [3, 0, -3].forEach(function (v) {
                var y = py + (H - 2 * py) * (3 - v) / 6;
                s += '<line x1="' + px + '" x2="' + (W - px) + '" y1="' + y + '" y2="' + y + '" class="repere' + (v === 0 ? ' zero' : '') + '"/>';
            });
            s += '<text x="2" y="' + (py + 4) + '" class="legende-y">♥</text><text x="2" y="' + (H - py + 4) + '" class="legende-y">✕</text>';
        }
        s += '<polyline points="' + ligne + '" class="trait"/>';
        xy.forEach(function (p, i) {
            s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (grande ? 4.5 : 2.2) + '" class="point ' + (pts[i].affinite > 0 ? 'pos' : pts[i].affinite < 0 ? 'neg' : '') + '"><title>' + esc(lune(pts[i].lune)) + '</title></circle>';
            if (grande) s += '<text x="' + p[0].toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle" class="legende-x">' + esc(nombre(pts[i].lune) != null ? nombre(pts[i].lune) : '') + '</text>';
        });
        return s + '</svg>';
    }

    window.Outils = {
        esc: esc, riche: riche, completer: completer, url: url, miniature: miniature, avatar: avatar, avatars: avatars, icone: icone, coeurs: coeurs,
        nombre: nombre, lune: lune, relation: relation, coeursAvis: coeursAvis, courbe: courbe
    };
})();
