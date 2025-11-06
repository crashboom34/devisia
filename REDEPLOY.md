# Comment redéployer la fonction Edge

## Problème actuel
La fonction Edge `generate-estimate` n'est pas à jour et empêche la génération de devis.

## Solution rapide

### Méthode 1: Via le Dashboard Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **fwuwzoxanrmsobwfnbxe**
3. Menu gauche → **Edge Functions**
4. Cliquez sur `generate-estimate`
5. Cliquez sur le bouton **Deploy** ou **Redeploy**

### Méthode 2: Via la CLI (si installée)

```bash
supabase functions deploy generate-estimate
```

## Modifications apportées

La fonction mise à jour inclut:
- **Système de fallback automatique**: Essaie plusieurs modèles si le premier échoue (voir `MODEL_FALLBACK.md`)
- **Gestion du rate limiting**: Détection automatique des erreurs 429 et basculement vers un autre modèle
- Utilisation de `preferred_model_id` (cohérent avec l'interface)
- Utilisation de `.maybeSingle()` pour éviter les erreurs
- Prompt simplifié pour plus de fiabilité
- Meilleure gestion des erreurs
- **Nouveau modèle par défaut**: Qwen 2 7B (plus stable que Gemini 2.0 Flash)

## Test après redéploiement

1. Créez un nouveau projet dans l'application
2. Vérifiez que les 3 devis (eco, standard, premium) sont générés
3. Le projet devrait passer en statut "completed"

## En cas de problème

Vérifiez que la clé API OpenRouter est bien configurée:
- Dashboard → Edge Functions → Secrets
- La clé `OPENROUTER_API_KEY` doit être présente

## Contact

Si le problème persiste après le redéploiement, vérifiez les logs dans:
- Dashboard → Edge Functions → Logs (onglet)
