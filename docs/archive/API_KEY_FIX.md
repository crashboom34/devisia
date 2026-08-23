# Correction: Récupération de la clé API OpenRouter

## Problème rencontré

Erreur lors de la génération de devis:
```
Failed to generate eco estimate: All models failed. Last error: Unknown error
```

## Cause racine

La fonction Edge `generate-estimate` n'arrivait pas à utiliser les modèles OpenRouter car:

1. **Les modèles OpenRouter n'ont pas de clé API individuelle** dans la base de données (colonne `api_key` = `null`)
2. **La fonction essayait d'utiliser `Deno.env.get("OPENROUTER_API_KEY")`** mais cette variable d'environnement n'est pas définie dans Supabase Edge Functions
3. **La clé API est stockée dans `system_config`** mais n'était pas récupérée avant la boucle des modèles

Résultat: Tous les modèles étaient "skipped" avec le message "No API key", menant à l'erreur "All models failed".

## Solution implémentée

### 1. Récupération de la clé depuis `system_config`

Ajout d'une requête pour récupérer la clé OpenRouter **avant** d'essayer les modèles:

```typescript
// Récupérer la clé API OpenRouter depuis system_config
const { data: configData } = await supabase
  .from("system_config")
  .select("value")
  .eq("key", "openrouter_api_key")
  .maybeSingle();

const openrouterApiKey = configData?.value || Deno.env.get("OPENROUTER_API_KEY");

if (!openrouterApiKey) {
  console.error("No OpenRouter API key found in system_config or environment");
  throw new Error("OpenRouter API key not configured");
}

console.log("OpenRouter API key found:", openrouterApiKey ? "Yes" : "No");
```

### 2. Utilisation de la clé pour les modèles OpenRouter

Logique améliorée pour choisir la bonne clé API:

```typescript
// Utiliser la clé du modèle, ou la clé OpenRouter pour les modèles OpenRouter, ou l'env var
let llmApiKey = currentModel.api_key;
if (!llmApiKey && currentModel.provider === "openrouter") {
  llmApiKey = openrouterApiKey;
}
if (!llmApiKey) {
  llmApiKey = Deno.env.get("OPENROUTER_API_KEY");
}

if (!llmApiKey) {
  console.log(`No API key for ${currentModel.display_name} (provider: ${currentModel.provider}), skipping...`);
  lastError = `No API key available for ${currentModel.display_name}`;
  continue;
}
```

**Ordre de priorité**:
1. Clé API du modèle (`ai_models.api_key`) - pour les modèles avec clé dédiée
2. Clé OpenRouter globale (`system_config.openrouter_api_key`) - pour tous les modèles OpenRouter
3. Variable d'environnement (`OPENROUTER_API_KEY`) - fallback si disponible

### 3. Logging amélioré

Ajout de logs détaillés pour faciliter le débogage:

```typescript
console.log(`Starting generation with model: ${model.display_name} (${model.model_id})`);
console.log(`Temperature: ${apiTemperature}`);
console.log("OpenRouter API key found:", openrouterApiKey ? "Yes" : "No");
console.log(`Will try ${modelsToTry.length} models:`, modelsToTry.map(m => m.display_name).join(", "));
console.log(`Found ${fallbackModels?.length || 0} fallback models`);
console.log(`Trying model: ${currentModel.display_name} (${currentModel.model_id})`);
console.log(`Sending request to: ${llmApiUrl}`);
console.log(`Response status: ${llmResponse.status}, Time: ${responseTime}ms`);
```

### 4. Gestion d'erreurs améliorée

Messages d'erreur plus informatifs:

```typescript
if (!llmApiKey) {
  console.log(`No API key for ${currentModel.display_name} (provider: ${currentModel.provider}), skipping...`);
  lastError = `No API key available for ${currentModel.display_name}`;
  continue;
}

// Plus tard...
const errorMsg = error instanceof Error ? error.message : String(error);
console.error(`Error with model ${currentModel.display_name}:`, errorMsg);
console.error("Full error object:", JSON.stringify(error, null, 2));
lastError = errorMsg || "Fetch error";
```

## Modèles concernés

Tous les modèles avec `provider = "openrouter"` dans la table `ai_models`:

