# P0-B — Référence budgétaire et cohérence des calculs

Le lot prolonge le [contrat P0-A](P0_A_CONTRATS_FINANCIERS.md) intégré par la PR #24 dans `main@22333b7`. La migration et les vérifications utilisent uniquement des données synthétiques. [Migration P0-B](../../supabase/migrations/20261122120000_p0_b_job_financial_integrity.sql)

## Écritures et calculs

- La version 1 fixe le vendu initial et les cinq enveloppes du budget. L’acceptation d’un devis crée le chantier et l’unique v1 dans la même transaction. Un chantier préexistant pour ce devis exige une réconciliation explicite. L’acceptation verrouille le devis et le projet. Une édition directe des coûts prend le verrou sur le même devis et renouvelle sa révision.
- Les copies contractuelles sur `jobs` doivent correspondre à v1. Les identifiants du chantier et de ses sources sont figés. Le projet rattaché conserve son organisation. Les instantanés existants, y compris les versions ultérieures de budget, restent consultables pour les utilisateurs habilités. La clôture passe par la capture à 100 % et une seconde clôture est refusée.
- La RPC `get_job_financial_summary` et la capture utilisent le même calcul SQL. Les agrégats de dépenses, de pointages et d’avenants sont indépendants des limites d’affichage. Une absence de v1 ou un écart de référence rend le calcul indisponible. La liste des chantiers étiquette les montants de référence comme initiaux.
- À chaque approbation, le solde commercial global et l’enveloppe de coût concernée doivent rester positifs ou nuls. Les approbations d’un même chantier se sérialisent sur sa ligne. En isolation renforcée, une transaction concurrente peut recevoir le code PostgreSQL `40001` et requérir un rejeu intégral. Les avenants approuvés restent immuables. La lecture agrège les approbations validées indépendamment de leur ordre. Transport et consommables rejoignent l’enveloppe « autres ».
- La projection de l’écran transforme le coût réel déjà agrégé, sans relecture des écritures. Le pourcentage accepte deux décimales, de 0,01 à 100. Calculer en points de base et centimes entiers, avec un arrondi au centime supérieur à la demi-unité. La capture applique la même règle. La marge initiale dérive du vendu et du budget v1. Les marges révisée, courante et projetée retranchent respectivement le budget révisé, le réel et le coût projeté du vendu révisé. Ce sont des marges chantier.

## Autorisations effectives et prérequis au pointage mobile

| Profil métier | Rôle disponible | Durées | Coûts individuels | Finances de chantier |
| --- | --- | --- | --- | --- |
| Administrateur d’entreprise | `owner` ou `admin` | Lecture et saisie sous droit de suivi du temps | Fiche salarié sous droit de gestion d’équipe. Le taux figé du pointage reste côté base pour le calcul. | Vendu, budget, dépenses et avenants selon les droits produit. Capture et lecture de l’historique sous droit historique. |
| Direction ou gestionnaire désigné | Même rôle `owner` ou `admin` | Mêmes droits | Mêmes droits | Le droit `job_management` donne au gestionnaire habilité le total exhaustif, même si l’organisation ne dispose plus du droit de saisir des pointages. Le total inclut alors la main-d’œuvre déjà saisie. |
| Chef de chantier | `member` en l’absence d’un rôle dédié | Colonnes de durée de son organisation sous droit de suivi du temps. L’affectation à un chantier demeure à modéliser. | Taux figé et fiche salarié hors de ce rôle. | Accès réservé aux administrateurs. |
| Salarié | `member` en l’absence d’un lien salarié ↔ compte | Même visibilité de durée que le chef de chantier. La lecture limitée à ses propres affectations attend ce lien. | Taux figé et fiche salarié hors de ce rôle. | Accès réservé aux administrateurs. |

Le contrôle des droits vit dans PostgreSQL. Il combine le rôle de l’organisation, la RLS et les droits produit existants. La lecture des colonnes de pointage exclut le taux individuel, y compris lorsque l’utilisateur est administrateur. Les droits existants sur les coûts prévisionnels des devis constituent une surface distincte du suivi financier de chantier. Prévoir une PR de sécurité avant le pointage mobile pour séparer ces accès, introduire le lien salarié-compte et définir les affectations du chef de chantier.

## Diagnostic des données historiques

Sur une base explicitement autorisée, contrôler l’existence de v1, la concordance des montants et des organisations, et le devis accepté d’origine. La requête suivante est en lecture seule.

```sql
select j.id, j.organization_id, b.id as budget_v1_id,
       j.sold_total_ht_cents as job_sold, b.sold_total_ht_cents as snapshot_sold,
       j.initial_budget_cents as job_budget,
       b.material_cents::numeric + b.labor_cents + b.subcontract_cents
         + b.equipment_cents + b.other_cents as snapshot_budget,
       e.quote_status, e.organization_id as estimate_org, p.organization_id as project_org
from public.jobs j
left join public.job_budget_snapshots b on b.job_id = j.id and b.version = 1
left join public.estimates e on e.id = j.source_estimate_id
left join public.projects p on p.id = j.source_project_id
where b.id is null
   or b.organization_id is distinct from j.organization_id
   or b.sold_total_ht_cents is distinct from j.sold_total_ht_cents
   or j.initial_budget_cents is distinct from
      b.material_cents::numeric + b.labor_cents + b.subcontract_cents + b.equipment_cents + b.other_cents
   or least(b.material_cents, b.labor_cents, b.subcontract_cents, b.equipment_cents, b.other_cents) < 0
   or e.quote_status is distinct from 'accepted' or e.estimate_kind is distinct from 'quote'
   or e.project_id is distinct from j.source_project_id
   or e.organization_id is distinct from j.organization_id
   or p.organization_id is distinct from j.organization_id;
```

Pour chaque anomalie, préserver les versions existantes et rapprocher le devis accepté, l’origine de la v1 et les décisions commerciales. Faire approuver un plan de correction identifié par chantier, avec acteur, justificatifs, valeurs avant/après et vérification dans une transaction dédiée. Réserver l’avenant à une modification commerciale approuvée. Une future migration de correction devra être revue séparément si la référence contractuelle elle-même est incohérente. Déployer ensemble les consommateurs et la nouvelle RPC dans un environnement autorisé. Un retour applicatif peut conserver les garde-fous SQL et la RPC. Une version d’écran qui relit le taux historique directement requiert une adaptation avant ce retour.

## Reproduction des vérifications

- `npm test` inclut les permissions effectives sous rôles synthétiques, plusieurs versions de budget, les refus d’écriture, l’historique conservé et le rapprochement TypeScript/SQL. L’agrégat de référence du scénario vaut 13 205 centimes et la projection à 33,33 % vaut 39 619 centimes. [Tests de contrat](../../tests/financial-contracts.test.ts)
- La concurrence requiert deux connexions. Exécuter `python3 tests/financial-concurrency.py devisia-p0b-test` à la racine après avoir démarré un conteneur PostgreSQL 17 vide de ce nom, isolé du réseau et sans ports publiés. Le test confirme l’attente sur verrou, le rejet du second delta en Read Committed et l’échec de sérialisation en Repeatable Read. [Test PostgreSQL](../../tests/financial-concurrency.py)
- Les contrôles locaux ne mesurent pas les octrois, les historiques et les écarts de schéma d’une instance Supabase hébergée. Une validation de migration et un audit des écarts restent à effectuer sur une cible de test autorisée.
