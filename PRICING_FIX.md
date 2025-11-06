# Correction des Prix et Traçabilité des Modèles

## Problèmes identifiés

### 1. Prix trop bas avec Qwen 2 7B
Les devis générés par Qwen 2 7B étaient 50-60% moins chers que ceux de Gemini:
- Exemple: "reno bouzygues" standard
  - Avec Gemini: 32,100€
  - Avec Qwen: 13,080€

**Cause**: Le prompt n'était pas assez explicite sur les tarifs du marché français.

### 2. Traçabilité des modèles
Il n'était pas possible de savoir quel modèle AI avait généré un devis donné.

## Solutions implémentées

### 1. Prompt amélioré avec tarifs de référence

Le prompt inclut maintenant des **tarifs de référence du marché français 2024**:

```
TARIFS MARCHÉ FRANÇAIS 2024:
- Main d'œuvre artisan: 40-60€/h (éco) | 50-80€/h (standard) | 70-120€/h (premium)
- Peinture intérieure: 20-30€/m² (éco) | 30-50€/m² (standard) | 50-80€/m² (premium)
- Carrelage pose comprise: 40-60€/m² (éco) | 60-90€/m² (standard) | 90-150€/m² (premium)
- Électricité complète: 80-100€/m² (éco) | 100-150€/m² (standard) | 150-250€/m² (premium)
- Plomberie complète: 100-150€/m² (éco) | 150-250€/m² (standard) | 250-400€/m² (premium)
- Isolation combles: 30-50€/m² (éco) | 50-80€/m² (standard) | 80-120€/m² (premium)
- Fenêtres PVC: 300-500€/u (éco) | 500-800€/u (standard) | 800-1500€/u (premium)
- Porte d'entrée: 800-1500€ (éco) | 1500-3000€ (standard) | 3000-6000€ (premium)
```

Ces tarifs sont appliqués avec les multiplicateurs de scénario:
- Éco: 0.7x
- Standard: 1.0x
- Premium: 1.5x

### 2. Colonne `model_used` dans la base de données

**Migration ajoutée**: `add_model_name_to_estimates`

Chaque devis enregistre maintenant le nom du modèle AI utilisé pour le générer.

```sql
ALTER TABLE estimates ADD COLUMN model_used text;
```

### 3. Affichage du modèle dans l'interface

Le composant `EstimateTable` affiche maintenant:
```
Généré par: Qwen 2 7B (GRATUIT)
```

Ou en cas de fallback:
```
Généré par: GPT-4o Mini
```

## Avantages

### Pour les prix
- ✅ Devis plus réalistes et cohérents avec le marché français
- ✅ Tous les modèles utilisent les mêmes tarifs de référence
- ✅ Moins de variation entre les modèles

### Pour la traçabilité
- ✅ Vous savez exactement quel modèle a généré chaque devis
- ✅ Utile pour comparer la qualité entre modèles
- ✅ Important pour le système de fallback (savoir quel modèle de secours a été utilisé)
- ✅ Aide au debugging (si un devis est de mauvaise qualité, vous savez quel modèle éviter)

## Test

Après redéploiement de l'Edge Function:

1. Créez un nouveau projet (ex: "Rénovation maison 100m²")
2. Vérifiez que les 3 devis sont générés avec des prix cohérents:
   - Éco: ~30-40k€
   - Standard: ~45-60k€
   - Premium: ~70-90k€
3. Vérifiez que chaque devis affiche "Généré par: [Nom du modèle]"

## Redéploiement requis

Pour activer ces corrections, **redéployez la fonction Edge** `generate-estimate`.

Voir le fichier `REDEPLOY.md` pour les instructions détaillées.

## Notes

- Les anciens devis n'auront pas la mention du modèle (colonne `model_used` = NULL)
- Les nouveaux devis auront toujours cette information
- Les tarifs de référence peuvent être ajustés dans le fichier `supabase/functions/generate-estimate/index.ts`
