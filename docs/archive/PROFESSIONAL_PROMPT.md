# Prompt Professionnel d'Économiste de la Construction

## Vue d'ensemble

Le système a été mis à jour avec un prompt professionnel ultra-détaillé basé sur 15 ans d'expertise en maîtrise d'œuvre et économie de la construction.

## Objectif

Produire des devis **réalistes, détaillés, crédibles et exploitables**, avec une précision de **±10% d'un vrai chantier**, cohérents avec les prix du marché français 2024-2025.

## Positionnement de l'IA

L'IA joue le rôle d'un:
- **Économiste du bâtiment** avec 15+ ans d'expérience terrain
- **Maître d'œuvre expérimenté** en projets résidentiels
- **Expert en chiffrage** spécialisé en France métropolitaine

## Ratios de référence 2024-2025

Le prompt inclut maintenant des ratios de marché précis:

### Prix au m² habitable
- Construction/extension parpaing/béton: **1800-2600 €/m²**
- Extension ossature bois: **1500-2300 €/m²**
- Surélévation: **2200-2800 €/m²**
- Rénovation lourde: **1200-1800 €/m²**

### Équipements spécifiques
- Terrasse couverte: **600-1200 €/m²**
- Clim bi-split posée: **3000-5000 €**

## Coefficients géographiques

Le prompt applique automatiquement les coefficients régionaux:

| Zone | Coefficient | Exemples |
|------|-------------|----------|
| Paris intra-muros | +25 à +30% | 75 |
| IDF hors Paris | +15 à +20% | 77, 78, 91, 92, 93, 94, 95 |
| Côte d'Azur | +15 à +20% | Nice, Cannes, Monaco |
| Grandes métropoles | +10 à +15% | Lyon, Bordeaux, Nantes, Toulouse |
| Montpellier/Hérault/Gard | +10 à +15% | Montpellier, Combaillaux, Nîmes |
| Littoral Atlantique | +8 à +12% | La Rochelle, Arcachon |
| Centre rural | 0 à -5% | Zones rurales standard |
| Rural isolé | -5 à -10% | Zones très rurales |

## Structure obligatoire en 5 catégories

Tous les devis sont maintenant structurés en 5 grandes catégories obligatoires:

### 1. GROS ŒUVRE (40-50% du budget)

Détails avec fourchettes de prix:
- Terrassement, fondations: **100-150 €/m²**
- Dalle béton 15-20cm: **65-100 €/m²**
- Élévation murs:
  - Parpaing + enduit: **180-280 €/m²**
  - Ossature bois: **150-250 €/m²**
- Charpente industrielle: **50-80 €/m² toiture**
- Couverture et étanchéité

### 2. SECOND ŒUVRE (30-35% du budget)

