-- ============================================================================
--  NUAGE BLANC — base de données
--  À coller UNE FOIS dans Supabase → SQL Editor → New query → Run.
--  Peut être relancé sans danger : ne remplace pas les contenus déjà modifiés.
--  Utilise le même projet que le site d'Étoile de Framboisier : tables préfixées
--  « nubes_ », et la même liste d'administrateurs (table admins + connexion Discord).
-- ============================================================================

-- ---------- Qui est administrateur ? (identifiants Discord) ----------
create table if not exists public.admins (
    discord_id text primary key,
    note       text
);
alter table public.admins enable row level security;
insert into public.admins (discord_id, note)
values ('626101487185166347', 'Propriétaire du site')
on conflict do nothing;

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from auth.identities i
        join public.admins a on a.discord_id = i.provider_id
        where i.user_id = auth.uid() and i.provider = 'discord'
    );
$$;
revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- ---------- Les contenus du site ----------
create table if not exists public.nubes_contenus (
    cle     text primary key,
    valeur  jsonb not null,
    maj     timestamptz not null default now()
);
alter table public.nubes_contenus enable row level security;

drop policy if exists "nubes lecture publique"  on public.nubes_contenus;
drop policy if exists "nubes ecriture admin"    on public.nubes_contenus;
drop policy if exists "nubes modif admin"       on public.nubes_contenus;
drop policy if exists "nubes suppression admin" on public.nubes_contenus;

create policy "nubes lecture publique"  on public.nubes_contenus for select using (true);
create policy "nubes ecriture admin"    on public.nubes_contenus for insert to authenticated with check (public.est_admin());
create policy "nubes modif admin"       on public.nubes_contenus for update to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "nubes suppression admin" on public.nubes_contenus for delete to authenticated using (public.est_admin());

create or replace function public.nubes_touch_maj() returns trigger
language plpgsql set search_path = '' as $$
begin new.maj = now(); return new; end $$;
drop trigger if exists nubes_contenus_maj on public.nubes_contenus;
create trigger nubes_contenus_maj before update on public.nubes_contenus
    for each row execute function public.nubes_touch_maj();

-- ---------- Les images envoyées depuis le dashboard ----------
insert into storage.buckets (id, name, public)
values ('nubes', 'nubes', true)
on conflict (id) do nothing;

drop policy if exists "nubes envoi admin" on storage.objects;
drop policy if exists "nubes modif admin" on storage.objects;
drop policy if exists "nubes suppr admin" on storage.objects;
create policy "nubes envoi admin" on storage.objects for insert to authenticated
    with check (bucket_id = 'nubes' and public.est_admin());
create policy "nubes modif admin" on storage.objects for update to authenticated
    using (bucket_id = 'nubes' and public.est_admin());
create policy "nubes suppr admin" on storage.objects for delete to authenticated
    using (bucket_id = 'nubes' and public.est_admin());

