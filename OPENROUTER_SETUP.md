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

L'application utilise par défaut **Llama 3.1 8B Instruct** qui est:
- ✅ Complètement gratuit
- ✅ Rapide
- ✅ Performant pour la génération de devis

D'autres modèles gratuits sont disponibles:
- Mistral 7B Instruct
- Gemma 2 9B
- Llama 3.2 3B

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
- La migration devrait avoir configuré Llama 3.1 8B comme modèle par défaut

### Erreur de parsing JSON

- Les modèles gratuits peuvent parfois générer du JSON incomplet
- L'application a des mécanismes de réparation automatique
- Si le problème persiste, essayez un modèle payant comme GPT-4 ou Claude 3.5

## Coûts

- **Modèles gratuits**: 0€
- **Modèles payants**: Facturation à l'usage via OpenRouter
  - GPT-4: ~0.03-0.06$ / 1K tokens
  - Claude 3.5 Sonnet: ~0.003-0.015$ / 1K tokens
  - Llama 3.1 70B: ~0.0004$ / 1K tokens

Vous pouvez ajouter des crédits sur OpenRouter si vous souhaitez utiliser des modèles payants.
