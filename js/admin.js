/* ==========================================================================
   DASHBOARD — connexion Discord + éditeur de contenus.
   Pour ajouter une rubrique modifiable : une entrée dans RUBRIQUES, et la même clé
   dans js/data/contenu.js (valeur de départ) puis `npm run schema`.
   ========================================================================== */
(function () {
    'use strict';

    var C = window.SITE_CONFIG;
    var O = window.Outils;

    /* ---------- Description des formulaires ----------
       t : text | area | select | bool | image | liste | groupe
       k : nom du champ      l : libellé      aide : petite explication */

    var STATUTS = [['vivant', 'Vivant(e)'], ['decede', 'Décédé(e)'], ['disparu', 'Disparu(e)'], ['vide', 'Emplacement vide']];
    var NIVEAUX = [[0, '0 sur 5'], [1, '1 sur 5'], [2, '2 sur 5'], [3, '3 sur 5'], [4, '4 sur 5'], [5, '5 sur 5']];
    var AFFINITES = [
        ['', 'Aucun cœur'], [3, 'Très apprécié (3 cœurs)'], [2, 'Apprécié (2 cœurs)'], [1, 'Un peu apprécié (1 cœur)'],
        [0, 'Neutre'], [-1, 'Un peu d’aversion (1 cœur sombre)'], [-2, 'Aversion (2 cœurs sombres)'], [-3, 'Forte aversion (3 cœurs sombres)']];

    var NOM_TEXTE = [{ k: 'nom', t: 'text', l: 'Titre' }, { k: 'texte', t: 'area', l: 'Texte' }];
    function coupe(s) { s = s || ''; return s.replace(/<[^>]+>/g, '').slice(0, 70) + (s.length > 70 ? '…' : ''); }
    var TYPES_BLOC = [['', 'Paragraphe'], ['intertitre', 'Intertitre (petit titre)'], ['citation', 'Citation mise en valeur'],
        ['encart', 'Encart « À retenir »'], ['image', 'Image'], ['separateur', 'Séparateur ✦']];
    function PARAGRAPHES(cle, libelle) {
        return {
            k: cle, t: 'liste', l: libelle, ajout: 'Ajouter un bloc de texte',
            lib: function (o) {
                var t = TYPES_BLOC.filter(function (x) { return x[0] === (o.type || ''); })[0];
                return (o.type ? '[' + t[1].split(' ')[0] + '] ' : '') + (o.type === 'separateur' ? '✦ ✦ ✦' : coupe(o.texte || (o.image ? '(image)' : '')));
            },
            item: [
                { k: 'type', t: 'select', l: 'Type de bloc', opts: TYPES_BLOC, aide: 'Intertitres, citations et encarts aèrent un long texte.' },
                { k: 'texte', t: 'area', l: 'Texte', si: { k: 'type', pas: ['separateur'] } },
                { k: 'image', t: 'image', l: 'Image (le texte devient sa légende)', si: { k: 'type', est: ['image'] } }
            ]
        };
    }
    function TRAITS(cle, libelle, ajout) {
        return { k: cle, t: 'liste', l: libelle, ajout: ajout, lib: function (o) { return o.nom; }, item: NOM_TEXTE };
    }

    // Clans / groupes déjà saisis, proposés à l'écriture (pour écrire toujours pareil)
    function clansConnus() {
        var vus = [];
        ((donnees.relations && donnees.relations.liste) || []).forEach(function (r) { if (r.clan && vus.indexOf(r.clan) < 0) vus.push(r.clan); });
        return vus;
    }

    var RUBRIQUES = [
        {
            cle: 'fiche', nom: 'Fiche & accueil', defaut: 'fiche',
            aide: 'Le bandeau de l\'accueil : clan, devise, informations rapides, points de vie / d\'attaque, pied de page.',
            champs: [
                { k: 'clan', t: 'text', l: 'Clan' },
                { k: 'devise', t: 'text', l: 'Devise (sous le nom)' },
                { k: 'accroche', t: 'area', l: 'Phrase d\'accroche (accueil)' },
                { k: 'portrait', t: 'image', l: 'Portrait de l\'accueil', aide: 'Idéalement un gros plan, fond transparent (il est affiché dans un disque de lune)' },
                { k: 'pv', t: 'text', l: 'Points de vie (PV)', aide: 'Ex. 50' },
                { k: 'pa', t: 'text', l: 'Points d\'attaque (PA)', aide: 'Ex. 5' },
                { k: 'pied', t: 'text', l: 'Pied de page' },
                { k: 'lignes', t: 'liste', l: 'Informations rapides', ajout: 'Ajouter une ligne', lib: function (o) { return o.label + ' : ' + (o.valeur || ''); },
                  item: [{ k: 'label', t: 'text', l: 'Intitulé' }, { k: 'valeur', t: 'text', l: 'Valeur' }] }
            ]
        },
        {
            cle: 'noms', nom: 'Identité & noms', defaut: 'noms', racineListe: true,
            aide: 'Les noms successifs. Dans chaque nom, le bouton « Définir comme nom actuel » choisit celui qu\'il porte maintenant : il remplace le nom affiché partout sur le site (par exemple au passage à guerrier).',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter un nom', lib: function (o) { return (o.actuel ? '★ ' : '') + (o.etape || '') + ' · ' + (o.nom || '') + (o.actuel ? ' (nom actuel)' : ''); },
                item: [
                    { k: 'actuel', t: 'exclusif', l: 'Nom porté actuellement' },
                    { k: 'etape', t: 'text', l: 'Étape', aide: 'Ex. Nom d\'apprenti' },
                    { k: 'nom', t: 'text', l: 'Nom' },
                    { k: 'periode', t: 'text', l: 'Période', aide: 'Ex. 0 à 35 lunes, ou depuis 35 lunes' },
                    { k: 'citation', t: 'area', l: 'Texte (facultatif)' },
                    { k: 'note', t: 'text', l: 'Remarque (facultatif)' }
                ]
            }]
        },
        {
            cle: 'personnalite', nom: 'Personnalité', defaut: 'personnalite',
            aide: 'Description, qualités, défauts, goûts, peurs, habitudes.',
            champs: [
                { k: 'citation', t: 'area', l: 'Citation d\'ouverture', aide: 'Grande phrase mise en valeur en haut de la page' },
                { k: 'motscles', t: 'liste', l: 'Mots-clés (en un coup d\'œil)', ajout: 'Ajouter un mot', lib: function (o) { return o.texte; }, item: [{ k: 'texte', t: 'text', l: 'Mot' }] },
                { k: 'jauges', t: 'liste', l: 'Son profil (jauges)', ajout: 'Ajouter une jauge', lib: function (o) { return o.nom + ' (' + (o.niveau == null ? 0 : o.niveau) + '/5)'; },
                  item: [{ k: 'nom', t: 'text', l: 'Trait' }, { k: 'niveau', t: 'select', num: true, l: 'Niveau', opts: NIVEAUX }] },
                PARAGRAPHES('paragraphes', 'Description globale'),
                TRAITS('qualites', 'Qualités', 'Ajouter une qualité'),
                TRAITS('defauts', 'Défauts', 'Ajouter un défaut'),
                TRAITS('aime', 'Il aime', 'Ajouter un goût'),
                TRAITS('aimepas', 'Il n\'aime pas', 'Ajouter un dégoût'),
                { k: 'gouts_note', t: 'text', l: 'Remarque sous les goûts' },
                PARAGRAPHES('peurs', 'Peurs & phobies'),
                TRAITS('habitudes', 'Habitudes & tics', 'Ajouter une habitude')
            ]
        },
        {
            cle: 'voix', nom: 'Voix', defaut: 'voix',
            aide: 'Sa façon de parler, pour que tes partenaires de RP écrivent ses répliques sans fausse note.',
            champs: [
                PARAGRAPHES('intro', 'Description de sa voix'),
                TRAITS('tics', 'Tics de langage', 'Ajouter un tic'),
                { k: 'repliques', t: 'liste', l: 'Répliques dans le ton', ajout: 'Ajouter une réplique', lib: function (o) { return coupe(o.texte); },
                  item: [{ k: 'texte', t: 'area', l: 'Réplique' }, { k: 'contexte', t: 'text', l: 'Contexte', aide: 'Ex. première rencontre' }] }
            ]
        },
        {
            cle: 'apparence', nom: 'Apparence', defaut: 'apparence',
            aide: 'Description physique, palette, points forts et faibles, marques.',
            champs: [
                { k: 'image', t: 'image', l: 'Illustration en pied', aide: 'Affichée en haut de la page Physique' },
                { k: 'apercu', t: 'liste', l: 'En un coup d\'œil', ajout: 'Ajouter une ligne', lib: function (o) { return o.label + ' : ' + (o.valeur || ''); },
                  item: [{ k: 'label', t: 'text', l: 'Intitulé', aide: 'Ex. Pelage' }, { k: 'valeur', t: 'text', l: 'Valeur' }] },
                { k: 'palette', t: 'liste', l: 'Palette du pelage', ajout: 'Ajouter une couleur', lib: function (o) { return o.nom + ' ' + (o.hex || ''); },
                  item: [{ k: 'nom', t: 'text', l: 'Nom de la couleur' }, { k: 'hex', t: 'couleur', l: 'Couleur' }] },
                PARAGRAPHES('paragraphes', 'Description globale'),
                TRAITS('forts', 'Points forts', 'Ajouter un point fort'),
                TRAITS('faibles', 'Points faibles', 'Ajouter un point faible'),
                { k: 'marques', t: 'liste', l: 'Marques & attributs', ajout: 'Ajouter une marque', lib: function (o) { return o.nom; },
                  item: [{ k: 'nom', t: 'text', l: 'Titre' }, { k: 'texte', t: 'text', l: 'Valeur', aide: 'Ex. Aucune' }, { k: 'note', t: 'text', l: 'Remarque' }] }
            ]
        },
        {
            cle: 'aptitudes', nom: 'Aptitudes', defaut: 'aptitudes',
            aide: 'Son rôle au clan et ses compétences, notées de 0 à 5.',
            champs: [
                { k: 'role', t: 'text', l: 'Rôle au clan', aide: 'Ex. Guerrier de la nuit' },
                { k: 'roleTexte', t: 'area', l: 'Description du rôle' },
                { k: 'competences', t: 'liste', l: 'Compétences', ajout: 'Ajouter une compétence', lib: function (o) { return (o.nom || '') + ' (' + (o.niveau == null ? 0 : o.niveau) + '/5)'; },
                  item: [{ k: 'nom', t: 'text', l: 'Compétence' }, { k: 'niveau', t: 'select', num: true, l: 'Niveau', opts: NIVEAUX }, { k: 'note', t: 'text', l: 'Précision (facultatif)' }] }
            ]
        },
        {
            cle: 'histoire', nom: 'Histoire', defaut: 'histoire',
            aide: 'Un chapitre par grande période de sa vie. Le champ « Âge » sert aussi à placer le chapitre dans la frise « Parcours ».',
            champs: [{
                k: 'chapitres', t: 'liste', ajout: 'Ajouter un chapitre', lib: function (o) { return (o.age ? o.age + ' · ' : '') + (o.titre || ''); },
                item: [
                    { k: 'titre', t: 'text', l: 'Titre du chapitre' },
                    { k: 'age', t: 'text', l: 'Âge', aide: 'Ex. 22 lunes' },
                    { k: 'avenir', t: 'bool', l: 'Chapitre à venir (affiché en pointillés)' },
                    PARAGRAPHES('paragraphes', 'Texte'),
                    { k: 'citation', t: 'area', l: 'Encart final (facultatif)' }
                ]
            }]
        },
        {
            cle: 'genealogie', nom: 'Généalogie', defaut: 'genealogie',
            aide: 'Groupes de famille, puis les chats de chaque groupe.',
            champs: [
                { k: 'origine', t: 'text', l: 'Origine', aide: 'Phrase sous le titre de la page' },
                {
                    k: 'groupes', t: 'liste', ajout: 'Ajouter un groupe', lib: function (o) { return o.titre || '(groupe)'; },
                    item: [
                        { k: 'titre', t: 'text', l: 'Titre du groupe' },
                        {
                            k: 'membres', t: 'liste', ajout: 'Ajouter un chat', lib: function (o) { return o.nom + (o.role ? ' — ' + o.role : ''); },
                            item: [
                                { k: 'nom', t: 'text', l: 'Nom' },
                                { k: 'role', t: 'text', l: 'Rôle', aide: 'Ex. Mère (PNJ)' },
                                { k: 'statut', t: 'select', l: 'Statut', opts: STATUTS },
                                { k: 'joueur', t: 'text', l: 'Joueur', aide: 'Ex. @pseudo' },
                                { k: 'tag', t: 'text', l: 'Pastille', aide: 'Ex. PJ' },
                                { k: 'mise', t: 'bool', l: 'Mettre en avant (liseré lumineux)' },
                                { k: 'photo', t: 'image', l: 'Portrait' },
                                { k: 'texte', t: 'area', l: 'Description' }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            cle: 'relations', nom: 'Relations', defaut: 'relations', racineListe: true,
            aide: 'Chaque chat a une fiche et une liste d\'avis datés, du plus ancien au plus récent : c\'est ce qui permet de suivre l\'évolution de la relation.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une relation', lib: function (o) { return o.nom + (o.role ? ' — ' + o.role : ''); },
                item: [
                    { k: 'nom', t: 'text', l: 'Nom' },
                    { k: 'role', t: 'text', l: 'Rôle / rang', aide: 'Ex. Meneur, Guérisseuse, Mentore' },
                    { k: 'clan', t: 'text', l: 'Clan / groupe', aide: 'Sert de filtre sur le site. Laisser vide = « Sans clan »', suggere: clansConnus },
                    { k: 'joueur', t: 'text', l: 'Joueur', aide: 'Ex. @pseudo ou PNJ' },
                    { k: 'photo', t: 'image', l: 'Portrait' },
                    { k: 'mort', t: 'bool', l: 'Décédé(e) (affiche un crâne)' },
                    {
                        k: 'avis', t: 'liste', l: 'Évolution de son avis (du plus ancien au plus récent)', ajout: 'Ajouter un avis',
                        lib: function (o) {
                            var a = AFFINITES.filter(function (x) { return String(x[0]) === String(o.affinite == null ? '' : o.affinite); })[0];
                            return (o.lune != null && o.lune !== '' ? O.lune(o.lune) : 'Lune ?') + ' · ' + (a ? a[1] : '');
                        },
                        item: [
                            { k: 'lune', t: 'number', l: 'À quelle lune ?', aide: 'Son âge à ce moment, ex. 36' },
                            { k: 'affinite', t: 'select', num: true, l: 'Affinité', opts: AFFINITES },
                            { k: 'mitige', t: 'bool', l: 'Mitigé (ajoute un cœur sombre)' },
                            { k: 'respect', t: 'bool', l: 'Respect (étoile)' },
                            { k: 'texte', t: 'area', l: 'Appréciation', aide: 'Ce qu\'il pense de ce chat à ce moment' }
                        ]
                    }
                ]
            }]
        },
        {
            cle: 'fils', nom: 'Fils RP', defaut: 'fils', racineListe: true,
            aide: 'Le suivi des fils de jeu de rôle. Coche « En cours » tant que le fil n\'est pas terminé.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter un fil', lib: function (o) { return (o.enCours ? '● ' : '') + (o.lune != null && o.lune !== '' ? O.lune(o.lune) + ' · ' : '') + (o.titre || ''); },
                item: [
                    { k: 'titre', t: 'text', l: 'Titre' },
                    { k: 'lune', t: 'number', l: 'Nombre de lunes', aide: 'Son âge pendant le fil, ex. 36' },
                    { k: 'enCours', t: 'bool', l: 'Fil en cours (décoche quand il est terminé)' },
                    { k: 'lien', t: 'text', l: 'Lien du fil Discord', aide: 'Adresse complète, commence par https://' },
                    { k: 'participants', t: 'text', l: 'Participants', aide: 'Les noms séparés par des virgules' },
                    { k: 'description', t: 'area', l: 'Description' }
                ]
            }]
        },
        {
            cle: 'sante', nom: 'Santé', defaut: 'sante', racineListe: true,
            aide: 'L\'historique des blessures et maladies. Passe une entrée en « Guérie » quand elle est soignée.',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une blessure / maladie',
                lib: function (o) { return (o.statut === 'en_cours' ? '● ' : '') + (o.lune != null && o.lune !== '' ? O.lune(o.lune) + ' · ' : '') + (o.titre || ''); },
                item: [
                    { k: 'titre', t: 'text', l: 'Titre', aide: 'Ex. Patte déchirée, Toux verte' },
                    { k: 'type', t: 'select', l: 'Type', opts: [['blessure', 'Blessure'], ['maladie', 'Maladie']] },
                    { k: 'statut', t: 'select', l: 'État', opts: [['en_cours', 'En cours'], ['guerie', 'Guérie'], ['sequelle', 'Guérie avec séquelles / permanente']] },
                    { k: 'gravite', t: 'select', l: 'Gravité', opts: [['', '—'], ['legere', 'Légère'], ['moderee', 'Modérée'], ['grave', 'Grave']] },
                    { k: 'lune', t: 'number', l: 'Lune du début', aide: 'Son âge au moment des faits' },
                    { k: 'fin', t: 'number', l: 'Lune de guérison', aide: 'Laisser vide si en cours' },
                    { k: 'lien', t: 'text', l: 'Lien du fil Discord', aide: 'Facultatif, https://…' },
                    { k: 'description', t: 'area', l: 'Ce qui s\'est passé' },
                    { k: 'soins', t: 'area', l: 'Soins reçus' },
                    { k: 'sequelles', t: 'area', l: 'Séquelles / cicatrices' }
                ]
            }]
        },
        {
            cle: 'jouer', nom: 'Jouer avec lui', defaut: 'jouer',
            aide: 'Le guide pour les partenaires de RP : disponibilité, comment l\'aborder, ce qu\'il accepte ou refuse, idées de rencontres.',
            champs: [
                { k: 'statut', t: 'select', l: 'Disponibilité RP', opts: [['ouvert', 'Ouvert aux fils'], ['selectif', 'Sélectif'], ['ferme', 'Complet / fermé']] },
                { k: 'statutTexte', t: 'text', l: 'Précision sur la disponibilité', aide: 'Affichée sur l\'accueil' },
                { k: 'intro', t: 'text', l: 'Phrase d\'introduction' },
                { k: 'contact', t: 'text', l: 'Comment te contacter' },
                TRAITS('aborder', 'Comment l\'aborder', 'Ajouter un conseil'),
                TRAITS('accepte', 'Ce qu\'il accepte', 'Ajouter un élément'),
                TRAITS('refuse', 'Ce qu\'il refuse', 'Ajouter un élément'),
                TRAITS('accroches', 'Idées de rencontres', 'Ajouter une idée'),
                { k: 'notes', t: 'area', l: 'Note finale (encart)' }
            ]
        },
        {
            cle: 'galerie', nom: 'Galerie', defaut: 'galerie', racineListe: true,
            aide: 'Les illustrations. Une image envoyée est automatiquement allégée (WebP, 1600 px).',
            champs: [{
                k: 'liste', t: 'liste', ajout: 'Ajouter une illustration', lib: function (o) { return (o.titre || 'Illustration') + (o.auteur ? ' — ' + o.auteur : ''); },
                item: [
                    { k: 'fichier', t: 'image', l: 'Image' },
                    { k: 'titre', t: 'text', l: 'Titre' },
                    { k: 'etiquette', t: 'text', l: 'Étiquette', aide: 'Ex. Référence, Artwork' },
                    { k: 'auteur', t: 'text', l: 'Artiste', aide: 'Ex. @pseudo' },
                    { k: 'texte', t: 'area', l: 'Légende' },
                    { k: 'alt', t: 'text', l: 'Description (lecteurs d\'écran)' }
                ]
            }]
        }
    ];

    /* ---------- Petits outils ---------- */
    var $ = function (id) { return document.getElementById(id); };

    function h(tag, props, enfants) {
        var e = document.createElement(tag);
        Object.keys(props || {}).forEach(function (k) {
            if (k === 'class') e.className = props[k];
            else if (k === 'text') e.textContent = props[k];
            else e.setAttribute(k, props[k]);
        });
        (enfants || []).forEach(function (c) { if (c) e.appendChild(c); });
        return e;
    }

    var toastTimer;
    function toast(message, erreur) {
        var t = $('toast');
        t.textContent = message;
        t.className = 'admin-toast visible' + (erreur ? ' erreur' : '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.className = 'admin-toast'; }, erreur ? 6000 : 2600);
    }
    function copie(x) { return JSON.parse(JSON.stringify(x)); }

    /* ---------- État ---------- */
    var client = window.supabase.createClient(C.url, C.cle);
    var donnees = {};
    var modifie = {};
    var courante = null;

    function fixer(obj, k, v) {
        if (v === '' || v === false || v == null) delete obj[k];
        else obj[k] = v;
    }
    var compteur = 0;

    /* ---------- Éditeur de formulaires ---------- */
    function formulaire(defs, obj, change, ctx) {
        var corps = h('div', { class: 'grille-champs' });
        var conteneur = h('div');
        var conditionnels = [];
        function majVis() {
            conditionnels.forEach(function (x) {
                var v = obj[x.d.si.k] || '';
                var ok = x.d.si.est ? x.d.si.est.indexOf(v) >= 0 : x.d.si.pas.indexOf(v) < 0;
                x.champ.style.display = ok ? '' : 'none';
            });
        }
        var changeExt = change;
        change = function () { changeExt(); majVis(); };

        defs.forEach(function (d) {
            var id = 'c' + (++compteur);
            var champ;

            if (d.t === 'liste') {
                if (corps.childNodes.length) conteneur.appendChild(corps);
                conteneur.appendChild(liste(d, obj, change));
                corps = h('div', { class: 'grille-champs' });
                return;
            }

            if (d.t === 'exclusif') {
                var actif = !!obj[d.k];
                var bt = h('button', { type: 'button', class: actif ? 'bouton' : 'bouton-clair', text: actif ? '★ Nom porté actuellement' : 'Définir comme nom actuel' });
                bt.disabled = actif;
                bt.addEventListener('click', function () { obj[d.k] = true; if (ctx && ctx.exclusif) ctx.exclusif(d.k); });
                champ = h('div', { class: 'champ' }, [bt, h('span', { class: 'aide', text: actif ? 'C\'est le nom affiché partout sur le site.' : 'Un seul nom peut être le nom actuel : les autres seront décochés.' })]);
                champ.style.gridColumn = '1 / -1';
            } else if (d.t === 'bool') {
                var cb = h('input', { type: 'checkbox', id: id });
                cb.checked = !!obj[d.k];
                cb.addEventListener('change', function () { fixer(obj, d.k, cb.checked); change(); });
                champ = h('div', { class: 'champ case' }, [cb, h('label', { for: id, text: d.l })]);
            } else {
                var saisie;
                if (d.t === 'area') {
                    saisie = zoneTexte(id, d, obj, change);
                } else if (d.t === 'couleur') {
                    saisie = h('input', { type: 'color', id: id, class: 'saisie-couleur' });
                    saisie.value = /^#[0-9a-f]{6}$/i.test(obj[d.k] || '') ? obj[d.k] : '#888888';
                    saisie.addEventListener('input', function () { obj[d.k] = saisie.value; change(); });
                    if (!obj[d.k]) obj[d.k] = saisie.value;
                } else if (d.t === 'select') {
                    saisie = h('select', { id: id }, d.opts.map(function (o) { return h('option', { value: String(o[0]), text: o[1] }); }));
                    saisie.value = obj[d.k] == null ? '' : String(obj[d.k]);
                    saisie.addEventListener('change', function () {
                        var v = saisie.value;
                        fixer(obj, d.k, v === '' ? '' : (d.num ? Number(v) : v));
                        change();
                    });
                } else if (d.t === 'number') {
                    saisie = h('input', { type: 'number', id: id, min: '0', step: '1', inputmode: 'numeric' });
                    saisie.value = obj[d.k] == null ? '' : obj[d.k];
                    saisie.addEventListener('input', function () { fixer(obj, d.k, saisie.value === '' ? '' : Number(saisie.value)); change(); });
                } else if (d.t === 'image') {
                    saisie = champImage(id, d, obj, change);
                } else {
                    saisie = h('input', { type: 'text', id: id });
                    if (d.suggere) {
                        var dl = h('datalist', { id: id + '-dl' }, d.suggere().map(function (v) { return h('option', { value: v }); }));
                        saisie.setAttribute('list', id + '-dl');
                        document.body.appendChild(dl);
                    }
                    saisie.value = obj[d.k] == null ? '' : obj[d.k];
                    saisie.addEventListener('input', function () { fixer(obj, d.k, saisie.value); change(); });
                }
                var enfants = [h('label', { for: id, text: d.l }), saisie];
                if (d.aide) enfants.push(h('span', { class: 'aide', text: d.aide }));
                champ = h('div', { class: 'champ' }, enfants);
                if (d.t === 'area') champ.style.gridColumn = '1 / -1';
            }
            if (d.si) conditionnels.push({ d: d, champ: champ });
            corps.appendChild(champ);
        });

        if (corps.childNodes.length) conteneur.appendChild(corps);
        majVis();
        return conteneur;
    }

    // Zone de texte : barre de mise en forme + aperçu en direct
    function zoneTexte(id, d, obj, change) {
        var ta = h('textarea', { id: id });
        var apercu = h('div', { class: 'apercu-riche', 'aria-label': 'Aperçu' });
        ta.value = obj[d.k] == null ? '' : obj[d.k];
        function maj() {
            apercu.innerHTML = O.riche(ta.value);
            apercu.style.display = /[*={}<]/.test(ta.value) ? '' : 'none';   // l'aperçu n'apparaît que s'il y a une mise en forme
        }
        ta.addEventListener('input', function () { fixer(obj, d.k, ta.value); maj(); change(); });
        function entourer(avant, apres) {
            var a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b) || 'texte';
            ta.value = ta.value.slice(0, a) + avant + sel + apres + ta.value.slice(b);
            ta.focus();
            ta.setSelectionRange(a + avant.length, a + avant.length + sel.length);
            ta.dispatchEvent(new Event('input'));
        }
        var barre = h('div', { class: 'barre-format' }, [
            ['Gras', '**', '**', 'b'], ['Italique', '*', '*', 'i'], ['Surligné', '==', '==', 'm'], ['Murmure', '{{', '}}', 'u']
        ].map(function (b) {
            var bt = h('button', { type: 'button', class: 'fmt-' + b[3], title: b[0] + ' : ' + b[1] + 'texte' + b[2], text: b[0] });
            bt.addEventListener('click', function () { entourer(b[1], b[2]); });
            return bt;
        }));
        maj();
        return h('div', { class: 'zone-texte' }, [barre, ta, apercu]);
    }

    function champImage(id, d, obj, change) {
        var texte = h('input', { type: 'text', id: id, placeholder: 'Nom de fichier ou adresse' });
        var vignette = h('img', { class: 'vignette', alt: '' });
        var fichier = h('input', { type: 'file', accept: 'image/*', hidden: '' });
        var bouton = h('button', { type: 'button', class: 'bouton-clair bouton-petit', text: 'Envoyer une image' });

        function apercu() {
            if (texte.value.trim()) vignette.src = O.url(texte.value.trim());
            else vignette.removeAttribute('src');
        }
        texte.value = obj[d.k] == null ? '' : obj[d.k];
        apercu();
        texte.addEventListener('input', function () { fixer(obj, d.k, texte.value.trim()); change(); });
        texte.addEventListener('change', apercu);
        vignette.addEventListener('error', function () { vignette.removeAttribute('src'); });

        bouton.addEventListener('click', function () { fichier.click(); });
        fichier.addEventListener('change', function () {
            var f = fichier.files[0];
            if (!f) return;
            bouton.disabled = true;
            bouton.textContent = 'Envoi…';
            envoyerImage(f).then(function (url) {
                texte.value = url;
                fixer(obj, d.k, url);
                apercu();
                change();
                toast('Image envoyée. N\'oublie pas d\'enregistrer.');
            }).catch(function (e) {
                toast('Envoi impossible : ' + (e && e.message ? e.message : e), true);
            }).then(function () {
                bouton.disabled = false;
                bouton.textContent = 'Envoyer une image';
                fichier.value = '';
            });
        });
        return h('div', { class: 'champ-image' }, [vignette, texte, bouton, fichier]);
    }

    // Réduit l'image (1600 px max) et la convertit en WebP avant l'envoi
    function versWebp(f) {
        return createImageBitmap(f).then(function (bmp) {
            var k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
            var c = document.createElement('canvas');
            c.width = Math.round(bmp.width * k);
            c.height = Math.round(bmp.height * k);
            c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
            return new Promise(function (ok) {
                c.toBlob(function (b) { ok(b && b.type === 'image/webp' ? b : null); }, 'image/webp', 0.82);
            });
        }).catch(function () { return null; });
    }

    function envoyerImage(f) {
        return versWebp(f).then(function (webp) {
            var base = f.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'image';
            var ext = webp ? 'webp' : (f.name.split('.').pop() || 'png').toLowerCase();
            var nom = Date.now().toString(36) + '-' + base + '.' + ext;
            return client.storage.from(C.bucket).upload(nom, webp || f, {
                contentType: webp ? 'image/webp' : f.type, cacheControl: '31536000'
            }).then(function (r) {
                if (r.error) throw r.error;
                return client.storage.from(C.bucket).getPublicUrl(nom).data.publicUrl;
            });
        });
    }

    function liste(d, obj, change) {
        if (!Array.isArray(obj[d.k])) obj[d.k] = [];
        var tab = obj[d.k];
        var boite = h('div', { class: 'liste' });
        var titre = d.l ? h('h3', { class: 'liste-titre', text: d.l }) : null;

        function rendre(ouvert) {
            boite.textContent = '';
            tab.forEach(function (item, i) {
                var det = h('details', { class: 'item' });
                if (i === ouvert) det.open = true;
                var nom = h('span', { class: 'item-titre' });
                function libelle() { nom.textContent = (d.lib ? d.lib(item) : '') || '(sans titre)'; }
                libelle();

                function bouton(sym, label, fait, inactif) {
                    var b = h('button', { type: 'button', 'aria-label': label, title: label, text: sym });
                    b.disabled = !!inactif;
                    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fait(); });
                    return b;
                }
                function deplacer(de, vers) {
                    var x = tab.splice(de, 1)[0];
                    tab.splice(vers, 0, x);
                    change(); rendre(vers);
                }
                det.appendChild(h('summary', {}, [nom, h('span', { class: 'mini-boutons' }, [
                    bouton('↑', 'Monter', function () { deplacer(i, i - 1); }, i === 0),
                    bouton('↓', 'Descendre', function () { deplacer(i, i + 1); }, i === tab.length - 1),
                    bouton('✕', 'Supprimer', function () {
                        if (!window.confirm('Supprimer « ' + ((d.lib && d.lib(item)) || 'cet élément') + ' » ?')) return;
                        tab.splice(i, 1); change(); rendre();
                    })
                ])]));
                var corps = h('div', { class: 'item-corps' });
                corps.appendChild(formulaire(d.item, item, function () { libelle(); change(); }, {
                    exclusif: function (k) { tab.forEach(function (o) { if (o !== item) delete o[k]; }); change(); rendre(i); }
                }));
                det.appendChild(corps);
                boite.appendChild(det);
            });
            var ajout = h('button', { type: 'button', class: 'bouton-ajout', text: '+ ' + (d.ajout || 'Ajouter') });
            ajout.addEventListener('click', function () { tab.push({}); change(); rendre(tab.length - 1); });
            boite.appendChild(ajout);
        }
        rendre();

        var tout = h('div');
        if (titre) tout.appendChild(titre);
        tout.appendChild(boite);
        return tout;
    }

    /* ---------- Affichage d'une rubrique ---------- */
    function afficher(r) {
        courante = r;
        $('rubrique-titre').textContent = r.nom;
        $('rubrique-aide').textContent = r.aide;
        var cible = $('formulaire');
        cible.textContent = '';
        cible.appendChild(formulaire(r.champs, donnees[r.cle], function () {
            modifie[r.cle] = true;
            majOnglets();
        }));
        majOnglets();
    }

    function majOnglets() {
        Array.prototype.forEach.call($('onglets').children, function (b, i) {
            var r = RUBRIQUES[i];
            b.setAttribute('aria-current', r === courante ? 'true' : 'false');
            b.className = modifie[r.cle] ? 'modifie' : '';
        });
    }

    function enregistrer() {
        var r = courante, b = $('enregistrer');
        b.disabled = true;
        b.textContent = 'Enregistrement…';
        var v = r.racineListe ? donnees[r.cle].liste : donnees[r.cle];
        client.from(C.table).upsert({ cle: r.cle, valeur: v }).then(function (res) {
            if (res.error) throw res.error;
            modifie[r.cle] = false;
            majOnglets();
            try { localStorage.removeItem('nubes-contenu-v1'); } catch (e) {}
            toast('Enregistré. Le site est à jour !');
        }).catch(function (e) {
            toast('Échec de l\'enregistrement : ' + (e && e.message ? e.message : e), true);
        }).then(function () {
            b.disabled = false;
            b.textContent = 'Enregistrer';
        });
    }

    /* ---------- Écrans ---------- */
    function ecran(titre, texte, bouton, action) {
        $('app').hidden = true;
        var e = $('ecran');
        e.hidden = false;
        e.textContent = '';
        e.appendChild(h('h1', { text: titre }));
        if (texte) e.appendChild(h('p', { text: texte }));
        if (bouton) {
            var b = h('button', { type: 'button', class: 'bouton', text: bouton });
            b.addEventListener('click', action);
            e.appendChild(b);
        }
    }

    function connexionDiscord() {
        client.auth.signInWithOAuth({
            provider: 'discord',
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    }
    function deconnexion() {
        client.auth.signOut().then(function () { window.location.reload(); });
    }

    function charger() {
        return client.from(C.table).select('cle,valeur').then(function (res) {
            if (res.error) throw res.error;
            var lignes = {};
            res.data.forEach(function (l) { lignes[l.cle] = l.valeur; });
            RUBRIQUES.forEach(function (r) {
                // pas encore en base : on part des valeurs d'origine du site
                var v = copie(lignes[r.cle] != null ? O.completer(lignes[r.cle], window.DEFAUT[r.defaut]) : (window.DEFAUT[r.defaut] || (r.racineListe ? [] : {})));
                if (r.cle === 'relations') v = v.map(function (x) { var o = O.relation(x); delete o.dernier; return o; });
                donnees[r.cle] = r.racineListe ? { liste: v } : v;
                modifie[r.cle] = false;
            });
        });
    }

    function ouvrirDashboard() {
        return charger().then(function () {
            $('ecran').hidden = true;
            $('app').hidden = false;
            var nav = $('onglets');
            nav.textContent = '';
            RUBRIQUES.forEach(function (r) {
                var b = h('button', { type: 'button', text: r.nom });
                b.addEventListener('click', function () { afficher(r); });
                nav.appendChild(b);
            });
            afficher(RUBRIQUES[0]);
        });
    }

    function demarrer(session) {
        if (!session) {
            $('deconnexion').hidden = true;
            $('qui').textContent = '';
            ecran('Dashboard', 'Connecte-toi avec Discord pour modifier le site.', 'Se connecter avec Discord', connexionDiscord);
            return;
        }
        var meta = session.user.user_metadata || {};
        $('qui').textContent = meta.full_name || meta.name || '';
        $('deconnexion').hidden = false;

        client.rpc('est_admin').then(function (r) {
            if (r.error) throw r.error;
            if (!r.data) {
                ecran('Accès refusé', 'Ce compte Discord n\'est pas administrateur du site.', 'Se déconnecter', deconnexion);
                return;
            }
            return ouvrirDashboard();
        }).catch(function (e) {
            var msg = e && e.message ? e.message : String(e);
            var base = /est_admin|nubes_contenus|schema cache|relation/i.test(msg)
                ? 'La base n\'est pas encore prête : lance supabase/schema.sql dans Supabase (SQL Editor). '
                : '';
            ecran('Erreur', base + msg, 'Se déconnecter', deconnexion);
        });
    }

    /* ---------- Lancement ---------- */
    $('deconnexion').addEventListener('click', deconnexion);
    $('enregistrer').addEventListener('click', enregistrer);

    window.addEventListener('beforeunload', function (e) {
        if (Object.keys(modifie).some(function (k) { return modifie[k]; })) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    var demarre = false;
    client.auth.onAuthStateChange(function (evenement, session) {
        if (evenement === 'TOKEN_REFRESHED' || evenement === 'USER_UPDATED') return;
        if (evenement === 'SIGNED_IN' && demarre) return;
        demarre = !!session;
        // on sort du callback avant d'appeler Supabase (évite un blocage connu de supabase-js)
        setTimeout(function () { demarrer(session); }, 0);
    });
})();
