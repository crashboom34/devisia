# Devisia — handoff opérationnel

Mis à jour le **22 novembre 2026**. Commencer chaque tour par le protocole de [AGENTS.md](AGENTS.md).

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

## Décisions, sources et écarts

- Le brief du propriétaire du 22 novembre fixe la promesse vocale, les 15 priorités, les reports, les contraintes financières et la cible de production. Le cahier des charges maître consolidé de 22 modules est désormais versionné dans [`docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md`](docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md) (1 704 lignes, 22 modules et annexe détaillée tâches/pointage). Il s'agit de la référence fonctionnelle, pas d'un ordre de tout développer ; la roadmap approuvée et l'architecture cible restent à arrêter après audit.
- L’inventaire initial n’a trouvé aucun AGENTS, handoff, CLAUDE, fichier d’instructions Copilot ou règle Cursor dans le projet, y compris parmi les fichiers locaux hors caches. Aucun historique de handoff à reprendre dans le checkout inspecté.
- `.bolt/prompt` régit les demandes d’interface à Bolt : qualité des écrans, composants clients pour les hooks, cohérence de l’hydratation, Tailwind, shadcn/ui et Lucide, dépendances supplémentaires sur justification. `.bolt/config.json` sélectionne le modèle `nextjs-shadcn`. `.bolt/ignore` liste `components/ui/*` et `hooks/use-toast.ts` pour Bolt. Conserver leur portée locale. La directive sur les logos concerne les icônes de l’interface et n’autorise aucun changement d’identité.
- Le README annonce Next.js 13. Pour le checkout, se fier au lockfile. Le bloc Next.js dans AGENTS reprend la notice de la version installée que le serveur de développement peut générer automatiquement.
- `docs/operations/APPLY_SCHEMA_INSTRUCTIONS.md` cite un autre projet Supabase. Écarter cette cible de toute opération de production. Le guide historique ne vaut pas accord de migration.
- `docs/README.md` signale des écarts déjà connus sur le routage IA, les coefficients de scénario et la régénération. `docs/product/DEVISIA_EVOLUTION_V2.md` décrit un lot antérieur. Ces documents demandent vérification avant réutilisation.
- Conserver l’architecture Next.js/Supabase, les historiques et RLS. Les décisions d’audit sur l’ordre des lots et leurs dépendances restent ouvertes.

## Blocages, autorisations et prochaine action

- **En cours** — branche P0-B publiée. GitHub refuse la création du brouillon via son API (403). [Ouvrir la PR pour revue](https://github.com/crashboom34/devisia/pull/new/fix/p0-b-financial-integrity). L’accord du propriétaire demeure requis pour fusionner, déployer ou appliquer la migration en production.
- **Prochaine action** — vérifier la migration et l’état des références v1 sur une instance explicitement autorisée de développement ou de test. Vérifier le rapprochement écran/capture et examiner séparément toute incohérence historique.
- **Dépendances** — revue des permissions de devis et du lien salarié-compte avant pointage mobile, taux datés et clé de rejeu des dépenses, puis contrats de ventilation des tâches et des consommations.