-- ---------- Contenu de départ (repris de js/data/contenu.js) ----------
insert into public.nubes_contenus (cle, valeur) values ('fiche', $json${
 "clan": "Clan du Vent",
 "devise": "Seul, il a survécu. Parmi les siens, il apprend à vivre.",
 "accroche": "Un félin entièrement blanc aux yeux bleu foncé, ancien solitaire devenu protecteur malgré lui, aujourd'hui apprenti du Clan du Vent après 36 lunes de vie passées loin de tout territoire fixe.",
 "portrait": "avatar.webp",
 "pv": "50",
 "pa": "5",
 "pied": "Nuage Blanc, autrefois Nubes · Apprenti du Clan du Vent — Fiche & site créés par Araxia pour Le Prix de la Trêve",
 "lignes": [
  {
   "label": "Genre",
   "valeur": "Matou"
  },
  {
   "label": "Âge",
   "valeur": "36 lunes"
  },
  {
   "label": "Rang",
   "valeur": "Apprenti"
  },
  {
   "label": "Mentore",
   "valeur": "Reflet Dorée"
  },
  {
   "label": "Pelage",
   "valeur": "Blanc nivéen"
  },
  {
   "label": "Yeux",
   "valeur": "Bleu foncé"
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('noms', $json$[
 {
  "etape": "Nom de naissance",
  "nom": "Nubes",
  "periode": "0 à 35 lunes",
  "citation": "Le nom qu'il a porté durant toutes ses lunes d'errance, loin de tout clan."
 },
 {
  "etape": "Nom d'apprenti",
  "nom": "Nuage Blanc",
  "periode": "depuis 35 lunes",
  "actuel": true,
  "citation": "Reçu à son arrivée au Clan du Vent, il y a 1 lune."
 },
 {
  "etape": "Nom de guerrier",
  "nom": "À déterminer",
  "periode": "à venir",
  "citation": "Il sera choisi au fil de son évolution et de son parcours au sein du clan."
 }
]$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('personnalite', $json${
 "citation": "Un protecteur instinctif qui se cache derrière un rempart de sarcasmes, et un anxieux chronique pour qui chaque calme n'est que le prélude d'une tempête.",
 "motscles": [
  {
   "texte": "Protecteur"
  },
  {
   "texte": "Loyal"
  },
  {
   "texte": "Pragmatique"
  },
  {
   "texte": "Sarcastique"
  },
  {
   "texte": "Méfiant"
  },
  {
   "texte": "Nocturne"
  }
 ],
 "jauges": [
  {
   "nom": "Méfiance",
   "niveau": 5
  },
  {
   "nom": "Loyauté",
   "niveau": 5
  },
  {
   "nom": "Sarcasme",
   "niveau": 4
  },
  {
   "nom": "Anxiété",
   "niveau": 4
  },
  {
   "nom": "Rancune",
   "niveau": 5
  },
  {
   "nom": "Sociabilité",
   "niveau": 1
  }
 ],
 "paragraphes": [
  {
   "texte": "Nuage Blanc est une contradiction ambulante, un félin qui a bâti des remparts pour mieux dissimuler ce qu'ils protègent. Derrière son regard plissé et sa voix grave et posée se cache un esprit en guerre perpétuelle contre lui-même : d'un côté, un **protecteur instinctif** prêt à se dresser entre les siens et le danger sans qu'on le lui demande ; de l'autre, un **anxieux chronique**, architecte de scénarios catastrophes, pour qui chaque calme n'est que le prélude d'une tempête à venir."
  },
  {
   "texte": "Des lunes entières passées à errer seul, sans clan ni famille pour veiller sur lui, ont façonné un félin pragmatique jusqu'à l'os. Il n'a que faire des rêves grandioses ou des débats sans fin : seule compte la survie, la sienne et celle de ceux qu'il a fini par accepter à ses côtés. Cette rigueur s'accompagne d'une observation constante, un réflexe de vigilance né de sa malvoyance et affûté par une vie sans filet ; rien n'échappe à ses sens, pas même dans les silences."
  },
  {
   "type": "citation",
   "texte": "Sa confiance ne s'offre jamais ; elle se mérite, lentement, et une fois accordée, elle devient absolue, presque religieuse."
  },
  {
   "texte": "Mais approcher Nuage Blanc, c'est se heurter d'abord à sa carapace. Le sarcasme est sa langue maternelle, une manière de garder les autres à distance avant qu'ils n'aient l'occasion de le décevoir. Car sous cette froideur affichée se cache une méfiance viscérale, le fruit de lunes où il n'a pu compter que sur lui-même. Mais gare à celui qui la trahit : il n'existe, dans l'esprit rancunier de Nuage Blanc, aucun chemin de retour. La faute est gravée, le fautif effacé, sans appel ni pitié."
  },
  {
   "texte": "Incapable de manier les mots de l'affection, il préfère l'éloquence silencieuse des actes : une proie partagée, une toilette minutieuse, une présence discrète mais constante. C'est un félin qui aime à sa manière, rêche et maladroite, mais jamais superficielle. Depuis qu'il a rejoint le Clan du Vent, Nuage Blanc apprend, lune après lune, ce que signifie appartenir à quelque chose de plus grand que lui-même — un apprentissage aussi précieux qu'inconfortable pour un cœur qui n'a longtemps su compter que sur sa propre vigilance."
  }
 ],
 "qualites": [
  {
   "nom": "Protecteur",
   "texte": "La protection chez Nuage Blanc n'est pas un choix, c'est un instinct viscéral. Des lunes à parcourir seul des terres inconnues lui ont appris qu'on ne baisse jamais sa garde, ni pour soi, ni pour ceux qu'on choisit d'accepter à ses côtés. N'attendez de lui aucune douceur : son affection est une vérité brute qui s'exprime par des grognements d'avertissement, des ordres secs et un corps qui se place instinctivement entre les siens et le danger."
  },
  {
   "nom": "Loyal",
   "texte": "Gagner la confiance de Nuage Blanc, c'est percer une forteresse de glace. Méfiant et froid au premier abord, forgé par des lunes d'errance où compter sur autrui relevait du luxe, il n'accorde son allégeance qu'à de très rares élus. Mais une fois le pacte scellé, sa loyauté est absolue, un dévouement à l'épreuve de la mort."
  },
  {
   "nom": "Pragmatique",
   "texte": "Nuage Blanc est une ancre, y compris pour lui-même. Il a les pattes fermement plantées dans la réalité de l'instant présent, une rigueur héritée de lunes où la survie ne laissait aucune place à l'illusion. Sa priorité est unique et immuable : survivre, encore et toujours."
  },
  {
   "nom": "Observateur",
   "texte": "Ironiquement, c'est sa vue défaillante qui a fait de lui le plus fin des observateurs. Errer seul, sans clan pour veiller sur ses arrières, l'a forcé à cartographier son environnement à travers le prisme de ses autres sens. Pour Nuage Blanc, chaque détail est une information vitale."
  }
 ],
 "defauts": [
  {
   "nom": "Sarcastique & cassant",
   "texte": "Le sarcasme est la première ligne de défense de Nuage Blanc, une carapace verbale aussi blanche et froide que son pelage. Il l'utilise pour garder les autres à distance et, surtout, pour masquer ses propres failles sous une couche de glace."
  },
  {
   "nom": "Anxieux & pessimiste",
   "texte": "Sous l'armure du félin cynique se cache un esprit rongé par l'anxiété. Nuage Blanc est l'architecte des pires scénarios, le prophète des catastrophes, un réflexe hérité de lunes passées seul sur les routes."
  },
  {
   "nom": "Rancunier",
   "texte": "La médaille de sa loyauté a un revers tranchant comme le silex : il ne pardonne jamais. Celui qui le trahit est banni à vie dans un désert de silence et d'indifférence. Il est, à ses yeux, mort et enterré."
  },
  {
   "nom": "Maladroit socialement",
   "texte": "Après des lunes à ne devoir compter que sur lui-même, Nuage Blanc est un infirme des relations sociales. Ses encouragements sont voilés de sarcasme, ses compliments sont des critiques inversées."
  }
 ],
 "aime": [
  {
   "nom": "L'obscurité",
   "texte": "La nuit n'est pas juste un moment qu'il apprécie ; c'est son royaume, le seul endroit où il se sent pleinement lui-même et compétent — une constante qui l'a suivi de territoire en territoire."
  },
  {
   "nom": "Le silence",
   "texte": "Compagnon naturel de l'obscurité, le silence est un baume pour son esprit constamment en alerte, lui permettant d'isoler les bruits importants et d'apaiser le tumulte de son anxiété."
  },
  {
   "nom": "La sécurité",
   "texte": "Il la recherche dans les abris confinés, les terriers profonds où rien ne peut le surprendre. Il chérit la présence des rares félins qui comprennent son handicap sans le juger."
  },
  {
   "nom": "Souris & moineaux",
   "texte": "Il affectionne les souris pour leur simplicité. Les moineaux, en revanche, sont un luxe rare : un défi complexe dont le goût plus fin est une récompense qui justifie l'effort."
  }
 ],
 "aimepas": [
  {
   "nom": "La lumière",
   "texte": "Elle est une agression physique qui lui inflige des maux de tête cuisants, le plonge dans un brouillard aveuglant et le dépouille de ses sens les plus fiables."
  },
  {
   "nom": "L'incertitude",
   "texte": "Son esprit pragmatique a horreur du vide. L'imprévu, le doute et les suppositions sont pour lui des poisons qui nourrissent ses pires scénarios."
  },
  {
   "nom": "Les landes à découvert",
   "texte": "S'installer sur le territoire du Clan du Vent a été une véritable épreuve. Il recherche instinctivement les fougères, les buissons d'ajoncs, les rares reliefs du terrain."
  },
  {
   "nom": "La trahison",
   "texte": "Sa confiance est une chose si rare et si chèrement acquise que la briser revient à nier l'essence même de son engagement. Il n'y a rien à réparer, seulement à effacer."
  }
 ],
 "gouts_note": "",
 "peurs": [
  {
   "texte": "**Éclats de lumière trop vifs** — Un reflet soudain sur l'eau ou un éclair dans le ciel est une détonation silencieuse qui efface le monde, le laissant désorienté et totalement vulnérable."
  },
  {
   "texte": "**Être trahi par un proche** — L'idée qu'un proche puisse se servir de sa confiance contre lui est un scénario qui anéantirait sa vision du monde et validerait son pessimisme le plus profond."
  },
  {
   "texte": "**Devenir inutile pour les autres** — Devenir totalement inutile, n'être plus qu'une charge pour le clan qui l'a accueilli, est pour lui une forme de mort lente."
  }
 ],
 "habitudes": [
  {
   "nom": "Le masque & le rythme de vie",
   "texte": "Son tic le plus visible est son plissement d'yeux quasi permanent. Il n'est pleinement actif que du crépuscule à l'aube, passant les heures ensoleillées à l'abri dans les recoins les plus sombres du camp."
  },
  {
   "nom": "Le tacticien instinctif",
   "texte": "En situation de stress ou de combat, son premier réflexe est de protéger ses arrières, se plaçant systématiquement dos à un obstacle naturel ou dos à dos avec un allié de confiance."
  },
  {
   "nom": "Le positionnement calculé",
   "texte": "Il évalue rapidement les forces et faiblesses perçues de ceux qui l'entourent, ajustant sa position en conséquence — une gymnastique silencieuse qui en dit long sur sa vigilance constante."
  },
  {
   "nom": "L'affection par les actes",
   "texte": "Incapable de naviguer dans la complexité des émotions verbales, il exprime ses sentiments par des actes concrets : une part de proie partagée, une toilette efficace et silencieuse."
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('voix', $json${
 "intro": [
  {
   "texte": "Nuage Blanc parle peu, et jamais pour ne rien dire. Sa voix est **grave et posée**, une rivière lente qui s'écoule avec une autorité naturelle — mais ses eaux calmes cachent les pointes acérées du sarcasme, prêtes à jaillir dans une intonation cassante."
  },
  {
   "texte": "Il ne sait pas dire « je tiens à toi ». Il dit « tu as mangé ? », « reste derrière moi » ou « tu fais trop de bruit ». À vous de lire entre les lignes."
  }
 ],
 "tics": [
  {
   "nom": "Le sarcasme en première ligne",
   "texte": "Compliments en critiques inversées, encouragements voilés d'ironie : une façon de garder ses distances."
  },
  {
   "nom": "Les ordres secs",
   "texte": "Quand le danger approche, il ne discute plus : il ordonne, court et net, et se place devant."
  },
  {
   "nom": "Les grognements d'avertissement",
   "texte": "Un grondement bas avant les mots, pour signifier « recule » ou « je veille »."
  },
  {
   "nom": "Le silence",
   "texte": "Il préfère se taire que meubler. Son silence n'est pas toujours une froideur : c'est souvent de l'écoute."
  }
 ],
 "repliques": [
  {
   "contexte": "Exemple de ton — première rencontre",
   "texte": "Tu es loin du camp. Soit tu es perdu, soit tu es stupide. Dans les deux cas, reste derrière moi."
  },
  {
   "contexte": "Exemple de ton — un geste de confiance",
   "texte": "Prends-la, cette souris. Ne me remercie pas, ça me gênerait."
  },
  {
   "contexte": "Exemple de ton — en plein soleil",
   "texte": "Si c'est pour parler fort et briller comme ça, on en reparlera ce soir."
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('apparence', $json${
 "image": "nuage-blanc.webp",
 "apercu": [
  {
   "label": "Pelage",
   "valeur": "Blanc nivéen, mi-long, en bataille"
  },
  {
   "label": "Yeux",
   "valeur": "Bleu foncé, plissés"
  },
  {
   "label": "Carrure",
   "valeur": "Charpente solide et musclée"
  },
  {
   "label": "Voix",
   "valeur": "Grave et posée"
  },
  {
   "label": "Particularité",
   "valeur": "Héméralopie"
  },
  {
   "label": "Signe distinctif",
   "valeur": "Balafre à la patte arrière gauche"
  }
 ],
 "palette": [
  {
   "nom": "Neige",
   "hex": "#eaf5fb"
  },
  {
   "nom": "Ombre de poussière (museau)",
   "hex": "#b7c6d1"
  },
  {
   "nom": "Bleu de crépuscule (yeux)",
   "hex": "#1f3a5f"
  },
  {
   "nom": "Truffe & oreilles",
   "hex": "#f0cfc2"
  }
 ],
 "paragraphes": [
  {
   "texte": "Nuage Blanc est une contradiction faite chat, un paradoxe de neige et d'ombre. Sa fourrure mi-longue, d'une blancheur nivéenne, semble avoir capturé la lumière des nuages d'hiver. Perpétuellement en bataille, son pelage ébouriffé dessine une silhouette sauvage et indomptée, trahissant un tumulte intérieur que son calme apparent s'efforce de masquer. Seules quelques taches, semblables à des ombres de poussière, viennent moucheter la perfection de son museau."
  },
  {
   "texte": "Mais pour vraiment comprendre Nuage Blanc, il faut affronter son regard. Ses paupières sont une forteresse, plissées en permanence pour se protéger d'une lumière agressive que lui seul perçoit comme une attaque. Derrière ces remparts se cache un bleu foncé inattendu, une teinte si profonde qu'elle semble empruntée aux dernières heures du crépuscule, juste avant que la nuit n'engloutisse tout. C'est un regard qui ne brille pas, mais qui absorbe, intense et lourd de secrets."
  },
  {
   "texte": "À trente-six lunes, il est un matou dans la pleine possession de ses moyens, sa charpente solide promettant depuis longtemps le protecteur qu'il est devenu. Son corps est une corde tendue, une vigilance de chaque instant incarnée dans des muscles prêts à bondir. Cette tension explique la précision mortelle de ses mouvements ; là où sa vue lui fait défaut, son corps compense, chaque pas étant mesuré, chaque patte posée avec une certitude presque religieuse."
  },
  {
   "texte": "Le dernier contraste, et non le moindre, est sa voix. De ce félin à l'allure d'un fantôme de neige émane un timbre grave et posé, une rivière lente qui s'écoule avec une autorité naturelle. Mais méfiez-vous de ses eaux calmes : elles cachent les pointes acérées du sarcasme, prêtes à jaillir dans une intonation cassante qui peut blesser plus sûrement qu'une griffe."
  },
  {
   "type": "intertitre",
   "texte": "Handicap — Héméralopie"
  },
  {
   "texte": "La blancheur immaculée du pelage de Nuage Blanc n'est pas sans contrepartie ; elle est la source même de son handicap. Cette particularité génétique a affecté le développement nerveux de ses yeux, le rendant atteint d'**héméralopie**, une forme de malvoyance caractérisée par une hypersensibilité à la lumière."
  },
  {
   "texte": "Concrètement, la lumière du jour n'est pas pour lui une source de clarté, mais une véritable agression. Ses pupilles sont incapables de filtrer l'intensité lumineuse, le plongeant dans un brouillard aveuglant et douloureux qui le contraint à garder les yeux fermés ou plissés. Il est donc un paria du soleil, fuyant instinctivement les étendues dégagées, les surfaces réfléchissantes et les heures où le jour est à son zénith."
  },
  {
   "type": "encart",
   "texte": "Ce qui est une malédiction le jour devient un don exceptionnel la nuit. Sa rétine, si sensible, capte la moindre parcelle de lumière stellaire : dans l'obscurité quasi totale, là où les autres chats deviennent aveugles, il voit avec une netteté surnaturelle."
  },
  {
   "texte": "Son existence est donc scindée en deux : un jour fait de prudence et d'ombres fuyantes, et une nuit où il devient un chasseur et un gardien redoutable, maître de son environnement."
  }
 ],
 "forts": [
  {
   "nom": "Robuste",
   "texte": "Son corps dense et sa fourrure épaisse lui offrent une résistance naturelle remarquable aux extrêmes, forgée par des lunes passées à dormir à la belle étoile. Il encaisse les coups avec une solidité impressionnante."
  },
  {
   "nom": "Force brute",
   "texte": "Sa puissance se concentre dans ses pattes, larges et exceptionnellement musclées. Cette force lui confère aussi une grande aisance pour grimper aux arbres ou escalader des parois rocheuses."
  },
  {
   "nom": "Sens développés",
   "texte": "Son ouïe perçoit des sons inaudibles pour les autres, sa truffe capte des odeurs infimes, et ses coussinets, couplés à ses vibrisses, lisent la moindre vibration du sol. Il ne voit pas le danger, il le ressent."
  },
  {
   "nom": "Endurance exceptionnelle",
   "texte": "Supérieure à la moyenne, elle lui permet de soutenir un effort physique prolongé, un héritage direct de ses lunes de voyage où s'arrêter trop longtemps pouvait signifier le danger."
  }
 ],
 "faibles": [
  {
   "nom": "Lenteur & manque d'agilité",
   "texte": "Sa faible vitesse et son agilité limitée le rendent incapable de poursuivre une proie fuyante. Il ne peut ni pourchasser ni fuir ; il doit se poster, attendre et faire face."
  },
  {
   "nom": "Visibilité accrue",
   "texte": "Son pelage immaculé est un phare sur l'étendue de la lande, une tache de neige perdue au milieu des herbes et des ajoncs, un défi de chaque instant sur un territoire aussi dégagé."
  },
  {
   "nom": "Peur de l'eau",
   "texte": "N'ayant jamais appris à nager, sa malvoyance transforme l'élément liquide en un cauchemar sensoriel. Une rivière est pour lui une barrière aussi infranchissable qu'un mur de flammes."
  },
  {
   "nom": "Vulnérabilité diurne",
   "texte": "En plein jour, Nuage Blanc n'est que l'ombre de lui-même. Sa survie dépend entièrement de sa capacité à se cacher et de la vigilance de ses alliés."
  }
 ],
 "marques": [
  {
   "nom": "Une fine balafre",
   "texte": "Patte arrière gauche",
   "note": "Mémoire gravée d'une chute survenue lors de ses longues lunes d'errance — un rappel constant du prix de l'inattention."
  },
  {
   "nom": "Accessoires",
   "texte": "Aucun pour le moment",
   "note": "À compléter au fil de son évolution au sein du clan."
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('aptitudes', $json${
 "role": "Guerrier de la nuit",
 "roleTexte": "Apprenti du Clan du Vent, il est déjà devenu le gardien silencieux du camp lorsque la lune commence à se lever : la seule chose que son handicap ait fini par transformer en don.",
 "competences": [
  {
   "nom": "Vision nocturne",
   "niveau": 5,
   "note": "Voit avec netteté dans l'obscurité quasi totale."
  },
  {
   "nom": "Vigilance",
   "niveau": 5,
   "note": "Ouïe, odorat et vibrisses : il ressent le danger avant de le voir."
  },
  {
   "nom": "Endurance",
   "niveau": 5,
   "note": "Soutient l'effort longtemps, héritage de ses lunes de voyage."
  },
  {
   "nom": "Force",
   "niveau": 4,
   "note": "Pattes larges et musclées ; grimpe et escalade avec aisance."
  },
  {
   "nom": "Résistance",
   "niveau": 4,
   "note": "Fourrure épaisse, corps dense : il encaisse."
  },
  {
   "nom": "Chasse de nuit",
   "niveau": 4,
   "note": "Poste, attend, frappe. Jamais de poursuite."
  },
  {
   "nom": "Combat défensif",
   "niveau": 3,
   "note": "Dos à un obstacle ou à un allié de confiance."
  },
  {
   "nom": "Vision de jour",
   "niveau": 0,
   "note": "Héméralopie : la lumière l'aveugle."
  },
  {
   "nom": "Vitesse & agilité",
   "niveau": 1,
   "note": "Incapable de poursuivre une proie fuyante."
  },
  {
   "nom": "Natation",
   "niveau": 0,
   "note": "Il n'a jamais appris, et l'eau l'effraie."
  },
  {
   "nom": "Diplomatie",
   "niveau": 1,
   "note": "Maladroit socialement, sarcastique par réflexe."
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('histoire', $json${
 "chapitres": [
  {
   "titre": "Naissance de la portée",
   "age": "0 lune",
   "paragraphes": [
    {
     "texte": "Nubes vient au monde au sein d'une portée de quatre chatons, aux côtés de sa sœur Caelum et de ses frères Pluvia et Nivéus. La joie de cette naissance est rapidement entachée par le deuil : Pluvia, le plus fragile d'entre eux, s'éteint à peine deux jours après sa venue au monde."
    }
   ]
  },
  {
   "titre": "La séparation",
   "age": "3 lunes",
   "paragraphes": [
    {
     "texte": "Le destin de la fratrie bascule. Caelum est adoptée par une famille de bipèdes, tandis que Nivéus et Nubes sont recueillis, ensemble, par un foyer différent. Les deux frères, déjà inséparables, se retrouvent ainsi arrachés à leur sœur sans possibilité de retour."
    }
   ]
  },
  {
   "titre": "L'abandon",
   "age": "9 lunes",
   "paragraphes": [
    {
     "texte": "Après plusieurs lunes d'une vie domestique paisible mais éphémère, Nivéus et Nubes sont abandonnés par leurs bipèdes au bord d'une route de campagne, livrés à eux-mêmes du jour au lendemain."
    }
   ]
  },
  {
   "titre": "Le groupe des jeunes errants",
   "age": "10 lunes",
   "paragraphes": [
    {
     "texte": "Les deux frères croisent la route d'un groupe de jeunes chats sauvages, un mélange d'anciens solitaires et d'anciens domestiques comme eux. Nivéus et Nubes intègrent ce groupe, y trouvant temporairement un semblant de stabilité."
    }
   ]
  },
  {
   "titre": "La rupture des chemins",
   "age": "15 lunes",
   "paragraphes": [
    {
     "texte": "Le groupe se dissout. Nivéus choisit de suivre Basil, un ancien domestique dont il est tombé amoureux, convaincu que cet amour leur offrira une sécurité durable. Nubes, méfiant, refuse de les suivre. Les deux frères se séparent pour la première fois de leur plein gré — Nubes reprenant seul la route."
    }
   ]
  },
  {
   "titre": "La rencontre avec Mistral",
   "age": "22 lunes",
   "paragraphes": [
    {
     "texte": "Au détour de son voyage, Nubes tombe sur un jeune chaton livré à lui-même, à peine âgé de 3 lunes. Sans réfléchir, il décide de le prendre sous son aile et le baptise Mistral. Ce qui devait n'être qu'un geste ponctuel devient le début d'une nouvelle vie à deux."
    }
   ]
  },
  {
   "titre": "L'arrivée au Clan du Vent",
   "age": "35 lunes",
   "paragraphes": [
    {
     "texte": "Après treize lunes passées à voyager aux côtés de Mistral, Nubes prend une décision qu'il n'aurait jamais imaginée : rejoindre un clan. Le Clan du Vent les accueille tous deux — Nubes devient Nuage Blanc, apprenti, et Mistral trouve enfin un territoire."
    }
   ]
  },
  {
   "titre": "Une place à trouver",
   "age": "36 lunes — aujourd'hui",
   "paragraphes": [
    {
     "texte": "Une lune s'est écoulée depuis son arrivée. Nuage Blanc apprend encore à trouver sa place au sein du clan, entre méfiance instinctive et désir sincère, bien que rarement avoué, de s'y enraciner enfin."
    }
   ],
   "citation": "La suite de son histoire s'écrit directement en jeu : retrouve ses fils de rôle-play dans « Fils RP »."
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('genealogie', $json${
 "origine": "Une portée de quatre chatons, une famille éclatée par le sort, puis celle qu'il a lui-même choisie.",
 "groupes": [
  {
   "titre": "Famille biologique",
   "membres": [
    {
     "nom": "Sidus",
     "role": "Père (PNJ)",
     "statut": "vivant",
     "texte": "Matou au pelage entièrement blanc et immaculé, aux yeux bleu clair, et sourd. Nuage Blanc ne le connaît pas ; il n'en garde aucun souvenir."
    },
    {
     "nom": "Mundus",
     "role": "Mère (PNJ)",
     "statut": "vivant",
     "texte": "Féline au pelage long et magnifique, blanc marqué d'un motif van noir, aux yeux d'un jaune doré. Il n'a que très peu de souvenirs d'elle."
    },
    {
     "nom": "Caelum",
     "role": "Sœur (PNJ)",
     "statut": "disparu",
     "texte": "Féline au pelage entièrement blanc, marquée d'un motif van noir comme leur mère. Il perdit sa trace alors qu'ils n'avaient que 3 lunes."
    },
    {
     "nom": "Pluvia",
     "role": "Premier frère (PNJ)",
     "statut": "decede",
     "texte": "Chaton entièrement blanc aux yeux particulièrement clairs dès la naissance. Il mourut au bout de deux jours seulement."
    },
    {
     "nom": "Nivéus",
     "role": "Second frère (PNJ)",
     "statut": "vivant",
     "texte": "Félin au pelage entièrement blanc et malentendant. Ils étaient inséparables, jusqu'à leur séparation vers leurs 15 lunes."
    }
   ]
  },
  {
   "titre": "Descendance & conjoint",
   "membres": [
    {
     "nom": "Mistral",
     "role": "Fils adoptif",
     "joueur": "PJ",
     "statut": "vivant",
     "mise": true,
     "texte": "Durant ses voyages, alors âgé de 22 lunes, Nuage Blanc tomba sur ce jeune chaton gris de 3 lunes, livré à lui-même dans la nature. Sûr que ce petit ne pourrait pas s'en sortir seul, il le prit sous son aile."
    },
    {
     "nom": "Conjoint(e)",
     "statut": "vide",
     "texte": "Aucun pour le moment. À vrai dire, il ne s'en formalise pas outre mesure."
    }
   ]
  },
  {
   "titre": "Au Clan du Vent",
   "membres": [
    {
     "nom": "Reflet Dorée",
     "role": "Mentore (PNJ)",
     "statut": "vivant",
     "texte": "Guerrière de renom au sein du clan, elle serait, d'après ce qu'il a entendu, une descendante d'Étoile de Nuit — bien qu'il ne mesure pas vraiment l'importance de ce nom à ses yeux."
    }
   ]
  }
 ]
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('relations', $json$[
 {
  "nom": "Mistral",
  "role": "Fils adoptif",
  "clan": "Clan du Vent",
  "joueur": "PJ",
  "avis": [
   {
    "lune": 22,
    "affinite": 3,
    "texte": "Un chaton gris de 3 lunes, seul dans la nature. Sûr qu'il ne s'en sortirait pas, il le prend sous son aile."
   },
   {
    "lune": 35,
    "affinite": 3,
    "texte": "Treize lunes de voyage plus tard, il rejoint un clan en grande partie pour lui offrir un territoire."
   }
  ]
 },
 {
  "nom": "Reflet Dorée",
  "role": "Mentore",
  "clan": "Clan du Vent",
  "joueur": "PNJ",
  "avis": [
   {
    "lune": 35,
    "respect": true,
    "texte": "Guerrière de renom, descendante d'Étoile de Nuit d'après ce qu'il a entendu. Il ne mesure pas encore ce que ce nom représente."
   }
  ]
 },
 {
  "nom": "Aube de Givre",
  "role": "Lui apprend l'histoire des clans",
  "clan": "Clan du Vent",
  "joueur": "PNJ",
  "avis": [
   {
    "lune": 36,
    "texte": "Grâce à elle, il découvre peu à peu l'histoire des quatre territoires, avec une bonne dose de scepticisme."
   }
  ]
 },
 {
  "nom": "Nivéus",
  "role": "Frère",
  "clan": "Sans clan",
  "joueur": "PNJ",
  "avis": [
   {
    "lune": 3,
    "affinite": 3,
    "texte": "Inséparables : recueillis ensemble, arrachés ensemble à leur sœur."
   },
   {
    "lune": 15,
    "affinite": 2,
    "mitige": true,
    "texte": "Nivéus suit Basil ; Nubes, méfiant, refuse. Première séparation de leur plein gré."
   }
  ]
 },
 {
  "nom": "Caelum",
  "role": "Sœur",
  "clan": "Sans clan",
  "joueur": "PNJ",
  "avis": [
   {
    "lune": 3,
    "texte": "Adoptée par des bipèdes. Il perdit sa trace."
   }
  ]
 },
 {
  "nom": "Pluvia",
  "role": "Frère",
  "clan": "Sans clan",
  "joueur": "PNJ",
  "mort": true,
  "avis": [
   {
    "lune": 0,
    "texte": "Le plus fragile de la portée, mort deux jours après la naissance."
   }
  ]
 }
]$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('fils', $json$[
 {
  "titre": "Première chasse sur la Lande",
  "lune": 36,
  "enCours": true,
  "lien": "https://discord.com/channels/1463578265292640592/1540830461486432358",
  "participants": "Rafale des Joncs, Reflet de Primevère",
  "description": "La première sortie de chasse de Nuage Blanc sur la lande du Clan du Vent."
 }
]$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('sante', $json$[
 {
  "titre": "Héméralopie",
  "type": "maladie",
  "statut": "sequelle",
  "gravite": "grave",
  "lune": 0,
  "description": "Hypersensibilité à la lumière liée à son pelage blanc : le jour est une agression, la nuit un don.",
  "soins": "Aucun remède. Il évite les étendues dégagées, les surfaces réfléchissantes et le plein jour.",
  "sequelles": "Permanente. Vision nocturne exceptionnelle en contrepartie."
 },
 {
  "titre": "Balafre à la patte arrière gauche",
  "type": "blessure",
  "statut": "sequelle",
  "gravite": "legere",
  "description": "Une chute survenue lors de ses longues lunes d'errance.",
  "sequelles": "Cicatrice discrète."
 }
]$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('jouer', $json${
 "statut": "ouvert",
 "statutTexte": "Ouvert aux fils de jeu de rôle — de préférence à la tombée de la nuit.",
 "intro": "Quelques repères pour écrire avec Nuage Blanc sans fausse note. Tout est modifiable depuis le dashboard.",
 "contact": "Pour lancer un fil, écris sur le serveur Discord du Prix de la Trêve.",
 "aborder": [
  {
   "nom": "Viens à lui de nuit",
   "texte": "Au crépuscule ou à l'aube il est lui-même ; en plein soleil il est en retrait, yeux plissés, de mauvaise humeur."
  },
  {
   "nom": "Sois patient",
   "texte": "Sa confiance se gagne lentement, par des actes plus que des mots. Il testera ton sérieux avant de baisser sa garde."
  },
  {
   "nom": "Reste simple",
   "texte": "Il n'aime ni l'incertitude ni les grands discours. Va droit au but, il appréciera."
  }
 ],
 "accepte": [
  {
   "nom": "Missions de nuit",
   "texte": "Patrouilles nocturnes, garde du camp, chasse au clair de lune."
  },
  {
   "nom": "Scènes de protection",
   "texte": "Il se placera entre toi et le danger, sans qu'on le lui demande."
  },
  {
   "nom": "Moments calmes et silencieux",
   "texte": "Partager un abri, une proie, une toilette discrète."
  },
  {
   "nom": "Rivalités et sarcasmes",
   "texte": "Il adore avoir le dernier mot, avec un humour sec."
  }
 ],
 "refuse": [
  {
   "nom": "Amitié instantanée",
   "texte": "Pas de confiance immédiate : il se méfie de tout le monde."
  },
  {
   "nom": "Trahison sans conséquence",
   "texte": "Si on le trahit, c'est définitif. Il n'y a pas de pardon."
  },
  {
   "nom": "Décisions à sa place",
   "texte": "Merci de ne pas contrôler Nuage Blanc : demande-moi, il réagira en cohérence."
  }
 ],
 "accroches": [
  {
   "nom": "Patrouille de nuit",
   "texte": "Deux félins que tout oppose se retrouvent sur le même tour de garde, au milieu de la lande."
  },
  {
   "nom": "Une proie rare",
   "texte": "Un moineau repéré au crépuscule : un défi qu'il ne pourra pas refuser."
  },
  {
   "nom": "Le terrier",
   "texte": "Une tempête force tout le monde à s'abriter ensemble. Il déteste ça."
  },
  {
   "nom": "Les histoires des clans",
   "texte": "Quelqu'un lui raconte une légende. Il est sceptique, mais écoute."
  },
  {
   "nom": "Le grand jour",
   "texte": "Une mission en plein soleil le met en difficulté : l'occasion de voir ce qu'il cache."
  }
 ],
 "notes": "Merci de respecter son handicap (héméralopie) et son caractère : il ne change pas du jour au lendemain."
}$json$::jsonb)
on conflict (cle) do nothing;

insert into public.nubes_contenus (cle, valeur) values ('galerie', $json$[
 {
  "fichier": "nuage-blanc.webp",
  "titre": "Portrait officiel",
  "etiquette": "Référence",
  "auteur": "Araxia",
  "texte": "Nuage Blanc assis, félin blanc aux yeux bleu foncé.",
  "alt": "Nuage Blanc assis, félin blanc aux yeux bleu foncé, illustration officielle"
 },
 {
  "fichier": "nubes-2.webp",
  "titre": "Nubes, en pied",
  "etiquette": "Artwork",
  "auteur": "Araxia",
  "texte": "",
  "alt": "Nubes en pied"
 },
 {
  "fichier": "avatar.webp",
  "titre": "Portrait",
  "etiquette": "Portrait",
  "auteur": "Araxia",
  "texte": "Gros plan sur son regard.",
  "alt": "Portrait de Nuage Blanc"
 },
 {
  "fichier": "nubes-sprite.webp",
  "titre": "Sprite ClanGen",
  "etiquette": "Sprite",
  "auteur": "ClanGen",
  "texte": "",
  "alt": "Sprite de Nuage Blanc dans ClanGen"
 }
]$json$::jsonb)
on conflict (cle) do nothing;
