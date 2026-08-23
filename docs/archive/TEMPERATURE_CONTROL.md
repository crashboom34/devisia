# Contrôle de Température et Liberté des IA

## Vue d'ensemble

Le système a été modifié pour donner plus de latitude aux modèles IA et permettre aux utilisateurs de contrôler la créativité des réponses.

## Nouvelles fonctionnalités

### 1. Slider de température dans l'interface

Un nouveau contrôle visuel permet d'ajuster la créativité de l'IA avant de générer les devis.

**Emplacement**: Page de création de projet (`/project/new`), juste après le sélecteur de modèle

**Fonctionnalités**:
- Slider de 0.0 à 1.0 avec pas de 0.05
- Affichage en temps réel de la valeur (ex: 0.50)
- Indicateurs visuels de niveau:
  - ❄️ 0.0-0.29: Très conservateur
  - 🧊 0.30-0.49: Conservateur
  - ⚖️ 0.50-0.69: Équilibré (défaut)
  - 🔥 0.70-0.89: Créatif
  - 🌟 0.90-1.0: Très créatif

**Valeur par défaut**: 0.5 (équilibré)

### 2. Suppression des contraintes de prix strictes

**AVANT** (contraignant):
- Éco → Standard: +30-40%
- Standard → Premium: +40-60%
- Tarifs de référence imposés (40-60€/h, 20-30€/m², etc.)

**MAINTENANT** (libre):
- L'IA utilise ses propres connaissances du marché français BTP
- Pas de contraintes d'écarts de prix entre scénarios
- Laisse l'IA décider des prix appropriés selon le niveau de qualité

### 3. Instructions contextuelles conservées

Les instructions par scénario sont toujours présentes mais simplifiées:

**Scénario Économique**:
- Matériaux standards, techniques simples, finitions de base
- Focus sur le fonctionnel et l'essentiel

**Scénario Standard**:
- Matériaux de qualité moyenne, techniques éprouvées, finitions soignées
- Bon compromis entre qualité et prix

**Scénario Premium**:
- Matériaux premium, techniques avancées, finitions luxueuses
- Qualité supérieure et durabilité optimale

### 4. Justifications et traçabilité fonctionnelles

Les devis récents (créés après le dernier déploiement) affichent bien:

✅ **Justification du scénario** dans une boîte bleue avec 💡
- Exemple: "Ce scénario standard offre un excellent rapport qualité-prix en utilisant des matériaux de qualité moyenne..."

✅ **Nom du modèle utilisé**
- Exemple: "Généré par: DeepSeek Chat" ou "Généré par: Gemini 2.0 Flash (GRATUIT)"

**Note importante**: Seuls les **nouveaux devis** créés après ce redéploiement auront ces informations. Les anciens devis n'ont pas ces champs (NULL).

## Impact de la température

### Température basse (0.0 - 0.3)
- Réponses très prévisibles et conservatrices
- Prix plus standardisés
- Descriptions plus formelles
- Recommandé pour: Devis très précis et répétables

### Température moyenne (0.4 - 0.6)
- Bon équilibre entre précision et variété
- Valeur par défaut recommandée
- Recommandé pour: Usage général

### Température élevée (0.7 - 1.0)
- Réponses plus créatives et variées
- Prix plus diversifiés
- Descriptions plus détaillées
- Recommandé pour: Projets complexes nécessitant des solutions innovantes

## Modifications techniques

### Frontend

**Fichier**: `app/project/new/page.tsx`

1. Nouveau state `temperature` initialisé à 0.5
2. Import du composant `Slider` de shadcn/ui
3. Nouvelle Card "Créativité de l'IA" avec slider interactif
4. Envoi de la température dans l'appel API

### Backend

**Fichier**: `supabase/functions/generate-estimate/index.ts`

1. Ajout du champ `temperature?: number` dans l'interface `EstimateRequest`
2. Récupération de la température (défaut: 0.5)
3. Utilisation de `apiTemperature` dans l'appel LLM
4. Prompt simplifié sans contraintes de prix strictes
5. Suppression des tarifs de référence du marché français
6. Instructions: "Utilise tes connaissances du marché français BTP"

## Avantages

### Pour les utilisateurs

✅ **Contrôle total**: Ajustez la créativité selon vos besoins
✅ **Flexibilité**: L'IA n'est plus contrainte par des fourchettes de prix strictes
✅ **Transparence**: Voyez toujours quel modèle et quelle température ont été utilisés

### Pour la qualité des devis

✅ **Plus naturels**: L'IA utilise ses connaissances intrinsèques
✅ **Plus variés**: Chaque génération peut être différente
✅ **Plus réalistes**: Basés sur les vraies connaissances du marché de l'IA

### Pour les tests

✅ **Comparabilité**: Générez le même projet avec différentes températures
✅ **Optimisation**: Trouvez la température idéale pour votre usage
✅ **Traçabilité**: Sachez toujours quelle config a produit quel résultat

## Redéploiement requis

Pour activer ces fonctionnalités, **redéployez la fonction Edge** `generate-estimate`.

### Via le Dashboard Supabase

1. https://supabase.com/dashboard/project/fwuwzoxanrmsobwfnbxe/functions
2. Cliquez sur `generate-estimate`
3. Cliquez sur **Deploy**

## Test après redéploiement

1. Allez sur `/project/new`
2. Vérifiez que le slider de température est visible
3. Ajustez la température (essayez 0.2, puis 0.8)
4. Créez un projet et vérifiez:
   - Les 3 devis sont générés
   - Chaque devis affiche la justification (boîte bleue 💡)
   - Chaque devis affiche "Généré par: [Nom du modèle]"
   - Les prix ne suivent pas de contraintes strictes

## Notes importantes

- **Anciens devis**: Les devis créés avant cette mise à jour n'ont PAS de justification ni de nom de modèle
- **Nouveaux devis**: Tous les devis créés après le redéploiement auront ces informations
- **Température par défaut**: Si l'utilisateur ne modifie pas le slider, la valeur 0.5 est utilisée
- **Fallback**: Le système de fallback automatique entre modèles fonctionne toujours
