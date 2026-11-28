# Devisia — handoff opérationnel

Mis à jour le **27 novembre 2026**. Commencer chaque tour par le protocole de [AGENTS.md](AGENTS.md).

## État vérifié

- PR #24 P0-A intégrée dans `main@22333b7522b1e27573b9ca4dad761fdc24e8e7e2`. La branche `fix/p0-b-financial-integrity` part de ce commit. La PR #23 a intégré les instructions, le handoff et le cahier maître.
- Le propriétaire indique que l’audit statique préliminaire des 22 modules est terminé. P0-A porte sur les contrats financiers et les tests de la base versionnée.
- Production déclarée par le propriétaire : Vercel, `https://devisia.vercel.app`, Supabase `fwuwzoxanrmsobwfnbxe`. Révision déployée et état des migrations en production non vérifiés.
- Versions installées et verrouillées : Next.js 16.3.8, React 19.3.0, TypeScript 5.2.2 et client Supabase JS 2.116.0. OpenRouter est appelé depuis les Edge Functions. Version distante des services non vérifiée.

## Mission et travaux réalisés

Le précédent lot documentaire préparait les règles permanentes et la reprise du projet avant l’audit. Le périmètre autorisé couvre `AGENTS.md`, `HANDOFF.md` et le versionnement du cahier des charges maître, leur revue et leur PR. Code métier, développement V2, audit détaillé, abonnements, migrations, production et données réelles sont hors périmètre.

- Création du protocole de lecture, des règles métier et de livraison, du premier handoff et ajout du cahier des charges maître. Aucun travail fonctionnel ni migration dans ce lot. **À chaque tour : lire uniquement `AGENTS.md` et `HANDOFF.md` en premier ; tout autre fichier (y compris le cahier maître) n'est consulté qu'ensuite, par sections ciblées si la mission le demande. Ne jamais relire tout le dépôt automatiquement.**
- Contrôles de ce lot : inventaire du checkout et des instructions locales, recoupement avec le commit distant et les versions installées. Contrôles réussis : diff limité aux deux fichiers, git diff --check, liens de reprise, 15 priorités numérotées, promesse exacte, versions du lockfile, cible Supabase et reconnaissance du bloc géré par Next.js.
- Preuves antérieures sur le commit applicatif ci-dessus (session de configuration cloud du 22 novembre) : 174 tests réussis dans 23 fichiers, TypeScript et build réussis, ESLint avec 4 avertissements et aucune erreur. Cinq pages publiques vérifiées en développement et en production locale. Ces vérifications ne couvrent ni une connexion Supabase réelle ni la génération IA de bout en bout.

### P0-A — 22 novembre 2026

- Le [contrat de référence](docs/architecture/P0_A_CONTRATS_FINANCIERS.md) décrit les sources, les contrôles et les dépendances des lots tâches, pointages et consommations. Il distingue les garanties SQL actuelles des décisions à approuver.
- Quatre nouveaux tests locaux rejouent huit migrations sur PostgreSQL PGlite avec données synthétiques. La suite complète passe (178 tests, 24 fichiers), ainsi que le typage et le build. ESLint signale quatre avertissements préexistants. La comparaison avec une instance Supabase hébergée reste ouverte faute de cible de test autorisée identifiée.
- Le budget lu par l’écran et celui lu par les RPC divergent en présence de plusieurs versions. Le pointage conserve son taux initial ; une grille datée et une clé de rejeu des dépenses restent à définir. La revue des accès aux coûts salariaux précède le pointage mobile.

### P0-B — 22 novembre 2026

- Budget v1 et références protégés en base. L’agrégat SQL sert à la lecture financière et à la capture, indépendamment des limites des listes. Les avenants sont validés sous verrou et leur lecture est indépendante de l’ordre.
- Les durées restent lisibles pour les membres disposant du droit de suivi du temps. Les finances chantier sont réservées aux administrateurs habilités et le taux figé est réservé au calcul serveur. [Contrat P0-B et matrice](docs/architecture/P0_B_INTEGRITE_FINANCIERE.md)
- 185 tests Vitest réussis, dont 1 001 dépenses et 1 001 pointages supplémentaires dans un scénario de parité. Concurrence vérifiée sur deux connexions PostgreSQL 17. Typage et build réussis, ESLint avec quatre avertissements préexistants. Contrôle Chromium mobile avec API synthétique et revue indépendante du diff.

### Mise en service P0-B — 23 novembre 2026

- Le HEAD distant et la PR #25 ont été vérifiés au SHA `0c9dca4aa3986884b6976a708a233454e592cd21` avant le correctif local. Le frontend requiert la RPC de résumé. L’ancien écran requiert le taux que la migration d’accès retire.
- Correctif local sur la branche P0-B. Phase 1 pour le contrat financier, puis frontend, puis phase 2 de restriction après retrait des anciens clients. 186 tests locaux réussis. Concurrence et restauration synthétique confirmées sur PostgreSQL 17. [Runbook, dépendances et retour](docs/operations/P0_B_RELEASE_GATE.md)

### Préparation de la répétition P0-B — 23 novembre 2026

