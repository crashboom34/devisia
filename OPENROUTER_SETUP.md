# Configuration OpenRouter API

Pour utiliser l'application, vous devez configurer une clé API OpenRouter qui permet d'accéder aux modèles d'IA gratuits.

## Étape 1: Obtenir une clé API OpenRouter

1. Visitez [https://openrouter.ai](https://openrouter.ai)
2. Créez un compte (gratuit)
3. Allez dans **Keys** dans le menu
4. Cliquez sur **Create Key**
5. Copiez votre clé API (commence par `sk-or-...`)

## Étape 2: Configurer la clé dans Supabase

### Option A: Via l'interface Supabase (Recommandé)

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Edge Functions**
4. Cliquez sur l'onglet **Secrets**
5. Ajoutez un nouveau secret:
   - Nom: `OPENROUTER_API_KEY`
   - Valeur: Votre clé API copiée à l'étape 1
6. Cliquez sur **Save**

### Option B: Via Supabase CLI

```bash
supabase secrets set OPENROUTER_API_KEY=votre_clé_ici
```

## Étape 3: Redéployer les Edge Functions

Après avoir configuré la clé, redéployez les fonctions:

```bash
supabase functions deploy generate-estimate
```

## Modèles gratuits disponibles

L'application utilise par défaut **Gemini 2.0 Flash (GRATUIT)** qui est:
- ✅ Complètement gratuit via OpenRouter
- ✅ Ultra-rapide (génération en quelques secondes)
- ✅ Excellent pour la génération de devis structurés
- ✅ Support JSON natif et fiable

D'autres modèles gratuits sont disponibles:
- Qwen 2 7B Instruct (gratuit)

## Vérification

Pour vérifier que tout fonctionne:

1. Connectez-vous à l'application
2. Créez un nouveau projet avec une description détaillée
3. L'application devrait générer 3 scénarios de devis (économique, standard, premium)

## Dépannage

### Erreur "No API key configured"

- Vérifiez que vous avez bien configuré `OPENROUTER_API_KEY` dans les secrets Supabase
- Assurez-vous d'avoir redéployé les Edge Functions après la configuration

### Erreur "No AI model available"

- Vérifiez qu'au moins un modèle est actif dans la base de données
- Le système devrait avoir configuré Gemini 2.0 Flash comme modèle par défaut

### Erreur "No endpoints found for [model]"

- Certains modèles gratuits deviennent parfois indisponibles
- Le système utilise maintenant Gemini 2.0 Flash qui est stable et rapide
- Si le problème persiste, contactez le support

### Erreur de parsing JSON

- Les modèles gratuits peuvent parfois générer du JSON incomplet
- L'application a des mécanismes de réparation automatique
- Si le problème persiste, essayez un modèle payant comme GPT-4 ou Claude 3.5

## Modèles disponibles

### Modèles gratuits (0€)
- **Gemini 2.0 Flash** (par défaut) - Ultra-rapide, excellent pour les devis
- **Qwen 2 7B Instruct** - Performant et rapide

### Modèles économiques (< 0.001$ / 1K tokens)
- **DeepSeek Chat** - 0.00021$ / 1K tokens
- **GPT-4o Mini** - 0.00038$ / 1K tokens
- **Claude 3 Haiku** - 0.00075$ / 1K tokens
- **Llama 3.1 70B** - 0.0004$ / 1K tokens

### Modèles premium (0.001-0.01$ / 1K tokens)
- **Mixtral 8x22B** - 0.0009$ / 1K tokens
- **Gemini Pro 1.5** - 0.00313$ / 1K tokens
- **GPT-4o** - 0.00625$ / 1K tokens
- **Claude 3.5 Sonnet** - 0.009$ / 1K tokens

### Modèles très puissants (> 0.01$ / 1K tokens)
- **Claude 3 Opus** - 0.045$ / 1K tokens
- **GPT-4** - 0.045$ / 1K tokens

## Sélection du modèle

Vous pouvez choisir votre modèle préféré:
1. Dans la page **Paramètres** → Section "Modèle IA"
2. Ou lors de la création d'un nouveau projet

Le modèle sélectionné sera utilisé pour tous vos futurs devis.

## Coûts et crédits

Les modèles payants sont facturés à l'usage via OpenRouter. Vous pouvez:
- Consulter votre consommation dans l'onglet **Usage** (admin)
- Ajouter des crédits sur [OpenRouter Dashboard](https://openrouter.ai/credits)
- Utiliser exclusivement les modèles gratuits pour une utilisation sans frais
