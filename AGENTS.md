# Devisia — instructions des agents

## Au début de chaque tour utilisateur

1. Lire intégralement le présent `AGENTS.md` à la racine.
2. Lire intégralement [HANDOFF.md](HANDOFF.md), le handoff de référence à la racine.
3. À partir de ces deux seuls documents, reconstituer l’état du projet, les décisions, les blocages et la prochaine action. Identifier la demande du tour et son périmètre.
4. Après cette lecture initiale, lire les éventuels `AGENTS.md` des sous-dossiers concernés, de la racine vers la cible. Consulter ensuite uniquement les fichiers utiles à la mission. En cas de contexte insuffisant, chercher une preuve ciblée.
5. Si un fichier initial manque, vérifier les noms et emplacements habituels sans ouvrir d’autres documents. Signaler le chemin manquant et proposer sa création. N’attribuer aucune décision au fichier absent.

Respecter les instructions de priorité supérieure de l’environnement. Lire les instructions des skills disponibles qui servent la mission avant de les utiliser. Rapporter les outils et contrôles effectivement utilisés.

## Produit et feuille de route

Devisia est un SaaS pour les entreprises du BTP, y compris les entreprises tous corps d’état. Il évolue vers un ERP de 22 modules interconnectés. Livrer par lots autorisés selon leurs dépendances.

**« Avec Devisia, vous ne remplissez plus vos devis. Vous leur parlez. »** Concevoir la saisie vocale et les échanges avec l’IA autour de cette promesse, jusqu’à la relecture du devis par son auteur.

Les domaines couvrent le CRM et la gestion commerciale, les devis IA, les bibliothèques de prix et d’ouvrages, le contrôle des devis et des marges prévisionnelles, les chantiers et tâches, le planning et les ressources, le pointage, le matériel et les engins, les fournisseurs et achats, les stocks et consommations, la rentabilité réelle, les tableaux de bord, les documents et automatisations, l’apprentissage historique et l’administration SaaS.

**Priorités validées à inscrire dans la roadmap.** Avant toute réalisation, vérifier la phase autorisée et les dépendances dans les documents du projet.

1. Modifier les devis par IA et à la voix.
2. Dupliquer intelligemment les devis.
3. Constituer une bibliothèque personnelle d’ouvrages.
4. Calculer les marges en temps réel.
5. Détecter les omissions avec le radar anti-oubli.
6. Importer les anciens devis PDF.
7. Analyser les factures fournisseurs reçues.
8. Conserver l’historique des prix d’achat.
9. Modifier le planning de chantier.
10. Prévoir les besoins d’achats.
11. Générer les tâches depuis les devis acceptés.
12. Pointer sur mobile et suivre les heures-homme.
13. Mesurer la rentabilité réelle par tâche et par chantier.
14. Alerter sur les dépassements.
15. Améliorer les futurs devis à partir de données historiques validées.

**Sujets reportés jusqu’à nouvelle autorisation** — facturation des clients, plateforme agréée de facturation électronique, signature électronique intégrée, changement de nom ou de domaine et refonte générale de l’application.

## Architecture et intégrité des données

- Avant de coder, identifier le composant, le service, les tables, les fonctions et les tests concernés. Réutiliser l’existant dans l’architecture Next.js, React, TypeScript et Supabase. Justifier toute technologie majeure supplémentaire.
- Préserver les contrats d’API, la compatibilité des migrations et les données historiques. Vérifier les affirmations des anciens documents dans le code, les migrations et les tests du commit concerné.
- Séparer coûts prévisionnels et réels. Compter chaque heure, matériau et dépense une seule fois. Distinguer achat, stock, réservation et consommation.
- Conserver le coût horaire applicable à la date du pointage et la version des devis acceptés. Tracer chaque correction. Signaler les coûts manquants.
- Appliquer des calculs financiers déterministes. Vérifier que les devis et exports clients excluent les coûts internes.
- L’IA propose. Valider la structure des réponses et exiger la validation d’un utilisateur habilité avant toute modification financière. Choisir le modèle adapté, limiter les appels, mesurer tokens et coûts, protéger les données confidentielles envoyées aux modèles et consignées dans les journaux.

## Vérification et livraison

- Utiliser le TDD lorsque pertinent. Exécuter les tests concernés et contrôler les régressions. Les commandes du dépôt sont `npm test`, `npm run typecheck`, `npm run lint` et `npm run build`.
- Pour chaque développement, vérifier les permissions, l’isolation entre entreprises, les politiques Supabase RLS, les calculs financiers et le comportement mobile selon le périmètre touché. Indiquer les résultats, les limites et les contrôles non exécutés.
- Travailler sur une branche dédiée issue de la référence `main` de `crashboom34/devisia`. Présenter une PR avec diff, provenance et validations. Toute écriture directe sur `main` et tout force-push sont interdits.
- Obtenir un accord explicite pour chaque merge, déploiement en production, migration Supabase en production, modification des données réelles ou changement de tarif.
- La production déclarée est `https://devisia.vercel.app`. Le seul projet Supabase de production autorisé est `fwuwzoxanrmsobwfnbxe`. Vérifier la cible avant toute opération autorisée. Garder les clés, mots de passe et données clients hors des instructions, diffs et handoffs.

## Documentation et clôture

| Référence | Usage |
| --- | --- |
| `AGENTS.md` | Règles permanentes de travail. |
| `HANDOFF.md` | État vérifié, décisions en vigueur, blocages et prochaine action. |
| Cahier des charges maître | Vision fonctionnelle et définition des 22 modules. |
| Architecture | Contrats techniques, dépendances et sources de vérité. |
| Roadmap | Ordre des priorités, phases, dépendances et découpage en PR. |
| Rapports de tests | Preuves datées des validations sur une révision identifiée. |

À la fin de chaque intervention significative qui change l’état du projet, mettre à jour uniquement les rubriques concernées du handoff. Dater et sourcer les faits, conserver les décisions applicables, transférer les travaux terminés hors de la liste en cours et signaler les inconnues. Donner la prochaine action, ses préalables, son critère de réussite et les accords attendus. Garder le détail fonctionnel et les rapports dans leurs documents respectifs.

## Référence technique Next.js

Après le rituel initial, appliquer le bloc fourni par la version installée lors d’une intervention sur le code Next.js.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
