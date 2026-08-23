# Documentation Devisia

Réorganisation effectuée en Wave 1 (Phase 0 de l'audit) : aucun contenu n'a été supprimé, uniquement rangé. Rien ici n'a été réécrit — la fiabilité de chaque dossier est indiquée ci-dessous pour éviter de prendre une doc obsolète pour l'état réel du produit.

## `architecture/`
Documents décrivant la conception du backend, de l'IA et des abonnements. **À lire avec prudence** : l'audit Phase 0 a mis en évidence des écarts entre plusieurs de ces documents et le code réellement déployé (routage de modèle IA, coefficients de scénario, régénération de devis). Se référer en priorité au rapport d'audit avant de s'appuyer sur ces fichiers pour une décision technique.

## `product/`
Guides utilisateurs et notes d'évolution produit.

## `operations/`
Runbooks d'installation et de déploiement (Supabase, OpenRouter, storage, redeploy). Ce sont les documents les plus susceptibles de rester exacts, car peu liés à la logique métier qui a le plus évolué.

## `archive/`
Comptes-rendus de correctifs ponctuels (voix, mobile, prix, prompts, tests manuels). Valeur essentiellement historique — utile pour comprendre *pourquoi* une décision a été prise, pas pour décrire l'état actuel du code.

---

Pour l'état réel et vérifié du produit à la date du 15 août 2026, voir le rapport d'audit Phase 0 (partagé séparément, non versionné dans ce dépôt).
