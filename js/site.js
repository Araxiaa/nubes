/* ==========================================================================
   SITE — navigation (#page/sous-page), affichage du contenu (Donnees.charger).
   Une fonction par vue ; PAGES décrit le menu.
   ========================================================================== */
(function () {
    'use strict';

    var O = window.Outils, esc = O.esc, riche = O.riche;
    var $ = function (id) { return document.getElementById(id); };
    var DONNEES = null;

    /* ---------- Menu ---------- */
    var PAGES = [
        { id: 'accueil', nom: 'Accueil', desc: 'Qui est Nuage Blanc, en un regard.', subs: [['accueil', 'Accueil']] },
        { id: 'lui', nom: 'Lui', desc: 'Identité, caractère, physique, voix, aptitudes, santé.',
          subs: [['noms', 'Identité'], ['caractere', 'Caractère'], ['physique', 'Physique'], ['voix', 'Voix'], ['aptitudes', 'Aptitudes'], ['sante', 'Santé']] },
        { id: 'histoire', nom: 'Histoire', desc: 'Ses chapitres, la frise de sa vie, ses fils de rôle-play.',
          subs: [['chroniques', 'Chroniques'], ['parcours', 'Parcours'], ['fils', 'Fils RP']] },
        { id: 'entourage', nom: 'Entourage', desc: 'Sa famille et le ciel de ses relations.',
          subs: [['lignee', 'Lignée'], ['relations', 'Relations']] },
        { id: 'jouer', nom: 'Jouer', desc: 'Comment l\'aborder et écrire avec lui.', subs: [['accroches', 'Jouer avec lui']] },
        { id: 'galerie', nom: 'Galerie', desc: 'Illustrations, sprites et designs.', subs: [['galerie', 'Galerie']] }
    ];
    var ORDRE = [];
    PAGES.forEach(function (p) { p.subs.forEach(function (s) { ORDRE.push(p.id + '/' + s[0]); }); });
    function nomPage(k) {
        var p = k.split('/'), pg = PAGES.filter(function (x) { return x.id === p[0]; })[0];
        return pg.subs.filter(function (s) { return s[0] === p[1]; })[0][1];
    }

    /* ---------- Petits gabarits ---------- */
    var RUB = '';
    function titre(h, sous) {
        return '<header class="entete">' + (RUB ? '<span class="rubrique">' + esc(RUB) + '</span>' : '') + '<h1>' + esc(h) + '</h1>' + (sous ? '<p>' + esc(sous) + '</p>' : '') + '</header>';
    }
    // Blocs de texte : paragraphe (par défaut), intertitre, citation, encart, séparateur, image
    function paras(liste) {
        return (liste || []).map(function (p) {
            switch (p.type) {
                case 'intertitre': return '<h3 class="intertitre">' + riche(p.texte) + '</h3>';
                case 'citation': return '<blockquote class="exergue">' + riche(p.texte) + '</blockquote>';
                case 'encart': return '<aside class="encart">' + riche(p.texte) + '</aside>';
                case 'separateur': return '<div class="ornement" aria-hidden="true"><span>✦</span></div>';
                case 'image': return p.image ? '<figure class="figure"><img src="' + O.url(p.image) + '" alt="' + esc(p.texte || '') + '" loading="lazy" decoding="async">' + (p.texte ? '<figcaption>' + riche(p.texte) + '</figcaption>' : '') + '</figure>' : '';
                default: return '<p>' + riche(p.texte) + '</p>';
            }
        }).join('');
    }
    function motscles(l) {
        return l && l.length ? '<ul class="motscles" aria-label="En quelques mots">' + l.map(function (m) { return '<li>' + esc(m.texte) + '</li>'; }).join('') + '</ul>' : '';
    }
    function jauges(l, titreSection) {
        if (!l || !l.length) return '';
        return '<section class="profil">' + (titreSection ? '<h2 class="titre-section">' + esc(titreSection) + '</h2>' : '') + '<div class="jauges-trait">' + l.map(function (j) {
            var n = Math.max(0, Math.min(5, Number(j.niveau) || 0)), pts = '';
            for (var i = 0; i < 5; i++) pts += '<i class="pt' + (i < n ? ' plein' : '') + '"></i>';
            return '<div class="jauge"><span class="jauge-nom">' + esc(j.nom) + (j.note ? '<small>' + esc(j.note) + '</small>' : '') + '</span><span class="pts" role="img" aria-label="' + n + ' sur 5">' + pts + '</span></div>';
        }).join('') + '</div></section>';
    }
    function nuancier(l) {
        if (!l || !l.length) return '';
        return '<section><h2 class="titre-section">Palette du pelage</h2><ul class="nuancier">' + l.map(function (c) {
            var hex = /^#[0-9a-f]{3,8}$/i.test(c.hex || '') ? c.hex : '#888888';
            return '<li><span class="goutte" style="background:' + hex + '"></span><b>' + esc(c.nom) + '</b><small>' + esc(hex.toUpperCase()) + '</small></li>';
        }).join('') + '</ul></section>';
    }
    function apercu(l) {
        return l && l.length ? '<dl class="apercu">' + l.map(function (x) { return '<div><dt>' + esc(x.label) + '</dt><dd>' + esc(x.valeur) + '</dd></div>'; }).join('') + '</dl>' : '';
    }
    function pliant(h, corps, ouvert) {
        return '<details class="pliant"' + (ouvert ? ' open' : '') + '><summary><span>' + esc(h) + '</span><i aria-hidden="true"></i></summary><div class="pliant-corps">' + corps + '</div></details>';
    }
    function traits(liste, classe) {
        return '<ul class="traits ' + (classe || '') + '">' + (liste || []).map(function (t) {
            return '<li><h3>' + esc(t.nom) + '</h3><p>' + riche(t.texte) + '</p>' + (t.note ? '<small>' + esc(t.note) + '</small>' : '') + '</li>';
        }).join('') + '</ul>';
    }
    function bloc(classe, h, liste) {
        return '<div class="gout ' + classe + '"><h3>' + h + '</h3>' + (liste || []).map(function (t) {
            return '<div><h4>' + esc(t.nom) + '</h4><p>' + riche(t.texte) + '</p></div>';
        }).join('') + '</div>';
    }
    function puces(options, actuel, attr) {
        return '<div class="puces" role="group">' + options.map(function (o) {
            return '<button type="button" class="puce" data-' + attr + '="' + esc(o[0]) + '" aria-pressed="' + (o[0] === actuel) + '">' + esc(o[1]) + '</button>';
        }).join('') + '</div>';
    }
    function lienOk(l) { return /^https?:\/\//.test(l || ''); }
    function vide(texte) { return '<p class="vide-page">' + esc(texte) + '</p>'; }
    function nomActuel(c) {
        var n = c.noms || [];
        for (var i = 0; i < n.length; i++) if (n[i].actuel) return n[i];
        return n[0] || { nom: 'Nuage Blanc' };
    }
    function nomNaissance(c) {
        var n = (c.noms || [])[0], na = nomActuel(c);
        return n && n !== na ? n.nom : '';
    }

    /* ---------- Accueil ---------- */
    function accueil(c) {
        var f = c.fiche || {}, na = nomActuel(c), ne = nomNaissance(c), j = c.jouer || {};
        var fils = (c.fils || []).filter(function (x) { return x.enCours; });
        var enCours = (c.sante || []).filter(function (x) { return x.statut === 'en_cours'; });
        var evol = evolutions(c).slice(0, 3);
        var mots = String(na.nom).split(' ');
        var art = (c.apparence && c.apparence.image) || f.portrait;

        var hero = '<section class="hero">' +
            '<div class="hero-lune" aria-hidden="true"></div>' +
            '<div class="hero-art">' + (art ? '<img src="' + O.url(art) + '" alt="' + esc(na.nom) + ', félin blanc aux yeux bleu foncé" width="1600" height="960" fetchpriority="high" decoding="async">' : '') + '</div>' +
            '<div class="hero-texte"><p class="surtitre">' + esc(f.clan || '') + '</p>' +
            '<h1>' + mots.map(function (m, i) { return '<span style="--i:' + i + '">' + esc(m) + '</span>'; }).join(' ') + '</h1>' +
            (ne ? '<p class="alias">Autrefois connu sous le nom de <b>' + esc(ne) + '</b></p>' : '') +
            '<p class="devise">' + esc(f.devise || '') + '</p>' +
            (f.accroche ? '<p class="accroche">' + esc(f.accroche) + '</p>' : '') +
            '<div class="actions"><a class="btn" href="#histoire/chroniques">Découvrir son histoire</a><a class="btn clair" href="#jouer">Jouer avec lui</a></div></div>' +
            '<div class="banc banc-1" aria-hidden="true"></div><div class="banc banc-2" aria-hidden="true"></div></section>' +
            '<dl class="fiche">' + (f.lignes || []).map(function (l) { return '<div><dt>' + esc(l.label) + '</dt><dd>' + esc(l.valeur) + '</dd></div>'; }).join('') +
            ((f.pv || f.pa) ? '<div class="stat"><dt>Points de vie</dt><dd>' + esc(f.pv || '—') + '</dd></div><div class="stat"><dt>Points d\'attaque</dt><dd>' + esc(f.pa || '—') + '</dd></div>' : '') + '</dl>';

        var cartes = '<section class="maintenant"><h2 class="titre-section">En ce moment</h2><div class="trio">' +
            '<article class="mini"><h3>Fils en cours</h3>' +
            (fils.length ? '<ul>' + fils.slice(0, 3).map(function (x) { return '<li><b>' + esc(x.titre) + '</b><small>' + esc(O.lune(x.lune)) + '</small></li>'; }).join('') + '</ul>' : '<p>Aucun fil en cours.</p>') +
            '<a href="#histoire/fils">Tous les fils →</a></article>' +
            '<article class="mini"><h3>Disponibilité RP</h3><p class="dispo ' + esc(j.statut || 'ouvert') + '">' + esc(STATUTS_RP[j.statut || 'ouvert']) + '</p>' +
            (j.statutTexte ? '<p>' + esc(j.statutTexte) + '</p>' : '') + '<a href="#jouer">Comment jouer avec lui →</a></article>' +
            '<article class="mini"><h3>Santé</h3>' +
            (enCours.length ? '<ul>' + enCours.slice(0, 3).map(function (x) { return '<li><b>' + esc(x.titre) + '</b><small>' + (x.type === 'maladie' ? 'Maladie' : 'Blessure') + '</small></li>'; }).join('') + '</ul>'
                : '<p class="bon">Rien en cours. Handicap permanent : héméralopie.</p>') +
            '<a href="#lui/sante">Historique →</a></article>' +
            '<article class="mini"><h3>Relations</h3>' +
            (evol.length ? '<ul>' + evol.map(function (e) { return '<li><b>' + esc(e.rel.nom) + '</b>' + O.coeursAvis(e.avis, e.rel) + '</li>'; }).join('') + '</ul>' : '<p>Aucune relation notée.</p>') +
            '<a href="#entourage/relations">Le ciel de ses relations →</a></article></div></section>';

        var debut = '<section><h2 class="titre-section">Par où commencer ?</h2><ol class="debut">' +
            lien('lui/caractere', 'Comprendre son caractère', 'Un protecteur qui se cache derrière un rempart de sarcasmes.') +
            lien('histoire/chroniques', 'Lire son histoire', 'Huit chapitres, de sa naissance à son arrivée au Clan du Vent.') +
            lien('jouer', 'Écrire avec lui', 'Comment l\'aborder, ce qu\'il accepte, idées de rencontres.') + '</ol></section>';

        var explorer = '<section><h2 class="titre-section">Tout explorer</h2><ul class="explorer">' + PAGES.slice(1).map(function (p) {
            return '<li>' + lienLigne(p.id + (p.subs.length > 1 ? '/' + p.subs[0][0] : ''), p.nom, p.desc) + '</li>';
        }).join('') + '</ul></section>';

        return hero + cartes + debut + explorer;
    }
    function lien(route, nom, texte) { return '<li><a class="carte-lien" href="#' + route + '"><h3>' + nom + '</h3><p>' + texte + '</p><span aria-hidden="true">→</span></a></li>'; }
    function lienLigne(route, nom, texte) { return '<a class="ligne-lien" href="#' + route + '"><b>' + nom + '</b><span>' + texte + '</span><i aria-hidden="true">→</i></a>'; }

    /* ---------- Lui ---------- */
    function noms(c) {
        var liste = c.noms || [], pos = 0;
        liste.forEach(function (n, i) { if (n.actuel) pos = i; });
        return titre('Identité & noms', 'Les noms qu\'il porte au fil de sa vie') +
            '<ol class="frise">' + liste.map(function (n, i) {
                var etat = i < pos ? 'passe' : i === pos ? 'actuel' : 'avenir';
                return '<li class="' + etat + '"><span class="etape">' + esc(n.etape) +
                    (etat === 'actuel' ? ' <em class="porte">Porté actuellement</em>' : etat === 'passe' ? ' <em>ancien nom</em>' : '') + '</span>' +
                    '<strong>' + esc(n.nom) + '</strong>' +
                    (n.periode ? '<span class="periode">' + esc(n.periode) + '</span>' : '') +
                    (n.citation ? '<blockquote>' + riche(n.citation) + '</blockquote>' : '') +
                    (n.note ? '<small>' + esc(n.note) + '</small>' : '') + '</li>';
            }).join('') + '</ol>' +
            '<h2 class="titre-section">En un coup d\'œil</h2>' + apercu((c.fiche || {}).lignes);
    }

    function caractere(c) {
        var p = c.personnalite || {};
        return titre('Caractère & personnalité') +
            (p.citation ? '<blockquote class="exergue grande">' + riche(p.citation) + '</blockquote>' : '') + motscles(p.motscles) + jauges(p.jauges, 'Son profil') +
            '<h2 class="titre-section">Qui il est</h2><div class="texte lettrine">' + paras(p.paragraphes) + '</div>' +
            '<div class="pliants">' +
            pliant('Qualités', traits(p.qualites, 'positif'), true) +
            pliant('Défauts', traits(p.defauts, 'negatif')) +
            pliant('Goûts & dégoûts', '<div class="duo">' + bloc('aime', 'Il aime', p.aime) + bloc('aimepas', 'Il n\'aime pas', p.aimepas) + '</div>' +
                (p.gouts_note ? '<p class="note">' + esc(p.gouts_note) + '</p>' : '')) +
            pliant('Peurs & phobies', (p.peurs || []).map(function (x) { return '<blockquote class="mot">' + riche(x.texte) + '</blockquote>'; }).join('')) +
            pliant('Habitudes & tics', traits(p.habitudes)) + '</div>';
    }

    function physique(c) {
        var a = c.apparence || {};
        var marques = '<ul class="traits">' + (a.marques || []).map(function (m) {
            return '<li><h3>' + esc(m.nom) + '</h3><p class="vide">' + esc(m.texte) + '</p>' + (m.note ? '<small>' + esc(m.note) + '</small>' : '') + '</li>';
        }).join('') + '</ul>';
        return titre('Apparence physique') +
            (a.image ? '<figure class="en-pied"><img src="' + O.url(a.image) + '" alt="Nuage Blanc en pied" width="1600" height="960" loading="lazy" decoding="async"></figure>' : '') +
            apercu(a.apercu) + nuancier(a.palette) +
            '<h2 class="titre-section">En détail</h2><div class="texte lettrine">' + paras(a.paragraphes) + '</div>' +
            '<div class="pliants">' + pliant('Points forts', traits(a.forts, 'positif'), true) + pliant('Points faibles', traits(a.faibles, 'negatif')) +
            pliant('Marques & attributs', marques) + '</div>' +
            '<a class="ligne-lien grand" href="#lui/sante"><h3>Historique de santé</h3><p>Blessures, maladies, soins et séquelles.</p><span aria-hidden="true">→</span></a>';
    }

    function voix(c) {
        var v = c.voix || {};
        return titre('Voix & façon de parler', 'Pour écrire ses répliques sans fausse note') +
            '<div class="texte lettrine">' + paras(v.intro) + '</div>' +
            (v.tics && v.tics.length ? '<h2 class="titre-section">Tics de langage</h2>' + traits(v.tics) : '') +
            ((v.repliques || []).length ? '<h2 class="titre-section">Dans le ton</h2>' + (v.repliques || []).map(function (r) {
                return '<blockquote class="replique">' + riche(r.texte) + (r.contexte ? '<small>' + esc(r.contexte) + '</small>' : '') + '</blockquote>';
            }).join('') : '');
    }

    function aptitudes(c) {
        var a = c.aptitudes || {}, f = c.fiche || {};
        return titre('Aptitudes', 'Ce qu\'il sait faire — et ce qu\'il ne sait pas faire') +
            (a.role ? '<section class="role-clan"><span class="surtitre">Rôle au clan</span><h2>' + esc(a.role) + '</h2>' + (a.roleTexte ? '<p>' + riche(a.roleTexte) + '</p>' : '') + '</section>' : '') +
            '<div class="jauges grandes"><div><span>Points de vie</span><b>' + esc(f.pv || '') + '</b></div><div><span>Points d\'attaque</span><b>' + esc(f.pa || '') + '</b></div></div>' +
            jauges(a.competences, 'Compétences');
    }

    var SANTE = { f: 'tout' };
    var GRAVITE = { legere: 'Légère', moderee: 'Modérée', grave: 'Grave' };
    var STATUT_SANTE = { en_cours: 'En cours', guerie: 'Guérie', sequelle: 'Séquelles' };
    function sante(c) {
        var tout = (c.sante || []).slice().sort(function (a, b) { return (O.nombre(b.lune) || 0) - (O.nombre(a.lune) || 0); });
        var enCours = tout.filter(function (x) { return x.statut === 'en_cours'; });
        var liste = tout.filter(function (x) {
            return SANTE.f === 'tout' || (SANTE.f === 'en_cours' ? x.statut === 'en_cours' : x.type === SANTE.f);
        });
        var etat = enCours.length
            ? '<div class="etat alerte"><b>' + enCours.length + ' problème' + (enCours.length > 1 ? 's' : '') + ' en cours</b><span>' + enCours.map(function (x) { return esc(x.titre); }).join(' · ') + '</span></div>'
            : '<div class="etat bon"><b>Rien en cours</b><span>Aucune blessure ni maladie à soigner pour le moment.</span></div>';
        var filtres = puces([['tout', 'Tout'], ['blessure', 'Blessures'], ['maladie', 'Maladies'], ['en_cours', 'En cours']], SANTE.f, 'sante');
        var corps = liste.length ? '<ol class="chrono">' + liste.map(function (x) {
            var duree = x.statut === 'en_cours' ? 'depuis ' + O.lune(x.lune) : (x.fin != null && x.fin !== '' ? O.lune(x.lune) + ' → ' + O.lune(x.fin) : O.lune(x.lune));
            return '<li class="' + esc(x.statut || '') + '"><div class="entete-ev"><h3>' + esc(x.titre) + '</h3><span class="duree">' + esc(duree) + '</span></div>' +
                '<div class="badges"><span class="badge-t ' + esc(x.type || '') + '">' + (x.type === 'maladie' ? 'Maladie' : 'Blessure') + '</span>' +
                (x.gravite ? '<span class="badge-t g-' + esc(x.gravite) + '">' + esc(GRAVITE[x.gravite] || x.gravite) + '</span>' : '') +
                (x.statut ? '<span class="badge-t s-' + esc(x.statut) + '">' + esc(STATUT_SANTE[x.statut] || x.statut) + '</span>' : '') + '</div>' +
                (x.description ? '<p>' + riche(x.description) + '</p>' : '') +
                (x.soins ? '<p class="detail"><b>Soins</b> ' + riche(x.soins) + '</p>' : '') +
                (x.sequelles ? '<p class="detail"><b>Séquelles</b> ' + riche(x.sequelles) + '</p>' : '') +
                (lienOk(x.lien) ? '<a class="lien-ext" href="' + esc(x.lien) + '" target="_blank" rel="noopener noreferrer">Voir le fil Discord ↗</a>' : '') + '</li>';
        }).join('') + '</ol>' : vide(tout.length ? 'Rien ne correspond à ce filtre.' : 'Aucune blessure ni maladie pour le moment. Son historique s\'écrira au fil de ses aventures.');
        return titre('Santé', 'Historique des blessures et des maladies') + etat + (tout.length ? filtres : '') + corps;
    }

    /* ---------- Histoire ---------- */
    var CHAP = { i: 0 };
    function chroniques(c) {
        var ch = (c.histoire && c.histoire.chapitres) || [];
        if (CHAP.i >= ch.length) CHAP.i = 0;
        var nav = ch.map(function (x, i) {
            return '<button type="button" class="puce" data-chap="' + i + '" aria-pressed="' + (i === CHAP.i) + '">' + (i + 1) + '</button>';
        }).join('');
        var x = ch[CHAP.i] || {};
        return titre('Histoire & chroniques', ch.length + ' chapitres') + '<div class="puces chap-nav" aria-label="Chapitres">' + nav + '</div>' +
            '<article class="chapitre' + (x.avenir ? ' avenir' : '') + '"><header><h2>Chapitre ' + (CHAP.i + 1) + ' · ' + esc(x.titre) + '</h2><span class="age">Âge : ' + esc(x.age) + '</span></header>' +
            '<div class="texte">' + paras(x.paragraphes) + '</div>' + (x.citation ? '<blockquote>' + riche(x.citation) + '</blockquote>' : '') + '</article>' +
            '<div class="chap-pager">' +
            (CHAP.i > 0 ? '<button type="button" class="btn clair" data-chap="' + (CHAP.i - 1) + '">← Chapitre précédent</button>' : '<span></span>') +
            (CHAP.i < ch.length - 1 ? '<button type="button" class="btn" data-chap="' + (CHAP.i + 1) + '">Chapitre suivant →</button>' : '<span></span>') + '</div>';
    }

    /* ---------- Parcours : frise de sa vie, assemblée toute seule ---------- */
    var PARC = { f: 'tout' };
    function premierNombre(s) { var m = String(s || '').match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : null; }
    var TYPES_PARC = { chapitre: 'Chapitre', nom: 'Nom', fil: 'Fil RP', sante: 'Santé', relation: 'Relation' };
    function evenements(c) {
        var ev = [], posActuel = 0;
        (c.noms || []).forEach(function (n, i) { if (n.actuel) posActuel = i; });
        ((c.histoire || {}).chapitres || []).forEach(function (x, i) {
            var l = premierNombre(x.age); if (l == null) return;
            ev.push({ l: l, type: 'chapitre', titre: 'Chapitre ' + (i + 1) + ' · ' + x.titre, texte: x.age ? 'Âge : ' + x.age : '', lien: '#histoire/chroniques', chap: i });
        });
        (c.noms || []).forEach(function (n, i) {
            var l = premierNombre(n.periode);
            if (l == null || i === 0 || i > posActuel) return;   // seulement les noms déjà portés
            ev.push({ l: l, type: 'nom', titre: n.etape + ' : ' + n.nom, texte: n.actuel ? 'Son nom actuel' : '', lien: '#lui/noms' });
        });
        (c.fils || []).forEach(function (x) {
            if (O.nombre(x.lune) == null) return;
            ev.push({ l: O.nombre(x.lune), type: 'fil', titre: x.titre, texte: x.description || '', badge: x.enCours ? 'En cours' : '', lien: '#histoire/fils' });
        });
        (c.sante || []).forEach(function (x) {
            if (O.nombre(x.lune) == null) return;
            ev.push({ l: O.nombre(x.lune), type: 'sante', titre: x.titre, texte: (x.type === 'maladie' ? 'Maladie' : 'Blessure') + (x.statut === 'en_cours' ? ' · en cours' : ''), lien: '#lui/sante' });
            if (O.nombre(x.fin) != null) ev.push({ l: O.nombre(x.fin), type: 'sante', titre: 'Guérison : ' + x.titre, texte: '', lien: '#lui/sante' });
        });
        rels(c).forEach(function (r) {
            r.avis.forEach(function (a, i) {
                if (O.nombre(a.lune) == null) return;
                ev.push({ l: O.nombre(a.lune), type: 'relation', titre: (i ? 'Évolution : ' : 'Rencontre : ') + r.nom, texte: '', coeurs: O.coeursAvis(a, r), lien: '#entourage/relations' });
            });
        });
        return ev.sort(function (a, b) { return a.l - b.l; });
    }
    function parcours(c) {
        var tous = evenements(c);
        var liste = tous.filter(function (e) { return PARC.f === 'tout' || e.type === PARC.f; });
        var presents = {}; tous.forEach(function (e) { presents[e.type] = true; });
        var filtres = puces([['tout', 'Tout']].concat(Object.keys(TYPES_PARC).filter(function (k) { return presents[k]; }).map(function (k) { return [k, TYPES_PARC[k]]; })), PARC.f, 'parc');
        var corps = liste.length ? '<ol class="parcours">' + liste.map(function (e) {
            return '<li class="p-' + e.type + '"><span class="p-lune">' + esc(O.lune(e.l)) + '</span><a class="p-carte" href="' + e.lien + '"' + (e.chap != null ? ' data-chap-lien="' + e.chap + '"' : '') + '><span class="p-type">' + TYPES_PARC[e.type] + (e.badge ? ' · ' + esc(e.badge) : '') + '</span>' +
                '<strong>' + esc(e.titre) + '</strong>' + (e.coeurs || '') + (e.texte ? '<span class="p-texte">' + esc(e.texte.length > 120 ? e.texte.slice(0, 118) + '…' : e.texte) + '</span>' : '') + '</a></li>';
        }).join('') + '</ol>' : vide('Rien à afficher pour le moment.');
        return titre('Parcours', 'Toute sa vie en une frise : chapitres, fils, santé et relations, lune après lune') + filtres + corps;
    }

    var FIL = { f: 'tous' };
    function fils(c) {
        var tous = c.fils || [];
        var nb = tous.filter(function (x) { return x.enCours; }).length;
        var liste = tous.filter(function (x) { return FIL.f === 'tous' || (FIL.f === 'cours' ? x.enCours : !x.enCours); })
            .sort(function (a, b) { return (O.nombre(b.lune) || 0) - (O.nombre(a.lune) || 0); });
        var groupes = [], vu = {};
        liste.forEach(function (x) {
            var k = O.lune(x.lune) || 'Sans date';
            if (!vu[k]) { vu[k] = { k: k, items: [] }; groupes.push(vu[k]); }
            vu[k].items.push(x);
        });
        var corps = groupes.length ? groupes.map(function (g) {
            return '<section class="groupe-lune"><h2><span>' + esc(g.k) + '</span></h2><ul class="fils">' + g.items.map(function (x) {
                var parts = String(x.participants || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                return '<li class="fil-rp' + (x.enCours ? ' en-cours' : '') + '"><div class="entete-ev"><h3>' + esc(x.titre) + '</h3>' +
                    '<span class="statut ' + (x.enCours ? 'cours' : 'fini') + '">' + (x.enCours ? 'En cours' : 'Terminé') + '</span></div>' +
                    (x.description ? '<p>' + riche(x.description) + '</p>' : '') +
                    (parts.length ? '<ul class="participants" aria-label="Participants">' + parts.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' : '') +
                    (lienOk(x.lien) ? '<a class="lien-ext" href="' + esc(x.lien) + '" target="_blank" rel="noopener noreferrer">Ouvrir le fil sur Discord ↗</a>' : '') + '</li>';
            }).join('') + '</ul></section>';
        }).join('') : vide(tous.length ? 'Aucun fil ne correspond à ce filtre.' : 'Aucun fil pour le moment.');
        return titre('Fils de jeu de rôle', tous.length + ' fil' + (tous.length > 1 ? 's' : '') + ' · ' + nb + ' en cours') +
            (tous.length ? puces([['tous', 'Tous'], ['cours', 'En cours'], ['finis', 'Terminés']], FIL.f, 'fil') : '') + corps;
    }

    /* ---------- Entourage ---------- */
    var ETIQUETTE = { vivant: 'Vivant(e)', decede: 'Décédé(e)', disparu: 'Disparu(e)', vide: '' };
    function carte(m) {
        var statut = m.statut || 'vivant';
        if (statut === 'vide') return '<li class="membre vide"><div><h3>' + esc(m.nom) + '</h3><p>' + riche(m.texte) + '</p></div></li>';
        return '<li class="membre ' + esc(statut) + (m.mise ? ' mise' : '') + '">' + O.avatar(m.nom, m.photo) +
            '<div><h3>' + esc(m.nom) + (m.tag ? ' <span class="tag">' + esc(m.tag) + '</span>' : '') + '</h3>' +
            '<span class="role">' + esc(m.role || '') + (m.joueur ? ' · <b>' + esc(m.joueur) + '</b>' : '') + '</span>' +
            (m.texte ? '<p>' + riche(m.texte) + '</p>' : '') + '</div>' +
            (statut !== 'vivant' ? '<em class="etat-m">' + ETIQUETTE[statut] + '</em>' : '') + '</li>';
    }
    var ROMAIN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    function lignee(c) {
        var g = c.genealogie || {};
        return titre('Généalogie & lignée', g.origine) + (g.groupes || []).map(function (gr, i) {
            return '<section class="groupe"><h2><span>' + ROMAIN[i] + '</span>' + esc(gr.titre) + '</h2><ul class="membres">' + (gr.membres || []).map(carte).join('') + '</ul></section>';
        }).join('');
    }

    var REL = { clan: '', aff: 'tous', q: '', vue: 'liste' };
    function rels(c) { return (c.relations || []).map(O.relation); }
    function evolutions(c) {
        var out = [];
        rels(c).forEach(function (r) {
            r.avis.forEach(function (a, i) { out.push({ rel: r, avis: a, prev: r.avis[i - 1] }); });
        });
        return out.sort(function (a, b) { return (O.nombre(b.avis.lune) || 0) - (O.nombre(a.avis.lune) || 0); });
    }
    function tendance(r) {
        var a = r.avis, n = a.length;
        if (n < 2 || typeof a[n - 1].affinite !== 'number' || typeof a[n - 2].affinite !== 'number') return '';
        var d = a[n - 1].affinite - a[n - 2].affinite;
        return d > 0 ? '<span class="tend monte" title="S\'améliore">▲</span>' : d < 0 ? '<span class="tend descend" title="Se dégrade">▼</span>' : '<span class="tend egal" title="Stable">＝</span>';
    }
    function categorie(r) {
        var a = r.dernier.affinite;
        return r.mort ? 'decede' : typeof a !== 'number' ? 'neutre' : a > 0 ? 'positif' : a < 0 ? 'negatif' : 'neutre';
    }
    function relationsFiltres(c) {
        var clans = [];
        rels(c).forEach(function (r) { var k = r.clan || 'Sans clan'; if (clans.indexOf(k) < 0) clans.push(k); });
        return puces([['liste', 'Liste'], ['ciel', 'Ciel']], REL.vue, 'vue') +
            (clans.length > 1 ? puces([['', 'Tous les clans']].concat(clans.map(function (k) { return [k, k]; })), REL.clan, 'clan') : '') +
            puces([['tous', 'Toutes'], ['positif', 'Appréciées'], ['neutre', 'Neutres'], ['negatif', 'Aversion'], ['decede', 'Décédées']], REL.aff, 'aff');
    }
    function relationsFiltrees(c) {
        var q = REL.q.trim().toLowerCase();
        return rels(c).filter(function (r) {
            return (!REL.clan || (r.clan || 'Sans clan') === REL.clan) && (REL.aff === 'tous' || categorie(r) === REL.aff) &&
                (!q || (r.nom + ' ' + (r.role || '') + ' ' + (r.clan || '') + ' ' + (r.joueur || '')).toLowerCase().indexOf(q) >= 0);
        });
    }

    // Le ciel : il est le grand nuage du centre, chaque chat est un nuage qui flotte autour de lui.
    // Plus le lien est fort, plus le nuage est proche (et gros) ; la teinte dit la nature du lien.
    function forme(k) {
        return '<g class="corps" transform="scale(' + k.toFixed(2) + ')"><circle cx="-28" cy="4" r="16"/><circle cx="-10" cy="-8" r="21"/><circle cx="13" cy="-11" r="23"/>' +
            '<circle cx="33" cy="1" r="17"/><rect x="-44" y="4" width="92" height="19" rx="9.500"/></g>';
    }
    function ciel(c) {
        var liste = relationsFiltrees(c).sort(function (a, b) { return String(a.clan || '').localeCompare(String(b.clan || '')); });
        if (!liste.length) return vide('Aucune relation ne correspond.');
        var etroit = window.innerWidth < 640;
        var W = etroit ? 460 : 820, H = etroit ? 640 : 540, cx = W / 2, cy = H / 2 - 4, RX = W / 2 - 80, RY = H / 2 - 64, N = liste.length;
        var s = '<svg class="ciel-rel" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Le ciel de ses relations : plus un nuage est proche du centre, plus le lien est fort">';
        [.45, .72, 1].forEach(function (k) { s += '<ellipse class="anneau" cx="' + cx + '" cy="' + cy + '" rx="' + (RX * k).toFixed(0) + '" ry="' + (RY * k).toFixed(0) + '"/>'; });
        s += '<g class="nuage-centre" transform="translate(' + cx + ' ' + cy + ')"><g class="flotte">' + forme(1.65) + '<use href="#oeil" x="-26" y="-14" width="48" height="32"/></g></g>';
        liste.forEach(function (r, i) {
            var a = r.dernier.affinite, cat = categorie(r);
            var force = typeof a === 'number' ? Math.abs(a) : 1;
            var k = typeof a === 'number' ? 1 - (a + 3) / 6 * .5 : .85;
            if (r.mort) k = Math.min(1, k + .12);
            var ang = -Math.PI / 2 + i * 2 * Math.PI / N + (N === 1 ? .7 : 0);
            var x = cx + RX * k * Math.cos(ang), y = cy + RY * k * Math.sin(ang);
            var nom = r.nom.length > 13 ? r.nom.slice(0, 12) + '…' : r.nom;
            s += '<g class="noeud ' + cat + '" data-rel="' + esc(r.nom) + '" tabindex="0" role="button" aria-label="' + esc(r.nom) + ' : voir l\'évolution" style="--i:' + i + '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' +
                '<g class="flotte">' + forme(1 + force * .1) + '<text class="etiq" y="6" text-anchor="middle">' + esc(nom) + '</text></g></g>';
        });
        return s + '</svg><p class="note-ciel">Plus un nuage est proche de lui, plus le lien est fort. <span class="l-pos">■</span> clair : apprécié · <span class="l-neu">■</span> bleuté : neutre · <span class="l-neg">■</span> orageux : aversion · <span class="l-mort">■</span> pâle : décédé(e). Touche un nuage pour voir l\'évolution.</p>';
    }

    function relationsListe(c) {
        if (REL.vue === 'ciel') return ciel(c);
        var liste = relationsFiltrees(c);
        if (!liste.length) return vide('Aucune relation ne correspond.');
        return '<ul class="fils-rel">' + liste.map(function (r) {
            return '<li><button type="button" class="relation" data-rel="' + esc(r.nom) + '" aria-label="Voir l\'évolution de la relation avec ' + esc(r.nom) + '">' +
                O.avatar(r.nom, r.photo, 'grand') + '<span class="rel-corps"><span class="rel-tete"><strong>' + esc(r.nom) + '</strong>' + tendance(r) + '</span>' +
                '<span class="role">' + esc([r.role, r.clan].filter(Boolean).join(' · ')) + '</span>' +
                '<span class="rel-coeurs">' + O.coeursAvis(r.dernier, r) + O.courbe(r.avis) + '</span>' +
                (r.dernier.texte ? '<span class="rel-extrait">' + esc(r.dernier.texte) + '</span>' : '') +
                '<span class="rel-nb">' + r.avis.length + ' avis · voir l\'évolution</span></span></button></li>';
        }).join('') + '</ul>';
    }
    function relations(c) {
        var tout = rels(c);
        var legende = '<div class="legende"><span>' + O.icone('coeur') + O.icone('coeur') + O.icone('coeur') + ' Appréciation</span><span>' + O.icone('sombre') + O.icone('sombre') + O.icone('sombre') +
            ' Aversion</span><span>' + O.icone('coeur') + O.icone('sombre') + ' Neutre / mitigé</span><span>' + O.icone('etoile') + ' Respect</span><span>' + O.icone('crane') + ' Décédé(e)</span></div>';
        var evol = evolutions(c).filter(function (e) { return e.prev; }).slice(0, 4);
        var recent = evol.length ? '<aside class="recent"><h2>Derniers changements</h2><ul>' + evol.map(function (e) {
            return '<li><b>' + esc(e.rel.nom) + '</b> <small>' + esc(O.lune(e.avis.lune)) + '</small><span>' + O.coeursAvis(e.prev, e.rel) + ' → ' + O.coeursAvis(e.avis, e.rel) + '</span></li>';
        }).join('') + '</ul></aside>' : '';
        return titre('Réseau de relations', tout.length + ' relation' + (tout.length > 1 ? 's' : '') + ' suivie' + (tout.length > 1 ? 's' : '') + ' — de tous les clans, groupes et rangs') +
            recent + '<div id="rel-filtres">' + relationsFiltres(c) + '</div>' +
            '<label class="recherche"><span class="sr">Rechercher</span><input type="search" id="rel-q" placeholder="Rechercher un chat, un rôle, un clan…" value="' + esc(REL.q) + '"></label>' +
            '<div id="rel-liste">' + relationsListe(c) + '</div>' + legende;
    }
    function fenetreRelation(nom) {
        var r = rels(DONNEES).filter(function (x) { return x.nom === nom; })[0];
        if (!r) return;
        var chrono = r.avis.map(function (a, i) {
            var prev = r.avis[i - 1], d = prev && typeof a.affinite === 'number' && typeof prev.affinite === 'number' ? a.affinite - prev.affinite : 0;
            return '<li><div class="entete-ev"><strong>' + esc(O.lune(a.lune) || 'Date inconnue') + '</strong><span>' + O.coeursAvis(a, r) +
                (d ? '<span class="tend ' + (d > 0 ? 'monte' : 'descend') + '">' + (d > 0 ? '▲' : '▼') + '</span>' : '') + '</span></div>' +
                (a.texte ? '<p>' + riche(a.texte) + '</p>' : '') + '</li>';
        }).reverse().join('');
        var courbeGrande = O.courbe(r.avis, true);
        $('fenetre-corps').innerHTML = '<header class="fen-tete">' + O.avatar(r.nom, r.photo, 'grand') + '<div><h2>' + esc(r.nom) + '</h2><span class="role">' +
            esc([r.role, r.clan, r.joueur].filter(Boolean).join(' · ')) + '</span></div></header>' +
            (courbeGrande ? '<h3>Évolution de l\'affinité</h3>' + courbeGrande : '') +
            '<h3>Historique des avis</h3><ol class="chrono compact">' + (chrono || '<li>Aucun avis noté.</li>') + '</ol>';
        O.avatars($('fenetre-corps'));
        var f = $('fenetre');
        if (f.showModal) { if (!f.open) f.showModal(); } else f.setAttribute('open', '');
    }

    /* ---------- Jouer : guide de rôle-play ---------- */
    var STATUTS_RP = { ouvert: 'Ouvert aux fils', selectif: 'Sélectif', ferme: 'Complet / fermé' };
    function jouer(c) {
        var j = c.jouer || {};
        var st = j.statut || 'ouvert';
        return titre('Jouer avec Nuage Blanc', j.intro) +
            '<section class="dispo-boite ' + esc(st) + '"><span class="dispo ' + esc(st) + '">' + esc(STATUTS_RP[st] || st) + '</span>' +
            (j.statutTexte ? '<p>' + riche(j.statutTexte) + '</p>' : '') + (j.contact ? '<small>' + esc(j.contact) + '</small>' : '') + '</section>' +
            '<h2 class="titre-section">Comment l\'aborder</h2>' + traits(j.aborder) +
            '<div class="duo mt">' + bloc('aime', 'Ce qu\'il accepte', j.accepte) + bloc('aimepas', 'Ce qu\'il refuse', j.refuse) + '</div>' +
            '<h2 class="titre-section">Idées de rencontres</h2>' + traits(j.accroches, 'idees') +
            (j.notes ? '<aside class="encart mt">' + riche(j.notes) + '</aside>' : '') +
            '<a class="ligne-lien grand" href="#histoire/fils"><h3>Ses fils de rôle-play</h3><p>Les aventures déjà jouées, avec les liens Discord.</p><span aria-hidden="true">→</span></a>';
    }

    /* ---------- Galerie ---------- */
    function galerie(c) {
        return titre('Galerie d\'art', 'Illustrations, croquis et designs') +
            '<ul class="galerie">' + (c.galerie || []).map(function (g, i) {
                return '<li><button type="button" data-img="' + i + '" aria-label="Agrandir : ' + esc(g.titre) + '">' +
                    '<img src="' + O.miniature(g.fichier) + '" alt="' + esc(g.alt || g.titre) + '" loading="lazy" decoding="async">' +
                    (g.etiquette ? '<span class="badge">' + esc(g.etiquette) + '</span>' : '') + '</button>' +
                    '<div><h3>' + esc(g.titre) + '</h3><p>' + esc(g.texte || '') + '</p>' + (g.auteur ? '<small>' + esc(g.auteur) + '</small>' : '') + '</div></li>';
            }).join('') + '</ul>';
    }

    var VUES = { 'accueil/accueil': accueil, 'lui/noms': noms, 'lui/caractere': caractere, 'lui/physique': physique, 'lui/voix': voix, 'lui/aptitudes': aptitudes, 'lui/sante': sante,
        'histoire/chroniques': chroniques, 'histoire/parcours': parcours, 'histoire/fils': fils, 'entourage/lignee': lignee, 'entourage/relations': relations,
        'jouer/accroches': jouer, 'galerie/galerie': galerie };

    /* ---------- Routage ---------- */
    function route() {
        var h = location.hash.replace(/^#\/?/, '').split('/');
        var page = PAGES.filter(function (p) { return p.id === h[0]; })[0] || PAGES[0];
        var sub = page.subs.filter(function (s) { return s[0] === h[1]; })[0] || page.subs[0];
        return { page: page, sub: sub[0], cle: page.id + '/' + sub[0] };
    }
    function hrefPage(p) { return '#' + p.id + (p.subs.length > 1 ? '/' + p.subs[0][0] : ''); }

    function menu(r) {
        function cur(p) { return p.id === r.page.id ? ' aria-current="page"' : ''; }
        $('menu').innerHTML = PAGES.map(function (p) { return '<a href="' + hrefPage(p) + '"' + cur(p) + '>' + p.nom + '</a>'; }).join('');
        $('volet-nav').innerHTML = PAGES.map(function (p, i) {
            return '<section class="volet-bloc"><a class="volet-titre" href="' + hrefPage(p) + '"' + cur(p) + '><small>0' + (i + 1) + '</small><span>' + p.nom + '</span></a><p>' + esc(p.desc) + '</p>' +
                (p.subs.length > 1 ? '<div class="volet-subs">' + p.subs.map(function (s) { return '<a href="#' + p.id + '/' + s[0] + '">' + s[1] + '</a>'; }).join('') + '</div>' : '') + '</section>';
        }).join('');
        var sous = $('sous');
        if (r.page.subs.length > 1) {
            sous.hidden = false;
            sous.innerHTML = r.page.subs.map(function (s) {
                return '<a href="#' + r.page.id + '/' + s[0] + '"' + (s[0] === r.sub ? ' aria-current="page"' : '') + '>' + s[1] + '</a>';
            }).join('');
        } else sous.hidden = true;
    }

    /* ---------- Grand menu plein écran ---------- */
    function volet(ouvrir) {
        $('volet').hidden = !ouvrir;
        $('burger').setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
        $('burger').querySelector('span').textContent = ouvrir ? 'Fermer' : 'Menu';
        document.body.classList.toggle('volet-ouvert', ouvrir);
    }
    $('burger').addEventListener('click', function () { volet($('volet').hidden); });
    $('volet').addEventListener('click', function (e) { if (e.target.closest('a') || e.target === $('volet')) volet(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('volet').hidden) volet(false); });
    window.addEventListener('hashchange', function () { if (!$('volet').hidden) volet(false); });

    function pagination(cle) {
        var i = ORDRE.indexOf(cle);
        return '<nav class="pagination" aria-label="Pages voisines">' +
            (i > 0 ? '<a href="#' + ORDRE[i - 1] + '" rel="prev"><small>Précédent</small>← ' + nomPage(ORDRE[i - 1]) + '</a>' : '<span></span>') +
            (i < ORDRE.length - 1 ? '<a href="#' + ORDRE[i + 1] + '" rel="next"><small>Suivant</small>' + nomPage(ORDRE[i + 1]) + ' →</a>' : '<span></span>') + '</nav>';
    }

    function afficher(saut) {
        if (!DONNEES) return;
        var r = route(), c = DONNEES, na = nomActuel(c);
        document.title = (r.cle === 'accueil/accueil' ? '' : nomPage(r.cle) + ' · ') + na.nom + ' — ' + ((c.fiche || {}).clan || '');
        $('marque-nom').textContent = na.nom;
        $('pied').textContent = (c.fiche || {}).pied || '';
        menu(r);
        RUB = r.page.subs.length > 1 ? r.page.nom + ' — ' + nomPage(r.cle) : r.page.nom;
        var vue = $('vue');
        vue.className = 'vue v-' + r.page.id;
        vue.innerHTML = VUES[r.cle](c) + (r.cle === 'accueil/accueil' ? '' : pagination(r.cle));
        O.avatars(vue);
        reveler(vue);
        if (saut) {
            $('principal').focus({ preventScroll: true });
            window.scrollTo({ top: 0 });
            var actif = $('sous').querySelector('[aria-current]');
            if (actif && actif.scrollIntoView) actif.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
    }
    window.addEventListener('hashchange', function () { afficher(true); });

    /* ---------- Interactions (délégation : survit aux mises à jour) ---------- */
    $('principal').addEventListener('click', function (e) {
        var b;
        if ((b = e.target.closest('[data-fil]'))) { FIL.f = b.dataset.fil; afficher(); return; }
        if ((b = e.target.closest('[data-parc]'))) { PARC.f = b.dataset.parc; afficher(); return; }
        if ((b = e.target.closest('[data-sante]'))) { SANTE.f = b.dataset.sante; afficher(); return; }
        if ((b = e.target.closest('[data-chap]'))) { CHAP.i = Number(b.dataset.chap); afficher(); if (b.className.indexOf('btn') >= 0) window.scrollTo({ top: 0 }); return; }
        if ((b = e.target.closest('[data-chap-lien]'))) { CHAP.i = Number(b.dataset.chapLien); return; }   // le lien change ensuite la page
        if ((b = e.target.closest('[data-vue]'))) { REL.vue = b.dataset.vue; majRelations(); return; }
        if ((b = e.target.closest('[data-clan]'))) { REL.clan = b.dataset.clan; majRelations(); return; }
        if ((b = e.target.closest('[data-aff]'))) { REL.aff = b.dataset.aff; majRelations(); return; }
        if ((b = e.target.closest('[data-rel]'))) { fenetreRelation(b.dataset.rel); return; }
        if ((b = e.target.closest('[data-img]')) && DONNEES) ouvrirImage(Number(b.dataset.img), true);
        if ((b = e.target.closest('figure.figure img, figure.en-pied img'))) ouvrirUrl(b.src, b.alt);
    });
    // Touche Entrée / Espace sur un nuage du ciel
    $('principal').addEventListener('keydown', function (e) {
        var n = e.target.closest && e.target.closest('g[data-rel]');
        if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fenetreRelation(n.dataset.rel); }
    });

    /* ---------- Visionneuse d'images (flèches ← → du clavier ou boutons) ---------- */
    var IMG = { i: 0 };
    function ouvrirUrl(src, legende) {
        var v = $('visionneuse');
        v.querySelector('img').src = src;
        v.querySelector('img').alt = legende || '';
        v.querySelector('p').textContent = legende || '';
        v.classList.add('seule');
        if (v.showModal) { if (!v.open) v.showModal(); } else v.setAttribute('open', '');
    }
    function ouvrirImage(i, ouvrir) {
        var g = (DONNEES && DONNEES.galerie) || [];
        if (!g.length) return;
        IMG.i = (i + g.length) % g.length;
        var it = g[IMG.i], v = $('visionneuse');
        v.classList.remove('seule');
        v.querySelector('img').src = O.url(it.fichier);
        v.querySelector('img').alt = it.alt || it.titre || '';
        v.querySelector('p').textContent = (it.titre || '') + (it.auteur ? ' — ' + it.auteur : '') + '  ·  ' + (IMG.i + 1) + ' / ' + g.length;
        if (ouvrir) { if (v.showModal) v.showModal(); else v.setAttribute('open', ''); }
    }
    $('visionneuse').addEventListener('click', function (e) {
        if (e.target.closest('.prec')) ouvrirImage(IMG.i - 1);
        else if (e.target.closest('.suiv')) ouvrirImage(IMG.i + 1);
    });
    document.addEventListener('keydown', function (e) {
        if (!$('visionneuse').open || $('visionneuse').classList.contains('seule')) return;
        if (e.key === 'ArrowLeft') ouvrirImage(IMG.i - 1);
        if (e.key === 'ArrowRight') ouvrirImage(IMG.i + 1);
    });

    /* ---------- Recherche rapide (touche /, Ctrl+K ou la loupe) ---------- */
    var REC = { items: [], sel: 0 };
    function sansAccent(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
    function indexRecherche() {
        var c = DONNEES, it = [];
        PAGES.forEach(function (p) { p.subs.forEach(function (s) {
            it.push({ t: s[1], d: p.nom === s[1] ? 'Page' : p.nom, h: '#' + p.id + '/' + s[0] });
        }); });
        ((c.histoire || {}).chapitres || []).forEach(function (x, i) { it.push({ t: x.titre, d: 'Chapitre ' + (i + 1), h: '#histoire/chroniques', chap: i }); });
        (c.fils || []).forEach(function (x) { it.push({ t: x.titre, d: 'Fil RP', h: '#histoire/fils' }); });
        (c.relations || []).forEach(function (x) { it.push({ t: x.nom, d: 'Relation' + (x.role ? ' · ' + x.role : ''), h: '#entourage/relations', rel: x.nom }); });
        ((c.genealogie || {}).groupes || []).forEach(function (g) { (g.membres || []).forEach(function (m) { if (m.statut !== 'vide') it.push({ t: m.nom, d: 'Lignée · ' + (m.role || g.titre), h: '#entourage/lignee' }); }); });
        ((c.personnalite || {}).qualites || []).concat((c.personnalite || {}).defauts || []).forEach(function (x) { it.push({ t: x.nom, d: 'Caractère', h: '#lui/caractere' }); });
        (c.galerie || []).forEach(function (x, i) { it.push({ t: x.titre, d: 'Galerie', h: '#galerie/galerie' }); });
        it.forEach(function (x) { x.k = sansAccent(x.t + ' ' + x.d); });
        return it;
    }
    function listeRecherche() {
        var q = sansAccent($('recherche-q').value).trim();
        var res = REC.items.filter(function (x) { return !q || x.k.indexOf(q) >= 0; }).slice(0, 9);
        REC.res = res;
        if (REC.sel >= res.length) REC.sel = 0;
        $('recherche-liste').innerHTML = res.length ? res.map(function (x, i) {
            return '<li role="option" data-i="' + i + '" aria-selected="' + (i === REC.sel) + '"><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></li>';
        }).join('') : '<li class="rien">Aucun résultat</li>';
    }
    function ouvrirRecherche() {
        if (!DONNEES) return;
        REC.items = indexRecherche(); REC.sel = 0;
        var d = $('recherche');
        $('recherche-q').value = '';
        listeRecherche();
        if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
        $('recherche-q').focus();
    }
    function allerA(x) {
        $('recherche').close();
        if (x.chap != null) CHAP.i = x.chap;
        var meme = location.hash === x.h;
        if (meme) afficher(true); else location.hash = x.h;
        if (x.rel) setTimeout(function () { fenetreRelation(x.rel); }, 60);
    }
    $('chercher').addEventListener('click', ouvrirRecherche);
    $('recherche-q').addEventListener('input', function () { REC.sel = 0; listeRecherche(); });
    $('recherche-q').addEventListener('keydown', function (e) {
        var n = (REC.res || []).length;
        if (e.key === 'ArrowDown') { e.preventDefault(); REC.sel = (REC.sel + 1) % Math.max(n, 1); listeRecherche(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); REC.sel = (REC.sel - 1 + n) % Math.max(n, 1); listeRecherche(); }
        else if (e.key === 'Enter' && REC.res[REC.sel]) { e.preventDefault(); allerA(REC.res[REC.sel]); }
    });
    $('recherche-liste').addEventListener('click', function (e) {
        var li = e.target.closest('li[data-i]');
        if (li) allerA(REC.res[Number(li.dataset.i)]);
    });
    document.addEventListener('keydown', function (e) {
        var t = e.target, saisie = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if ((e.key === '/' && !saisie && !e.ctrlKey && !e.metaKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
            e.preventDefault(); ouvrirRecherche();
        }
    });

    /* ---------- Animations : apparition au défilement, progression de lecture ---------- */
    var CIBLES = '.entete, .exergue, .motscles li, .jauge, .nuancier li, .apercu > div, .pliant, .traits li, .frise li, .membre, .relation, .fil-rp, .chrono > li, ' +
        '.parcours > li, .galerie li, .mini, .carte-lien, .texte > *, .groupe-lune, .chapitre > header, .recent, .etat, .hero-texte > *, .titre-section, .legende, .puces, .replique, .dispo-boite, .role-clan, .en-pied, .fiche > div, .ligne-lien, .debut li';
    var OBS = null;
    function reveler(racine) {
        if (!('IntersectionObserver' in window) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
        if (OBS) OBS.disconnect();
        OBS = new IntersectionObserver(function (entrees) {
            entrees.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('vu'); OBS.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
        Array.prototype.forEach.call(racine.querySelectorAll(CIBLES), function (el) {
            var frere = Array.prototype.indexOf.call(el.parentNode.children, el);
            el.style.setProperty('--i', Math.min(frere, 8));
            el.classList.add('rv');
            OBS.observe(el);
        });
        // Filet de sécurité : si l'observateur n'a rien montré (onglet en arrière-plan…), on affiche ce qui est à l'écran
        clearTimeout(reveler.filet);
        reveler.filet = setTimeout(function () {
            Array.prototype.forEach.call(racine.querySelectorAll('.rv:not(.vu)'), function (el) {
                if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('vu'); if (OBS) OBS.unobserve(el); }
            });
        }, 1500);
    }

    var barre = $('progression'), remonter = $('remonter'), attente = false;
    function defilement() {
        attente = false;
        var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        barre.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
        remonter.classList.toggle('visible', window.scrollY > 700);
    }
    window.addEventListener('scroll', function () { if (!attente) { attente = true; requestAnimationFrame(defilement); } }, { passive: true });
    remonter.addEventListener('click', function () { window.scrollTo({ top: 0 }); });

    /* ---------- Le regard : la pupille du logo suit le pointeur (souris uniquement) ---------- */
    var halo = $('ciel'), oeil = document.querySelector('.oeil-logo'), attenteOeil = false, dernierPointeur = null;
    function suivreRegard() {
        attenteOeil = false;
        var e = dernierPointeur;
        if (!e || !oeil) return;
        var r = oeil.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / 220, dy = (e.clientY - (r.top + r.height / 2)) / 220;
        var n = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, n) / n;
        oeil.style.setProperty('--px', (dx * k * 10).toFixed(2) + 'px');
        oeil.style.setProperty('--py', (dy * k * 3.5).toFixed(2) + 'px');
        halo.style.setProperty('--mx', e.clientX + 'px');
        halo.style.setProperty('--my', e.clientY + 'px');
    }
    // Le portrait suit doucement le pointeur, lui aussi
    $('principal').addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var h = e.target.closest && e.target.closest('.hero-image'), cadre = document.querySelector('.cadre');
        if (!cadre) return;
        if (!h) { cadre.style.removeProperty('--rx'); cadre.style.removeProperty('--ry'); return; }
        var r = h.getBoundingClientRect();
        cadre.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + 'deg');
        cadre.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -8).toFixed(2) + 'deg');
    });
    window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        dernierPointeur = e;
        if (!attenteOeil) { attenteOeil = true; requestAnimationFrame(suivreRegard); }
    }, { passive: true });

    /* ---------- Thème : nuit / brume ---------- */
    $('theme').addEventListener('click', function () {
        var brume = document.documentElement.getAttribute('data-theme') !== 'brume';
        document.documentElement.setAttribute('data-theme', brume ? 'brume' : 'nuit');
        try { localStorage.setItem('nubes-theme', brume ? 'brume' : 'nuit'); } catch (e) {}
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', brume ? '#eef3f8' : '#0a1220');
        $('theme').setAttribute('aria-pressed', brume);
    });
    $('theme').setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'brume');
    $('principal').addEventListener('input', function (e) {
        if (e.target.id === 'rel-q') { REL.q = e.target.value; $('rel-liste').innerHTML = relationsListe(DONNEES); O.avatars($('rel-liste')); }
    });
    function majRelations() {
        $('rel-filtres').innerHTML = relationsFiltres(DONNEES);
        $('rel-liste').innerHTML = relationsListe(DONNEES);
        O.avatars($('rel-liste'));
    }
    ['visionneuse', 'fenetre', 'recherche'].forEach(function (id) {
        var d = $(id);
        d.addEventListener('click', function (e) { if (e.target === d || e.target.className === 'fermer') d.close(); });
    });

    window.Donnees.charger(function (c) { DONNEES = c; afficher(); });
})();
