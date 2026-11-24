# Release Devisia P0-B + P1

Candidat GitHub `release/devisia-p0b-p1`, depuis `main@22333b7522b1e27573b9ca4dad761fdc24e8e7e2`. Le SHA complet à approuver est celui du HEAD distant indiqué dans la PR de release.

```sh
git fetch origin main release/devisia-p0b-p1
git rev-parse origin/release/devisia-p0b-p1
gh pr view release/devisia-p0b-p1 --repo crashboom34/devisia --json baseRefName,headRefOid,isDraft,statusCheckRollup,url
```

Les patchs de transfert récupèrent les changements de `de5418f23f8dce9095ce870baf44fd7168a5daa8` et de `d463cd0c99b33167d70d84e7826ced76e3997cb9`. Leurs SHA identifient les sources d’origine. Le commit de livraison identifie l’intégration testée.

## Qualification du candidat

- 192 tests Vitest passent sur 25 fichiers. Les tests rejouent P0-B phase 1, P1 puis la phase 2 sur PGlite. Ils vérifient la compatibilité du contrat hérité, les calculs et captures, la duplication et l’isolation inter-entreprises. La copie P1 réussit avant et après le retrait des droits historiques. Les droits d’insertion sont limités aux colonnes nécessaires. La RLS exige un brouillon lié à un devis du même projet et de la même organisation.
- TypeScript et le build Next.js réussissent en local. ESLint relève quatre avertissements préexistants et aucune erreur. Le script de concurrence PostgreSQL requiert un conteneur PostgreSQL 17. Ce script a été contrôlé pour la syntaxe dans cette session. La répétition avec deux connexions est celle du lot P0-B d’origine.
- Chromium à 390 px, API simulée. Le double-clic produit un seul appel, la création passe par l’identifiant retourné et un refus de permission reste visible. Le détail chantier affiche une erreur lorsque la RPC financière est indisponible.
- Le dépôt ne contient aucun workflow GitHub Actions. Le compte connecté ne voit aucun webhook classique sur le dépôt. Le build versionné exécute `next build`, sans commande de migration. Une preview Vercel doit être reliée à une cible de test approuvée avant toute écriture de recette.
- `npm audit --omit=dev` signale Next.js 16.3.8 et Zod, déjà verrouillés dans `main`. Aucun usage applicatif de `use cache`, de Server Actions ou de Zod n’a été trouvé dans les chemins contrôlés. Les images sont configurées sans optimisation. Examiner l’applicabilité des avis et le correctif de dépendances avant production. [Avis Next.js sur les images](https://github.com/advisories/GHSA-2464-fhr4-w9xw) · [Avis Next.js sur le cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr) · [Avis Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)

## Ordre des opérations

| Étape | Artefact | Contrôle après l’étape |
| --- | --- | --- |
| 1 | [P0-B phase 1, 20261122120000](../../supabase/migrations/20261122120000_p0_b_job_financial_integrity.sql) | RPC de résumé visible via PostgREST. Ancien écran encore compatible, dont lecture du taux pour le pointage. Budget v1, devis accepté et capture cohérents. |
| 2 | [P1, 20261123130000](../../supabase/migrations/20261123130000_duplicate_quote.sql) | Colonnes `quote_title` et `duplicate_source_id`, RPC de duplication et octrois vérifiés. Ancien écran utilisable. Copier et modifier un devis de test sans effet sur la source. |
| 3 | Fusion, déploiement Vercel et fumée | Vérifier le commit de production, l’alias public, les droits et les parcours ci-dessous. |
| 4 | [P0-B phase 2, 20261123140000](../../supabase/deferred/20261123140000_p0_b_financial_access_cutover.sql), différée | Anciennes requêtes retirées. Résumé et captures inchangés sur le même jeu de données. Durées lisibles avec le droit de pointage, taux historique inaccessible via l’API et finances réservées aux administrateurs habilités. |

La phase 2 réside dans `supabase/deferred/`. Le CLI découvre les migrations dans `supabase/migrations/`. Le test financier vérifie cette séparation et le refus SQL d’appliquer la phase 2 avant P0-B phase 1 et P1. L’autorisation de la phase 2 dépend aussi des anciens clients et du retour applicatif.

## Avant toute migration hébergée

1. Qualifier la séquence entière sur une cible Supabase de test autorisée et des données synthétiques. Rejouer les parcours sur la version servie et le candidat. Les tests PGlite du dépôt utilisent une sélection de migrations et une fixture initiale.
2. Confirmer le projet cible. Pour la production, la référence est `fwuwzoxanrmsobwfnbxe`. Relever le SHA et l’identifiant Vercel actifs, les fonctions et les droits effectifs, les versions du registre Supabase et les consommateurs historiques. Exécuter le [diagnostic v1](../../scripts/p0-b-budget-v1-diagnostic.sql) dans une transaction en lecture seule et consigner uniquement les résultats agrégés.
3. Comparer les migrations par version et par effet SQL. L’inventaire du 23 novembre a relevé `20251024111843` et `20251025091431` côté production, absentes du dépôt, et `20251106180000` côté dépôt, absente de cet inventaire distant. Un push depuis le checkout brut n’est donc pas une procédure de mise en service. Si la migration `20261122120000` a déjà été appliquée sous forme monolithique, conserver son enregistrement et examiner un correctif en avant. En cas de divergence financière, d’effet SQL inexpliqué ou de risque de perte de données, suspendre la migration.
4. Identifier un point de sauvegarde récent ou un marqueur PITR. Rétablir ce point sur une cible distincte et autorisée. Contrôler schéma, historique des migrations, accès et données nécessaires, puis noter durée, RPO, RTO et moyen de préserver les écritures ultérieures. Vérifier séparément le stockage d’objets si nécessaire. [Sauvegardes Supabase](https://supabase.com/docs/guides/platform/backups)

## Appliquer un seul fichier à la fois

Utiliser un répertoire opérateur isolé avec Supabase CLI v3. Y récupérer l’historique de la cible (`supabase migration fetch --remote=<référence>`) et vérifier qu’il concorde avec le registre. Ne copier dans son répertoire `supabase/migrations/` qu’un seul nouveau fichier depuis le candidat, dans l’ordre du tableau. Conserver les fichiers d’historique dans le répertoire opérateur. Vérifier le SHA et l’empreinte du fichier sélectionné.

```sh
supabase migration list --remote=<référence>
supabase db push --dry-run --remote=<référence>
```

Le dry run doit afficher exactement la version de l’étape. Après accord, lancer `supabase db push --remote=<référence>` dans ce répertoire, puis refaire `supabase migration list --remote=<référence>` et les vérifications de l’étape. Exécuter la migration pendant le créneau testé, avec la limite d’attente de verrou qualifiée en répétition. Garder le relevé de version et d’empreinte. Une fois la phase 2 autorisée, copier alors son fichier différé dans le répertoire opérateur. Reporter cette version dans le suivi des migrations avant un futur push général. [Supabase CLI v3](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3)

## Fusion et vérification Vercel

- Obtenir séparément les accords de fusion et de déploiement. La fusion peut déclencher automatiquement Vercel. Confirmer que les étapes 1 et 2 sont en place, que `main` contient la base revue et que les contrôles correspondent au SHA approuvé.
- Après revue, rendre la PR prête. Fusionner via GitHub avec contrôle du HEAD approuvé, par exemple `gh pr merge <numéro> --repo crashboom34/devisia --merge --match-head-commit <sha-approuvé>`. Vérifier le SHA de fusion et l’arbre réellement fusionné. Si `main` a changé depuis la qualification, vérifier l’intégration et actualiser les preuves avant fusion.
- Vérifier dans Vercel un déploiement `production` `READY` provenant de ce SHA de fusion et l’alias `devisia.vercel.app` associé à cet identifiant. Confirmer que le domaine sert l’application. Les écritures de recette sont réservées aux comptes et données de test autorisés. [Déploiements Git Vercel](https://vercel.com/docs/git)

## Fumée et décision sur la phase 2

- Se connecter sur mobile et bureau. Créer et modifier un devis de test. Dupliquer un brouillon, un devis envoyé, accepté ou refusé selon les fixtures disponibles. Comparer postes, HT, TVA, TTC, remises et coûts manuels autorisés. Confirmer que la copie est un brouillon et que le devis source reste identique.
- Accepter le devis test prévu et vérifier le chantier et son budget v1. Ajouter et corriger un pointage, saisir une dépense et approuver un avenant. Comparer le vendu révisé, le réel et la projection avec la capture. Tester la clôture sur une fixture dédiée.
- Vérifier les réponses en tant qu’administrateur, membre et administrateur d’une autre entreprise. Examiner les erreurs Vercel et Supabase, dont échecs de résolution RPC, `42501` inattendus, incohérences v1 et délais de verrou. Garder les identifiants et données réels hors du rapport.
- Pour la phase 2, confirmer que les intégrations, anciens onglets et anciens bundles ont cessé les lectures supprimées et qu’un artefact de repli compatible a été testé. Sinon différer la phase 2. Les droits hérités sur les lectures financières membres et le taux de pointage restent alors soumis aux politiques historiques. Consigner cette fenêtre et l’accord requis.

## Retour

Avec phase 1 et P1 seules, rebasculer vers l’artefact Vercel antérieur qualifié et conserver les migrations compatibles. Contrôler l’alias et les parcours historiques. Après phase 2, revenir uniquement à un artefact dont les requêtes respectent les nouveaux droits. Préférer une correction en avant qui conserve les données et la protection des taux. Une restauration qui remplace l’état de la base exige une autorisation et un plan de réconciliation des écritures depuis le point de reprise. [Détail P0-B](P0_B_RELEASE_GATE.md#retour)
