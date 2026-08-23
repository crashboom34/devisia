# Guide - Comprendre et ajuster les prix des devis

## Résumé des corrections appliquées

✅ **Boîte bleue de justification 💡** : Maintenant visible (champs `model_used` et `scenario_justification` ajoutés)
✅ **Traçabilité du modèle IA** : Affichée sous le numéro de devis
✅ **Erreur de sauvegarde** : Corrigée (retrait de `updated_at`)
✅ **Mode édition** : Fonctionnel avec recalcul automatique

## Pourquoi les devis semblent peu chers?

Les modèles **gratuits** ont tendance à sous-estimer:
- **Qwen 2 7B (GRATUIT)**: Peut donner 50-60% moins cher que la réalité
- **Mistral 7B (Gratuit)**: Variable selon le projet
- **Gemini 2.0 Flash (GRATUIT)**: Meilleur, mais encore conservateur

## Solutions pour des prix plus réalistes

### 1. Utiliser un modèle plus performant

Allez dans **Paramètres** > **Modèle IA préféré** et choisissez:
- **GPT-4o Mini** (~0.30€/devis) : ⭐⭐⭐⭐⭐ Excellent rapport qualité-prix
- **Claude 3.5 Sonnet** (~3€/devis) : ⭐⭐⭐⭐⭐ Le plus précis
- **DeepSeek Chat** (~0.14€/devis) : ⭐⭐⭐⭐ Très bon compromis

### 2. Améliorer la description

❌ **Vague**: "Rénovation salle de bain"

✅ **Détaillée**:
```
Rénovation complète salle de bain 6m² à Montpellier.
- Démolition + évacuation
- Plomberie + électricité aux normes
- Carrelage mural et sol gamme moyenne
- Douche italienne 90x120, WC suspendu, meuble 80cm
- Immeuble ancien 3ème étage sans ascenseur
```

### 3. Modifier manuellement

1. Cliquez sur **"Modifier"**
2. Ajustez les prix unitaires et quantités
3. Les totaux se recalculent automatiquement
4. **"Enregistrer"**

## Ratios de référence 2024-2025

| Type de projet | Prix/m² | Exemple 40m² |
|----------------|---------|--------------|
| **Extension simple** | 1500-2200€/m² | 60000-88000€ |
| **Rénovation complète** | 800-1500€/m² | 32000-60000€ |
| **Construction neuve** | 1800-2600€/m² | 72000-104000€ |

## Coefficients régionaux

- **Paris**: +25-30%
- **Montpellier/Hérault**: +10-15%
- **Villes moyennes**: +5-10%
- **Rural**: 0 à -5%

## Vérification rapide

Un devis est cohérent si:
- ✅ Gros œuvre = 40-50% du total
- ✅ Second œuvre = 30-35%
- ✅ Finitions = 15-20%
- ✅ Frais annexes = 5-15%

## Marges de sécurité recommandées

- Modèles gratuits : **+30% à +50%**
- GPT-4o Mini : **+15% à +25%**
- Claude 3.5 Sonnet : **+10% à +15%**

## Avertissement

⚠️ Les devis IA sont des **estimations indicatives** qui ne remplacent PAS:
- Visite sur site par un professionnel
- Diagnostic technique complet  
- Devis détaillés d'artisans qualifiés

**Utilisez-les comme base de négociation et de réflexion budgétaire.**

---

Consultez `GUIDE_UTILISATEUR.md` pour apprendre à modifier les devis manuellement.
