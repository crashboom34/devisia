# Devisia — handoff opérationnel

Mis à jour le **22 novembre 2026**. Commencer chaque tour par le protocole de [AGENTS.md](AGENTS.md).

## État vérifié

- P0-A sur `docs/p0-a-financial-contracts`, issue de `main@2c05f11182b6bde73f184221e727a69804bbad11`. Ce commit intègre la PR #23 (instructions, handoff et cahier maître). Dernier lot applicatif précédemment identifié : PR #22.
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

## Décisions, sources et écarts

- Le brief du propriétaire du 22 novembre fixe la promesse vocale, les 15 priorités, les reports, les contraintes financières et la cible de production. Le cahier des charges maître consolidé de 22 modules est désormais versionné dans [`docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md`](docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md) (1 704 lignes, 22 modules et annexe détaillée tâches/pointage). Il s'agit de la référence fonctionnelle, pas d'un ordre de tout développer ; la roadmap approuvée et l'architecture cible restent à arrêter après audit.
- L’inventaire initial n’a trouvé aucun AGENTS, handoff, CLAUDE, fichier d’instructions Copilot ou règle Cursor dans le projet, y compris parmi les fichiers locaux hors caches. Aucun historique de handoff à reprendre dans le checkout inspecté.
- `.bolt/prompt` régit les demandes d’interface à Bolt : qualité des écrans, composants clients pour les hooks, cohérence de l’hydratation, Tailwind, shadcn/ui et Lucide, dépendances supplémentaires sur justification. `.bolt/config.json` sélectionne le modèle `nextjs-shadcn`. `.bolt/ignore` liste `components/ui/*` et `hooks/use-toast.ts` pour Bolt. Conserver leur portée locale. La directive sur les logos concerne les icônes de l’interface et n’autorise aucun changement d’identité.
- Le README annonce Next.js 13. Pour le checkout, se fier au lockfile. Le bloc Next.js dans AGENTS reprend la notice de la version installée que le serveur de développement peut générer automatiquement.
- `docs/operations/APPLY_SCHEMA_INSTRUCTIONS.md` cite un autre projet Supabase. Écarter cette cible de toute opération de production. Le guide historique ne vaut pas accord de migration.
- `docs/README.md` signale des écarts déjà connus sur le routage IA, les coefficients de scénario et la régénération. `docs/product/DEVISIA_EVOLUTION_V2.md` décrit un lot antérieur. Ces documents demandent vérification avant réutilisation.
- Conserver l’architecture Next.js/Supabase, les historiques et RLS. Les décisions d’audit sur l’ordre des lots et leurs dépendances restent ouvertes.

## Blocages, autorisations et prochaine action

- **En cours** : revue de la branche P0-A. Aucun changement métier ou schéma dans ce lot.
- **Décisions attendues** : adopter v1 et ses montants comme référence protégée, fixer la visibilité des coûts individuels et le choix du taux à la date travaillée, puis valider les règles de ventilation et de rejeu avant de créer les producteurs de tâches, d’heures et de consommations.
- **Prochaine action** : après approbation, ouvrir un lot correctif distinct sur la référence budgétaire et les droits. Critère de réussite : même vendu et même budget révisé à l’écran et dans la capture avec deux versions et des avenants, historique conservé et permissions vérifiées sur données synthétiques.
- **Validation distante** : comparer ensuite le schéma et les droits avec une instance explicitement désignée comme développement/test. L’accord du propriétaire demeure requis pour tout merge, déploiement ou migration de production.