- `de5418f23f8dce9095ce870baf44fd7168a5daa8` est l’enfant direct de `0c9dca4aa3986884b6976a708a233454e592cd21`, qui reste le HEAD distant de la branche et de la PR #25. Le correctif concerne les deux étapes SQL, les diagnostics, les tests et la documentation de mise en service.
- La PR #25 atteste une preview Vercel sur `0c9dca4`. L’affectation effective de ses variables Supabase reste inconnue. Toute écriture de recette dans une preview exige une cible de test autorisée.
- Cible proposée : projet Supabase temporaire dans une organisation Free distincte, avec schéma vérifié et données synthétiques. Le premier fichier SQL versionné exige une table préalable `ai_models` et échoue seul sur PostgreSQL vierge (`42P01`). Identifier le schéma initial avant de préparer la base. [Préparation et matrice de répétition](docs/operations/P0_B_RELEASE_GATE.md#préparer-la-cible-de-répétition)

### P1 et release combinée — 24 novembre 2026

- L’action de duplication figure dans la liste et le détail des devis. Elle crée un brouillon dans le même projet, ouvre son éditeur et permet de renommer la copie. Le scénario, les centimes, les remises et les surcharges manuelles sont recopiés. Les postes reçoivent de nouvelles clés. Une relance dans le même dialogue réutilise l’identifiant de demande.
- `release/devisia-p0b-p1` rassemble le P0-B publié, le séquencement et le runbook récupérés du ZIP, et P1. L’intégration séquence SQL phase 1, SQL P1, frontend, puis phase 2 différée. Les droits de copie sont portés par la migration et imposent un brouillon rattaché à un devis du même projet, dans la même entreprise. [Dossier de livraison et commandes](docs/operations/DEVISIA_P0B_P1_RELEASE.md)
- 192 tests Vitest passent sur 25 fichiers. Chromium local à 390 px avec API simulée confirme la déduplication du clic et la gestion des erreurs de permissions. Les alertes npm antérieures au lot et les limites de la qualification sont relevées dans le dossier de livraison.

### Correctif P1 RLS — 27 novembre 2026

- La répétition de l'archive chiffrée sur un PostgreSQL Supabase 17 isolé a réussi, d'après le rapport de l'agent opérateur : 76 tables et 3 842 lignes, codes de restauration 0. P0-B phase 1 et P1 s'appliquent sur la copie.
- Blocage vérifié lors de la première duplication authentifiée : code PostgreSQL `42P17`, récursion de la politique `Protect duplicate quote source` sur `public.estimates`. La migration P1 est modifiée avant toute application en production : la politique appelle désormais une fonction privée à privilèges minimisés pour vérifier l'existence du devis source dans la même organisation et le même projet.
- **Le correctif reste à retester sur PostgreSQL 17 Supabase restauré**, notamment la duplication authentifiée, la soumission directe malveillante, les permissions inter-entreprises et les coûts manuels. Les 192 tests antérieurs ne prouvent pas la correction. Le SHA du candidat de release change ; l'ancien SHA approuvé ne vaut pas approbation du nouveau.
- Aucune migration, fusion ni publication en production autorisée sur ce correctif tant que les tests réels et l'approbation du nouveau SHA ne sont pas obtenus. P0-B phase 2 reste interdite.

## Décisions, sources et écarts

- Le brief du propriétaire du 22 novembre fixe la promesse vocale, les 15 priorités, les reports, les contraintes financières et la cible de production. Le cahier des charges maître consolidé de 22 modules est désormais versionné dans [`docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md`](docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md) (1 704 lignes, 22 modules et annexe détaillée tâches/pointage). Il s'agit de la référence fonctionnelle, pas d'un ordre de tout développer ; la roadmap approuvée et l'architecture cible restent à arrêter après audit.
- L’inventaire initial n’a trouvé aucun AGENTS, handoff, CLAUDE, fichier d’instructions Copilot ou règle Cursor dans le projet, y compris parmi les fichiers locaux hors caches. Aucun historique de handoff à reprendre dans le checkout inspecté.
- `.bolt/prompt` régit les demandes d’interface à Bolt : qualité des écrans, composants clients pour les hooks, cohérence de l’hydratation, Tailwind, shadcn/ui et Lucide, dépendances supplémentaires sur justification. `.bolt/config.json` sélectionne le modèle `nextjs-shadcn`. `.bolt/ignore` liste `components/ui/*` et `hooks/use-toast.ts` pour Bolt. Conserver leur portée locale. La directive sur les logos concerne les icônes de l’interface et n’autorise aucun changement d’identité.
- Le README annonce Next.js 13. Pour le checkout, se fier au lockfile. Le bloc Next.js dans AGENTS reprend la notice de la version installée que le serveur de développement peut générer automatiquement.
- `docs/operations/APPLY_SCHEMA_INSTRUCTIONS.md` cite un autre projet Supabase. Écarter cette cible de toute opération de production. Le guide historique ne vaut pas accord de migration.
- `docs/README.md` signale des écarts déjà connus sur le routage IA, les coefficients de scénario et la régénération. `docs/product/DEVISIA_EVOLUTION_V2.md` décrit un lot antérieur. Ces documents demandent vérification avant réutilisation.
- Conserver l’architecture Next.js/Supabase, les historiques et RLS. Les décisions d’audit sur l’ordre des lots et leurs dépendances restent ouvertes.

## Blocages, autorisations et prochaine action

- **Production en attente** — Le dossier combiné remplace la PR #25 comme référence d’intégration. La production observée le 23 novembre servait P0-A, avec 40 migrations enregistrées. L’historique distant diverge du dépôt et aucune restauration hébergée n’a été vérifiée.
- **Prochaine action** — qualifier la séquence sur une instance Supabase de test autorisée, vérifier l’historique, les ACL PostgREST et la restauration. Les migrations de production P0-B phase 1 et P1, la fusion et le déploiement exigent des accords distincts. La phase 2 exige aussi son propre accord, le retrait des anciens clients et un artefact de repli compatible.
- **Dépendances** — revue des permissions de devis et du lien salarié-compte avant pointage mobile, taux datés et clé de rejeu des dépenses, puis contrats de ventilation des tâches et des consommations.
