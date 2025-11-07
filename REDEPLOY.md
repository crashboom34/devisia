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
- **CORRECTION CRITIQUE**: Récupération de la clé API OpenRouter depuis `system_config` (voir `API_KEY_FIX.md`)
- **Prompt professionnel optimisé**: Économiste du bâtiment 15+ ans, ratios 2024-2025, coefficients régionaux (voir `PROFESSIONAL_PROMPT.md` et `PROMPT_OPTIMIZATION.md`)
- **Système de fallback automatique**: Essaie plusieurs modèles si le premier échoue (voir `MODEL_FALLBACK.md`)
- **Gestion du rate limiting**: Détection automatique des erreurs 429 et basculement vers un autre modèle
- **Contrôle de température**: Ajustable de 0.0 à 1.0 pour contrôler la créativité (voir `TEMPERATURE_CONTROL.md`)
- **Détection JSON robuste**: Multi-formats (code block markdown + JSON brut)
- **Max tokens augmenté**: 6000 tokens pour devis détaillés en 5 catégories
- **Justifications des scénarios**: Chaque devis explique son rapport qualité-prix
- **Structure en 5 catégories**: Gros œuvre, Second œuvre, Finitions, Aménagements ext, Frais annexes
- **Traçabilité complète**: Nom du modèle IA et température utilisés
- **Logging ultra-détaillé**: Déboguer facilement les problèmes de génération
- Utilisation de `preferred_model_id` (cohérent avec l'interface)
- Utilisation de `.maybeSingle()` pour éviter les erreurs
- **Nouveau modèle par défaut**: Qwen 2 7B (plus stable que Gemini 2.0 Flash)

## Test après redéploiement

1. Créez un nouveau projet dans l'application
2. Vérifiez que les 3 devis (eco, standard, premium) sont générés
3. Le projet devrait passer en statut "completed"
4. **NOUVEAU**: Chaque devis devrait afficher:
   - Une boîte bleue avec "💡 Pourquoi ce scénario?" et une justification en 2-3 phrases
   - Le nom du modèle IA utilisé (ex: "Généré par: Qwen 2 7B (GRATUIT)")
   - Structure en 5 catégories: Gros œuvre, Second œuvre, Finitions, Aménagements extérieurs, Frais annexes
   - Coefficients régionaux appliqués si localisation mentionnée (ex: Montpellier +10-15%)
   - Ratios de marché 2024-2025 réalistes (construction 1800-2600€/m²)
   - Frais annexes toujours inclus (études, permis, DO, imprévus)

## En cas de problème

Vérifiez que la clé API OpenRouter est bien configurée:
- Dashboard → Edge Functions → Secrets
- La clé `OPENROUTER_API_KEY` doit être présente

## Contact

Si le problème persiste après le redéploiement, vérifiez les logs dans:
- Dashboard → Edge Functions → Logs (onglet)