- ✅ Mistral 7B (Gratuit)
- ✅ Qwen 2 7B (GRATUIT) - modèle par défaut
- ✅ Gemini 2.0 Flash (GRATUIT)
- ✅ DeepSeek Chat
- ✅ Llama 3.1 70B
- ✅ Mixtral 8x22B Instruct
- ✅ Gemini Pro 1.5
- ✅ GPT-4o
- ✅ Claude 3.5 Sonnet
- Et tous les autres modèles OpenRouter

Les modèles avec `provider = "anthropic"` (Claude 3 Haiku direct) utilisent leur propre clé si configurée.

## Vérification

Vous pouvez vérifier que la clé est bien configurée:

```sql
SELECT
  id,
  key,
  value IS NOT NULL as has_value,
  LENGTH(value) as value_length,
  updated_at
FROM system_config
WHERE key = 'openrouter_api_key';
```

Résultat attendu:
```
has_value: true
value_length: 73 (ou proche, selon la clé)
```

## Impact

Avec cette correction:

✅ **Tous les modèles OpenRouter fonctionnent** (gratuits et payants)
✅ **Le système de fallback fonctionne** (essaie 5-6 modèles si nécessaire)
✅ **Les logs sont détaillés** pour identifier facilement les problèmes
✅ **Les messages d'erreur sont clairs** (plus de "Unknown error")

## Redéploiement requis

**Redéployez la fonction Edge** `generate-estimate` pour appliquer la correction:

1. Dashboard: https://supabase.com/dashboard/project/fwuwzoxanrmsobwfnbxe/functions
2. Cliquez sur `generate-estimate`
3. Cliquez sur **Deploy**

## Test après redéploiement

1. Allez sur `/project/new`
2. Créez un projet avec une description simple:
   ```
   Extension de 40m² pour créer un studio indépendant
   ```
3. Les 3 devis (éco, standard, premium) devraient se générer **sans erreur**
4. Le projet passe en statut "completed"
5. Chaque devis affiche:
   - Le nom du modèle utilisé (ex: "Généré par: Qwen 2 7B (GRATUIT)")
   - La justification du scénario (boîte bleue 💡)
   - La structure en 5 catégories

## Logs à surveiller

Dans les logs de la fonction Edge (Supabase Dashboard > Functions > generate-estimate > Logs):

✅ **Succès**:
```
Starting generation with model: Qwen 2 7B (GRATUIT) (qwen/qwen-2-7b-instruct:free)
Temperature: 0.5
OpenRouter API key found: Yes
Found 3 fallback models
Will try 4 models: Qwen 2 7B (GRATUIT), Mistral 7B (Gratuit), Gemini 2.0 Flash (GRATUIT), DeepSeek Chat
Trying model: Qwen 2 7B (GRATUIT) (qwen/qwen-2-7b-instruct:free)
Sending request to: https://openrouter.ai/api/v1/chat/completions
Response status: 200, Time: 3542ms
Successfully used model: Qwen 2 7B (GRATUIT)
```

❌ **Erreur (avant la correction)**:
```
No API key for Qwen 2 7B (GRATUIT) (provider: openrouter), skipping...
No API key for Mistral 7B (Gratuit) (provider: openrouter), skipping...
No API key for Gemini 2.0 Flash (GRATUIT) (provider: openrouter), skipping...
All models failed. Details: No API key available for ...
```

## Architecture

```
┌─────────────────────────────────────────┐
│ User creates project                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Frontend sends to Edge Function         │
│ - projectId, description, scenarioType  │
│ - temperature (0.0-1.0)                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Edge Function: generate-estimate        │
│                                          │
│ 1. Get user's preferred model           │
│    or default model (Qwen 2 7B)         │
│                                          │
│ 2. GET openrouter_api_key               │ ← CORRECTION ICI
│    from system_config                   │
│                                          │
│ 3. Get fallback models (gratuits)       │
│                                          │
│ 4. For each model:                      │
│    - Use model.api_key if exists        │
│    - Else use openrouterApiKey          │ ← NOUVEAU
│    - Send prompt to OpenRouter          │
│    - Parse JSON response                │
│    - If success: break loop             │
│    - If error: try next model           │
│                                          │
│ 5. Save estimate to database            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Response: Estimate data + model used    │
└─────────────────────────────────────────┘
```

## Conclusion

La correction permet maintenant à tous les modèles OpenRouter de fonctionner en récupérant la clé API depuis `system_config` au lieu de se fier à une variable d'environnement inexistante.

C'est une correction **critique** car sans elle, aucun devis ne peut être généré.
