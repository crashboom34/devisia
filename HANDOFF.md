# Devisia — handoff opérationnel

Mis à jour le **22 novembre 2026**. Commencer chaque tour par le protocole de [AGENTS.md](AGENTS.md).

## État vérifié

- Dépôt `crashboom34/devisia`. Branche de préparation `docs/agents-handoff`, créée depuis `work` au même commit que `refs/heads/main` distant. **Commit applicatif de référence** : `96f3f439c9c352f5a5e237cc4fba1866e039f2fe` (vérifié par Git). Pour le dernier commit documentaire, utiliser `git log -1 -- AGENTS.md HANDOFF.md`.
- Dernier lot intégré identifié par Git : PR #22, branche `feat/mobile-team-cost-catalog-quote-edit`. Les derniers commits du lot portent sur le badge mobile, les totaux de devis et la préservation des lignes de coût manuelles. La présence sur `main` ne prouve pas un déploiement.
- Branche documentaire publiée et vérifiée sur GitHub. **PR #23 ouverte en brouillon** : `https://github.com/crashboom34/devisia/pull/23` ; la fusion est soumise à accord explicite. La branche contient `AGENTS.md`, `HANDOFF.md` et le cahier maître. Le retour `Forbidden` rencontré lors de la première tentative est résolu.
- Production déclarée par le propriétaire : Vercel, `https://devisia.vercel.app`, Supabase `fwuwzoxanrmsobwfnbxe`. Révision déployée et état des migrations en production non vérifiés.
- Versions installées et verrouillées : Next.js 16.3.8, React 19.3.0, TypeScript 5.2.2 et client Supabase JS 2.116.0. OpenRouter est appelé depuis les Edge Functions. Version distante des services non vérifiée.

## Mission et travaux réalisés

Le lot documentaire prépare les règles permanentes et la reprise du projet avant l’audit. Le périmètre autorisé couvre `AGENTS.md`, `HANDOFF.md` et le versionnement du cahier des charges maître, leur revue et leur PR. Code métier, développement V2, audit détaillé, abonnements, migrations, production et données réelles sont hors périmètre.

- Création du protocole de lecture, des règles métier et de livraison, du premier handoff et ajout du cahier des charges maître. Aucun travail fonctionnel ni migration dans ce lot. **À chaque tour : lire uniquement `AGENTS.md` et `HANDOFF.md` en premier ; tout autre fichier (y compris le cahier maître) n'est consulté qu'ensuite, par sections ciblées si la mission le demande. Ne jamais relire tout le dépôt automatiquement.**
- Contrôles de ce lot : inventaire du checkout et des instructions locales, recoupement avec le commit distant et les versions installées. Contrôles réussis : diff limité aux deux fichiers, git diff --check, liens de reprise, 15 priorités numérotées, promesse exacte, versions du lockfile, cible Supabase et reconnaissance du bloc géré par Next.js.
- Preuves antérieures sur le commit applicatif ci-dessus (session de configuration cloud du 22 novembre) : 174 tests réussis dans 23 fichiers, TypeScript et build réussis, ESLint avec 4 avertissements et aucune erreur. Cinq pages publiques vérifiées en développement et en production locale. Ces vérifications ne couvrent ni une connexion Supabase réelle ni la génération IA de bout en bout.

## Décisions, sources et écarts

- Le brief du propriétaire du 22 novembre fixe la promesse vocale, les 15 priorités, les reports, les contraintes financières et la cible de production. Le cahier des charges maître consolidé de 22 modules est désormais versionné dans [`docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md`](docs/product/DEVISIA_CAHIER_DES_CHARGES_MAITRE.md) (1 704 lignes, 22 modules et annexe détaillée tâches/pointage). Il s'agit de la référence fonctionnelle, pas d'un ordre de tout développer ; la roadmap approuvée et l'architecture cible restent à arrêter après audit.
- L’inventaire initial n’a trouvé aucun AGENTS, handoff, CLAUDE, fichier d’instructions Copilot ou règle Cursor dans le projet, y compris parmi les fichiers locaux hors caches. Aucun historique de handoff à reprendre dans le checkout inspecté.
- `.bolt/prompt` régit les demandes d’interface à Bolt : qualité des écrans, composants clients pour les hooks, cohérence de l’hydratation, Tailwind, shadcn/ui et Lucide, dépendances supplémentaires sur justification. `.bolt/config.json` sélectionne le modèle `nextjs-shadcn`. `.bolt/ignore` liste `components/ui/*` et `hooks/use-toast.ts` pour Bolt. Conserver leur portée locale. La directive sur les logos concerne les icônes de l’interface et n’autorise aucun changement d’identité.
- Le README annonce Next.js 13. Pour le checkout, se fier au lockfile. Le bloc Next.js dans AGENTS reprend la notice de la version installée que le serveur de développement peut générer automatiquement.
- `docs/operations/APPLY_SCHEMA_INSTRUCTIONS.md` cite un autre projet Supabase. Écarter cette cible de toute opération de production. Le guide historique ne vaut pas accord de migration.
- `docs/README.md` signale des écarts déjà connus sur le routage IA, les coefficients de scénario et la régénération. `docs/product/DEVISIA_EVOLUTION_V2.md` décrit un lot antérieur. Ces documents demandent vérification avant réutilisation.
- Conserver l’architecture Next.js/Supabase, les historiques et RLS. Les décisions d’audit sur l’ordre des lots et leurs dépendances restent ouvertes.

## Blocages, autorisations et prochaine action

- **En cours** : faire relire la PR #23 documentaire actualisée et recueillir l'approbation du propriétaire. Le merge requiert son accord. Aucun déploiement n’est attendu pour le présent lot.
- **Dépendance externe** : pour valider ultérieurement les parcours connectés, renseigner le projet Supabase de développement et sa clé publique dans les paramètres cloud, autoriser son domaine et vérifier OpenRouter côté Edge Functions. Cette dépendance concerne les essais connectés.
- **Prochaine action** : après approbation puis fusion de la PR #23, lancer le prompt d'audit. Au début du tour, lire les deux seuls fichiers de démarrage ; ensuite consulter le cahier maître versionné et ses sections pertinentes pour l'audit des 22 modules. La version de référence est celle du commit audité. Ne pas faire de lecture exhaustive du code sans objectif ciblé.
- **Critère de passage** : instructions et handoff approuvés, périmètre de l’audit explicite et sources de référence identifiées ou lacunes signalées. Le prochain lot peut alors produire un audit d’architecture et une roadmap par dépendances, sous le périmètre du nouveau prompt.
