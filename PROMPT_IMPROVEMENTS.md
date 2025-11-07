# Améliorations du Système de Prompt IA

## Vue d'ensemble

Le système de génération de devis a été considérablement amélioré pour produire des devis plus cohérents, équilibrés et explicatifs.

## Nouvelles fonctionnalités

### 1. Contraintes de prix strictes entre scénarios

Le prompt impose maintenant des écarts de prix spécifiques:

- **Économique** → **Standard**: +30-40%
- **Standard** → **Premium**: +40-60%
- **Économique** → **Premium**: +75-100%

Cela garantit que les 3 scénarios sont équilibrés et qu'il n'y a pas de variations aberrantes.

### 2. Instructions contextuelles par scénario

Chaque scénario a maintenant des instructions spécifiques:

#### Scénario Économique
- Matériaux standards, techniques simples, finitions de base
- Environ 40-50% moins cher que le premium
- Focus sur la fonctionnalité

#### Scénario Standard
- Matériaux de qualité moyenne, techniques éprouvées, finitions soignées
- Meilleur rapport qualité-prix
- Compromis optimal

#### Scénario Premium
- Matériaux premium, techniques avancées, finitions luxueuses
- Valeur ajoutée maximale
- Qualité supérieure

### 3. Justification obligatoire du scénario

Chaque devis inclut maintenant un champ `scenario_justification` qui explique en 2-3 phrases:

1. **Pourquoi ce scénario coûte ce prix** par rapport aux autres
2. **Les différences principales** qui justifient l'écart de prix
3. **Le rapport qualité-prix** de cette option

**Exemple de justification pour un scénario Standard:**
> "Ce scénario offre un excellent compromis entre qualité et prix, avec des matériaux de marques reconnues et des techniques éprouvées. Il coûte 35% de plus que l'économique grâce à de meilleurs isolants et des finitions plus soignées, tout en restant 45% moins cher que le premium qui utilise des matériaux haut de gamme. C'est l'option recommandée pour un résultat durable sans surcoût inutile."

### 4. Affichage visuel dans l'interface

La justification est affichée dans une **boîte bleue mise en évidence** avec l'icône 💡, placée juste après les informations du devis et avant les onglets de vue.

```
┌─────────────────────────────────────────────────┐
│ 💡 Pourquoi ce scénario?                       │
│ [Texte de justification en 2-3 phrases]        │
└─────────────────────────────────────────────────┘
```

### 5. Tarifs de référence renforcés

Le prompt inclut les tarifs du marché français 2024 avec des fourchettes spécifiques pour chaque scénario:

- Main d'œuvre: 40-120€/h
- Peinture: 20-80€/m²
- Carrelage: 40-150€/m²
- Électricité: 80-250€/m²
- Plomberie: 100-400€/m²
- Isolation: 30-120€/m²
- Fenêtres: 300-1500€/unité
- Portes: 800-6000€

### 6. Règles strictes de génération

Le prompt impose maintenant 5 règles strictes:

1. Respecter les écarts de prix entre scénarios
2. Détailler chaque poste avec quantités et prix unitaires réalistes
3. Ajouter la justification du scénario
4. Descriptions techniques et précises (matériaux, dimensions, techniques)
5. Organisation en catégories cohérentes (Gros œuvre, Second œuvre, Finitions, etc.)

## Modifications techniques

### Base de données

**Migration**: `add_scenario_justification`

```sql
ALTER TABLE estimates ADD COLUMN scenario_justification text;
```

### Edge Function

Fichier: `supabase/functions/generate-estimate/index.ts`

Le prompt a été restructuré avec:
- Section "PROJET À CHIFFRER"
- Section "TYPE DE DEVIS"
- Section "INSTRUCTIONS CRITIQUES - CONTRAINTES DE PRIX" (contextuelle)
- Section "TARIFS MARCHÉ FRANÇAIS 2024"
- Section "FORMAT DE SORTIE - STRUCTURE JSON"
- Section "RÈGLES STRICTES"

### Interface

Fichier: `components/EstimateTable.tsx`

- Ajout du champ `scenario_justification?: string` dans l'interface TypeScript
- Affichage conditionnel de la justification dans une boîte bleue mise en évidence
- Design responsive (mobile et desktop)

## Bénéfices

### Pour les utilisateurs

✅ **Transparence**: Comprendre pourquoi un scénario coûte plus ou moins cher
✅ **Aide à la décision**: Informations claires sur le rapport qualité-prix
✅ **Confiance**: Justifications professionnelles basées sur des critères objectifs

### Pour la qualité des devis

✅ **Cohérence**: Écarts de prix contrôlés entre scénarios
✅ **Réalisme**: Tarifs basés sur le marché français actuel
✅ **Professionnalisme**: Devis détaillés avec explications

### Pour la maintenance

✅ **Traçabilité**: Savoir quel modèle IA a généré chaque devis
✅ **Comparabilité**: Évaluer la qualité des différents modèles IA
✅ **Amélioration continue**: Identifier les modèles qui produisent les meilleures justifications

## Exemples de résultats attendus

### Rénovation maison 70m²

| Scénario    | Prix TTC | Justification résumée                                    |
|-------------|----------|----------------------------------------------------------|
| Économique  | 28,500€  | Matériaux basiques, finitions simples, fonctionnel      |
| Standard    | 39,800€  | +40% vs éco, matériaux qualité, finitions soignées      |
| Premium     | 58,200€  | +46% vs standard, matériaux premium, finitions luxueuses |

### Salle de bain 10m²

| Scénario    | Prix TTC | Justification résumée                          |
|-------------|----------|------------------------------------------------|
| Économique  | 8,900€   | Équipements standards, carrelage basique       |
| Standard    | 12,500€  | +40% vs éco, meilleure robinetterie, carrelage |
| Premium     | 18,700€  | +50% vs standard, équipements haut de gamme    |

## Redéploiement requis

Pour activer ces améliorations, **redéployez la fonction Edge** `generate-estimate`.

Voir le fichier `REDEPLOY.md` pour les instructions détaillées.

## Tests recommandés

Après le redéploiement, créez un projet test et vérifiez:

1. ✅ Les 3 devis sont générés avec des écarts de prix cohérents
2. ✅ Chaque devis affiche une justification claire et pertinente
3. ✅ La justification est visible dans une boîte bleue mise en évidence
4. ✅ Les tarifs sont réalistes et basés sur le marché français
5. ✅ Le nom du modèle IA utilisé est affiché

## Notes importantes

- Les anciens devis n'auront pas de justification (champ `scenario_justification` = NULL)
- Les nouveaux devis auront toujours une justification
- La justification est générée automatiquement par l'IA en fonction du contexte
- La qualité de la justification peut varier selon le modèle IA utilisé
