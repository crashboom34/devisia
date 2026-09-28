# Affinage BTP dans Devisia

## Parcours

1. `/project/new` enregistre la description en brouillon. Aucun devis n'est généré.
2. `/project/[id]`, onglet **Affiner**, recherche au plus trois questions prioritaires à la fois. Les réponses et les versions du dossier sont conservées.
3. **Chiffrer avec les informations actuelles** génère une estimation **HT préliminaire** sur demande. Elle conserve les hypothèses et les points ouverts ; elle n'est ni exportable en PDF ni comptabilisée parmi les devis.
4. Une fois les points ouverts résolus et les montants vérifiés, l'utilisateur choisit la TVA de chaque poste et confirme la transformation en devis. Le serveur recalcule les totaux avant l'export existant.

Les dix domaines documentaires de `BTP_SPECIALISTS` structurent la recherche de questions et le prompt de chiffrage. Il s'agit d'une orchestration de rôles dans les requêtes IA, pas de dix services autonomes ni de prix fournisseurs consultés en temps réel. Les questions de secours fonctionnent lorsque le modèle n'est pas disponible.

## Mise en service

Appliquer `supabase/migrations/20260928090000_project_refinement.sql` **sur le projet Supabase associé à cette application**. Déployer ensuite `refine-project`, `generate-estimate` et `finalize-estimate`, puis le frontend. Vérifier la clé OpenRouter et les modèles actifs du projet cible. Ne pas réutiliser les identifiants d'une autre instance Supabase.

La migration ajoute `estimate_kind` aux devis existants avec la valeur `quote`, deux tables de dossier avec lecture réservée au propriétaire, et une fonction SQL de sauvegarde versionnée accessible seulement au rôle serveur. Les anciennes estimations et leur éditeur restent accessibles.

## Vérifications locales

`npm run test`, `npm run typecheck`, `npm run lint` et `npm run build`. La migration et les fonctions nécessitent un test intégré sur le projet Supabase cible avant mise en service ; elles ne sont pas appliquées par la compilation Next.js.
