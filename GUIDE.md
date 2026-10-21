# Guide du site — Nuage Blanc

Site : https://araxiaa.github.io/nubes/

## Mise en ligne (une seule fois)

1. **Supabase** → SQL Editor → New query → colle le contenu de `supabase/schema.sql` → Run.
   (Même projet que les sites d'Étoile de Framboisier et de Petite Mygale : la connexion Discord et la liste des
   admins sont déjà là. Les tables de ce site s'appellent `nubes_contenus` et le dossier d'images `nubes`.
   Le script peut être relancé sans risque.)
2. **Supabase** → Authentication → URL Configuration → *Redirect URLs* : ajoute
   `https://araxiaa.github.io/nubes/admin.html` (et `http://localhost:5502/admin.html` pour tester en local).
3. **GitHub** → dépôt `Araxiaa/nubes` → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
4. Dans VSCode : `npm install` (une fois), puis `npm run deploy`.

## Au quotidien (terminal de VSCode)

| Commande           | Effet                                                              |
|--------------------|--------------------------------------------------------------------|
| `npm start`        | Site en local : http://localhost:5502                              |
| `npm run deploy`   | Envoie le site sur GitHub (commit + push). `npm run deploy -- "mon message"` pour nommer la version |
| `npm run images`   | Convertit les images déposées dans `originaux/` en WebP légers (`assets/photos/`) |
| `npm run schema`   | Régénère `supabase/schema.sql` depuis `js/data/contenu.js`         |

Le site se met à jour 1 à 2 minutes après `npm run deploy`.
Les **textes** se modifient dans le dashboard : pas besoin de déployer.

## Le dashboard

En bas de l'accueil (pied de page, à droite), un **petit œil mi-clos** presque invisible : il s'ouvre au survol
et mène à `admin.html`. Connexion Discord, puis une rubrique par page : Fiche & accueil, Identité & noms,
Personnalité, Voix, Apparence, Aptitudes, Histoire, Généalogie, Relations, Fils RP, Santé, Jouer avec lui, Galerie.
On ajoute, modifie, déplace, supprime ; les images envoyées sont allégées automatiquement (WebP, 1600 px).

- **Nom actuel** : Identité & noms → ouvre un nom → « Définir comme nom actuel » (au passage à guerrier, par exemple).
  Il devient le nom affiché partout ; les noms d'avant sont grisés, ceux d'après en pointillés.
- **Fils RP** : titre, nombre de lunes, « en cours » (à décocher à la fin), lien Discord, participants, description.
- **Santé** : blessures et maladies (type, gravité, lune du début et de guérison, soins, séquelles).
- **Relations** : une fiche par chat (clan / groupe, rang) et une liste d'**avis datés**. Pour faire évoluer une
  relation : ouvre le chat → « Ajouter un avis » avec la lune et les cœurs du moment. Le site en tire la courbe
  d'évolution, les flèches ▲▼ et « Derniers changements ».
- **Jouer avec lui** : disponibilité RP (ouvert / sélectif / complet), conseils pour l'aborder, ce qu'il accepte
  ou refuse, idées de rencontres. La disponibilité s'affiche aussi sur l'accueil.
- **Voix** et **Aptitudes** : à ajuster à ta façon de le jouer. Les répliques et les niveaux de compétences
  fournis au départ sont des exemples déduits de son caractère.

### Mettre en forme les textes

Chaque zone de texte a une barre **Gras · Italique · Surligné · Murmure** (ou tape `**gras**`, `*italique*`,
`==surligné==`, `{{murmure}}`) avec un aperçu en direct. Dans les listes de paragraphes, chaque bloc a un **type** :
Paragraphe · Intertitre · Citation · Encart « À retenir » · Image · Séparateur ✦.

## Navigation du site

Sur ordinateur, les rubriques sont dans la barre du haut : **Accueil · Lui · Histoire · Entourage · Jouer · Galerie**.
Sur téléphone (et tablette), le bouton **Menu** ouvre un grand menu plein écran avec toutes les pages et leurs sous-pages.
- Lui : Identité, Caractère, Physique, Voix, Aptitudes, Santé
- Histoire : Chroniques, Parcours (frise de toute sa vie, assemblée toute seule), Fils RP
- Entourage : Lignée, Relations (liste ou **Ciel**)
- Jouer : *Jouer avec lui* (guide pour les partenaires de RP)

**Le Ciel** (Entourage → Relations → « Ciel ») : il est le grand nuage du centre, chaque relation est un nuage qui
flotte autour de lui. Plus le lien est fort, plus le nuage est proche et gros ; sa teinte dit la nature du lien
(clair : apprécié, bleuté : neutre, orageux : aversion, pâle : décédé). Un clic ouvre l'évolution de la relation.

Pour retrouver quelque chose en un clin d'œil : la **loupe** de l'en-tête, ou la touche **/** (ou Ctrl+K),
cherche dans les pages, chapitres, fils, relations et la lignée.
Chaque page finit par « Précédent / Suivant ». Adresses directes : `#lui/caractere`, `#histoire/fils`…
Les anciennes adresses (`personnalite.html`, `relations.html`…) redirigent vers les nouvelles pages.

Le bouton nuage de l'en-tête bascule entre le thème **Nuit** et le thème **Brume** (jour, doux : Nuage Blanc
ne supporte pas la lumière vive, son œil se plisse d'ailleurs en mode Brume). Le choix est mémorisé.

## Direction artistique

Propre à Nuage Blanc, volontairement différente des autres sites : mise en page éditoriale (grands titres en
*Instrument Serif*, texte en *Jost*, filets fins, pas de cartes arrondies), le chat de neige assis devant une
lune, des bancs de nuages qui dérivent derrière lui, un halo de lune qui suit le curseur, des flocons et des
rafales de vent, un œil de logo qui suit le curseur et cligne. Tout se coupe tout seul si l'appareil demande
moins d'animations ou si l'onglet est masqué.

## Où modifier quoi

| Je veux changer…                       | Fichier                                      |
|----------------------------------------|----------------------------------------------|
| Couleurs, polices                      | `css/site.css` (variables en haut ; polices dans `assets/fonts/`) |
| Formulaires du dashboard               | `js/admin.js` (liste `RUBRIQUES`)            |
| Affichage d'une page                   | `js/site.js` (une fonction par page)         |
| Flocons                                | `js/ambiance.js`                             |
| Texte de départ / sauvegarde           | `js/data/contenu.js` puis `npm run schema`   |

## Performances

Polices hébergées sur le site (aucune requête vers Google), images en WebP (≈ 270 Ko au total contre ≈ 1,1 Mo en
PNG) avec miniatures et chargement différé, affichage immédiat depuis la dernière version mémorisée puis mise à
jour en arrière-plan, sections hors écran non dessinées (`content-visibility`), animations limitées à `transform` /
`opacity`, aucune bibliothèque sur le site public (Supabase n'est chargé que sur le dashboard), numéro de version
ajouté aux fichiers à chaque déploiement (jamais d'ancien fichier en cache). Si la base est injoignable, le site
retombe sur `js/data/contenu.js`. Le dossier `originaux/` (PNG d'origine et ancien site) reste sur ton ordinateur,
il n'est pas envoyé sur GitHub.