Détails avec fourchettes:
- Isolation:
  - Intérieur: **25-40 €/m²**
  - ITE (par l'extérieur): **80-140 €/m²**
- Cloisons/doublages BA13
- Menuiseries extérieures:
  - PVC: **350-600 €/m²**
  - Aluminium: **450-800 €/m²**
- Électricité complète: **80-120 €/m² habitable**
- Plomberie/évacuations
- Chauffage/climatisation

### 3. FINITIONS (15-20% du budget)

Détails:
- Revêtements sols:
  - Carrelage: **50-80 €/m²**
  - Parquet flottant: **30-50 €/m²**
- Peinture: **20-35 €/m²**
- Salle de bain complète: **3000-9000 €**
- Cuisine équipée: **3000-12000 €**
- Portes intérieures

### 4. AMÉNAGEMENTS EXTÉRIEURS

Détails:
- Terrasse couverte: **600-1200 €/m²**
- Terrasse carrelée/bois: **70-160 €/m²**
- VRD/raccordements: **800-5000 €** (selon distance)
- Clôtures, portail

### 5. FRAIS ANNEXES & IMPRÉVUS (5-15% du budget)

**Toujours inclus** dans les devis:
- Étude de sol G2: **1500-2500 €**
- Étude thermique: **800-1500 €**
- Permis/DP: **500-3000 €**
- Assurance DO: **2-4% des travaux**
- Enveloppe sécurité: **5-10%**

## Coefficients de qualité

Le prompt applique automatiquement les coefficients selon le scénario:

| Scénario | Coefficient | Description |
|----------|-------------|-------------|
| Économique | **0.85** | Matériaux standards, techniques simples, finitions de base |
| Standard | **1.00** | Matériaux qualité moyenne, techniques éprouvées, finitions soignées |
| Premium | **1.25** | Matériaux haut de gamme, techniques avancées, finitions luxueuses |

## TVA automatique

Le prompt applique la TVA correcte:
- **10%**: Rénovation/extension de logement existant >2 ans
- **20%**: Construction neuve

La TVA appliquée est précisée dans `special_conditions`.

## 10 règles obligatoires

Le prompt impose 10 règles strictes:

1. **STRUCTURE**: 5 catégories obligatoires (même si certaines sont petites)
2. **DÉTAIL**: Quantité, unité, prix unitaire HT, montant HT pour chaque poste
3. **TVA**: 10% ou 20% selon le cas, précisée dans special_conditions
4. **GÉOGRAPHIE**: Coefficient régional appliqué si localisation mentionnée
5. **QUALITÉ**: Coefficient éco/standard/premium appliqué
6. **JUSTIFICATION**: Obligatoire avec 2-3 phrases (matériaux, techniques, région, différences, rapport qualité-prix)
7. **RÉALISME**: Viser ±10% d'un vrai chantier, basé sur les ratios de référence
8. **PRÉCISION**: Descriptions techniques précises (matériaux exacts, dimensions, normes)
9. **EXHAUSTIF**: Frais annexes TOUJOURS inclus (études, permis, DO, imprévus 5-10%)
10. **CRÉDIBILITÉ**: Devis présentable à une entreprise du bâtiment sans paraître fantaisiste

## Exemple de calcul

Pour une **extension de 57m² à Combaillaux (34), ossature bois, T2, avec terrasse couverte 20m² et clim bi-split**:

### Calcul du scénario Standard

**Base**:
- 57m² × 2000 €/m² (ossature bois standard) = 114,000 €
- Terrasse 20m² × 900 €/m² = 18,000 €
- Clim bi-split = 4,000 €
- **Sous-total**: 136,000 €

**Coefficient géographique** (Hérault/Combaillaux):
- +12% → 136,000 × 1.12 = **152,320 €**

**Coefficient qualité** (Standard):
- ×1.00 = **152,320 €**

**Frais annexes** (10%):
- 152,320 × 0.10 = **15,232 €**

**Total HT**: 167,552 €
**TVA 10%**: 16,755 €
**Total TTC**: **184,307 €**

Soit environ **170,000 - 190,000 € TTC** selon les finitions et entreprises.

## Avantages du nouveau prompt

### Pour la qualité des devis

✅ **Réalisme**: Basés sur des ratios de marché réels 2024-2025
✅ **Exhaustivité**: 5 catégories obligatoires, rien n'est oublié
✅ **Géographie**: Coefficients régionaux appliqués automatiquement
✅ **Précision**: Objectif ±10% d'un vrai chantier
✅ **Crédibilité**: Devis présentables à des professionnels

### Pour les utilisateurs

✅ **Confiance**: Chiffrage professionnel basé sur 15 ans d'expérience
✅ **Transparence**: Justification détaillée de chaque scénario
✅ **Complétude**: Frais annexes toujours inclus (études, permis, imprévus)
✅ **Comparabilité**: Structure standardisée en 5 catégories

### Pour le business

✅ **Professionnalisme**: Devis de qualité professionnelle
✅ **Différenciation**: Bien plus détaillés que les estimations en ligne basiques
✅ **Fiabilité**: Les clients peuvent prendre des décisions d'investissement en confiance

## Message système de l'IA

Le message système a également été renforcé:

> "Tu es un économiste du bâtiment et maître d'œuvre expérimenté (15+ ans). Tu génères des devis BTP professionnels, détaillés, réalistes et crédibles (±10% d'un vrai chantier), en JSON valide uniquement. Tu appliques les coefficients géographiques, les ratios de référence 2024-2025, et structures TOUJOURS en 5 catégories: Gros œuvre, Second œuvre, Finitions, Aménagements extérieurs, Frais annexes."

## Redéploiement requis

Pour activer ce nouveau prompt professionnel, **redéployez la fonction Edge** `generate-estimate`.

### Via le Dashboard Supabase

1. https://supabase.com/dashboard/project/fwuwzoxanrmsobwfnbxe/functions
2. Cliquez sur `generate-estimate`
3. Cliquez sur **Deploy**

## Test après redéploiement

Créez un projet test avec des informations précises:

**Exemple de description**:
> "Extension de 45m² en T2 à Lyon, parpaing + enduit, avec terrasse couverte 15m² en ossature bois, clim bi-split, cuisine équipée mid-range, salle de bain complète"

**Vérifiez**:
1. ✅ Le devis est structuré en 5 catégories
2. ✅ Chaque poste a quantité, unité, prix unitaire
3. ✅ Le coefficient géographique Lyon (+10-15%) est appliqué
4. ✅ Les frais annexes sont inclus (études, permis, DO, imprévus)
5. ✅ La justification explique le scénario (2-3 phrases)
6. ✅ La TVA est précisée (10% ou 20%)
7. ✅ Les prix sont réalistes et cohérents avec le marché

## Compatibilité

Ce prompt fonctionne avec tous les modèles IA:
- Modèles gratuits (Qwen 2 7B, Gemini 2.0 Flash)
- Modèles économiques (DeepSeek Chat, GPT-4o Mini)
- Modèles premium (Claude 3.5 Sonnet, GPT-4o)

Les modèles plus puissants produiront des devis encore plus détaillés et précis.
