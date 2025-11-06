# Système de Fallback Automatique des Modèles

## Vue d'ensemble

L'application dispose maintenant d'un **système de fallback automatique** qui essaie plusieurs modèles AI en cas d'échec du modèle principal.

## Comment ça fonctionne

Lorsque vous générez un devis:

1. **Modèle principal**: Le système essaie d'abord votre modèle préféré (ou le modèle par défaut)

2. **Fallback automatique**: Si le modèle échoue (rate limit, erreur API, etc.), le système essaie automatiquement d'autres modèles:
   - Tous les modèles gratuits (0€)
   - Les modèles très économiques (< 0.001$/1K tokens)

3. **Ordre des fallbacks**: Les modèles sont essayés par ordre de coût croissant:
   - Qwen 2 7B (gratuit) ← **Modèle par défaut actuel**
   - Gemini 2.0 Flash (gratuit)
   - DeepSeek Chat (0.00021$/1K)
   - GPT-4o Mini (0.00038$/1K)
   - Claude 3 Haiku (0.00075$/1K)

## Cas d'usage typiques

### Rate Limiting
```
Gemini 2.0 Flash est rate-limité
  ↓
Le système bascule automatiquement sur Qwen 2 7B
  ↓
Votre devis est généré sans interruption
```

### Indisponibilité temporaire
```
Votre modèle préféré est indisponible
  ↓
Le système essaie jusqu'à 5 modèles alternatifs
  ↓
Le premier qui fonctionne est utilisé
```

## Pourquoi Qwen 2 7B est maintenant le défaut

**Gemini 2.0 Flash** avait des problèmes de rate limiting fréquents. Nous avons changé pour **Qwen 2 7B** car:

- ✅ Gratuit via OpenRouter
- ✅ Plus stable (moins de rate limiting)
- ✅ Performant pour la génération de devis
- ✅ Contexte de 32K tokens (suffisant pour les devis)

## Logs et transparence

Dans les logs de la fonction Edge, vous verrez:
```
Trying model: Qwen 2 7B (GRATUIT) (qwen/qwen-2-7b-instruct:free)
Successfully used model: Qwen 2 7B (GRATUIT)
```

Ou en cas de fallback:
```
Trying model: Gemini 2.0 Flash (GRATUIT) (google/gemini-2.0-flash-exp:free)
Model Gemini 2.0 Flash (GRATUIT) is rate-limited, trying next model...
Trying model: Qwen 2 7B (GRATUIT) (qwen/qwen-2-7b-instruct:free)
Successfully used model: Qwen 2 7B (GRATUIT)
```

## Désactiver le fallback

Si vous souhaitez utiliser UNIQUEMENT votre modèle sélectionné sans fallback:

1. L'Edge Function devra être modifiée pour retirer la logique de fallback
2. Les échecs seront alors des erreurs définitives

## Suivi de l'usage

Le modèle **réellement utilisé** est enregistré dans les logs d'usage, pas le modèle initialement demandé. Cela permet de suivre précisément les coûts.

## Redéploiement requis

Pour activer ce système, vous devez **redéployer la fonction Edge** `generate-estimate`. Voir le fichier `REDEPLOY.md` pour les instructions.

## Avantages

- 🔄 **Haute disponibilité**: Si un modèle échoue, un autre prend le relais
- 💰 **Optimisation des coûts**: Priorité aux modèles gratuits/économiques
- ⚡ **Pas d'interruption**: Vos devis sont générés même en cas de problème
- 📊 **Traçabilité**: Vous savez toujours quel modèle a été utilisé

## Notes importantes

1. Le fallback ne fonctionne que pour les modèles économiques (< 0.001$/1K tokens)
2. Si vous sélectionnez un modèle payant premium, le fallback sera limité aux modèles moins chers
3. La clé API OpenRouter doit être configurée pour que le système fonctionne
