# 📋 Guide - Sélection de Template BTP

## 🎯 Fonctionnalité Ajoutée

La génération de devis Devisia utilise maintenant les **10 templates BTP professionnels** pour structurer automatiquement les devis.

---

## 🔄 Comment Ça Fonctionne

### 1. Sélection du Template (Optionnel)

Lors de la création d'un **Projet + Devis**, l'utilisateur peut maintenant :

```
1. Remplir titre et description
2. Choisir un type de projet (NOUVEAU):
   - Aucun template (génération libre)
   - Second œuvre intérieur
   - Extension de maison
   - Rénovation complète d'une pièce
   - Construction maison neuve
   - Aménagement de combles
   - Transformation garage
   - Surélévation
   - Local commercial
   - VRD et aménagements extérieurs
   - Piscine et poolhouse
3. Générer les 3 devis
```

### 2. Génération avec Template

**Si un template est sélectionné** :
- ✅ L'IA utilise le template comme **structure de base**
- ✅ Les lots et postes sont **pré-organisés** selon le template
- ✅ Les descriptions sont **adaptées au scénario** (Eco/Standard/Premium)
- ✅ La génération est **plus cohérente** et **complète**

**Si aucun template n'est sélectionné** :
- ✅ L'IA génère un devis **libre**
- ✅ Structure basée uniquement sur la description
- ✅ Flexibilité maximale

### 3. Adaptation Intelligente

L'IA adapte le template au projet :
- Combine la **structure du template** avec la **description du projet**
- Ajuste les quantités et prix selon le contexte
- Utilise les spécifications de gamme appropriées

---

## 📊 Exemple Concret

### Projet : Rénovation Salon 30m²

**Sans template** :
```json
{
  "categories": [
    "Travaux généraux",
    "Peinture",
    "Finitions"
  ]
}
```

**Avec template "Second œuvre intérieur"** :
```json
{
  "categories": [
    {
      "name": "Préparation et protections",
      "items": ["Protection zones salon 30m²"]
    },
    {
      "name": "Cloisons et plâtrerie",
      "items": [
        "Reprise murs et plafonds salon",
        "Enduit de finition"
      ]
    },
    {
      "name": "Électricité intérieure",
      "items": ["Ajout prises et points lumineux"]
    },
    {
      "name": "Revêtements de sols",
      "items": ["Pose parquet 30m²"]
    },
    {
      "name": "Peintures et finitions",
      "items": ["Peinture murs et plafond"]
    }
  ]
}
```

**Résultat** : Devis beaucoup plus structuré et professionnel.

---

## 🎨 Interface Utilisateur

### Sélecteur de Template

**Localisation** : `/project/new` - Formulaire de création

**Apparence** :
```
┌──────────────────────────────────────────────┐
│ Type de Projet (optionnel)                  │
├──────────────────────────────────────────────┤
│ [Sélectionner un type de projet...]     ▼   │
├──────────────────────────────────────────────┤
│ Options :                                    │
│  • Aucun template (génération libre)         │
│  • Second œuvre intérieur • Second œuvre    │
│  • Extension de maison • Gros œuvre         │
│  • Rénovation pièce • Rénovation            │
│  • Construction neuve • Maison neuve        │
│  • ... (10 templates au total)              │
└──────────────────────────────────────────────┘

Sélectionnez un type pour structurer
automatiquement votre devis selon les standards BTP
```

**Disponible dans** :
- ✅ Onglet "Voix" (dictée vocale)
- ✅ Onglet "Texte" (saisie manuelle)

---

## 🔧 Technique

### Front-End

**Fichier** : `/app/project/new/page.tsx`

**État ajouté** :
```typescript
const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
const [loadingTemplates, setLoadingTemplates] = useState(true);
```

**Chargement** :
```typescript
const loadTemplates = async () => {
  const { data } = await supabase
    .from('estimate_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  setTemplates(data || []);
};
```

**Envoi au backend** :
```typescript
body: JSON.stringify({
  projectId,
  projectDescription,
  scenarioType,
  templateId: selectedTemplateId || undefined,  // ← Template
})
```

### Back-End (Edge Function)

**Fichier** : `/supabase/functions/generate-estimate/index.ts`

**Chargement template** :
```typescript
let templateData = null;
if (templateId && templateId !== 'none') {
  const { data: template } = await supabase
    .from("estimate_templates")
    .select("*")
    .eq("template_id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (template) {
    templateData = template;
  }
}
```

**Injection dans le prompt** :
```typescript
let templateContext = '';
if (templateData) {
  templateContext = `
**TEMPLATE DE RÉFÉRENCE: ${templateData.name}**
**Catégorie:** ${templateData.category}

**LOTS ET POSTES RECOMMANDÉS:**
${JSON.stringify(templateData.lots, null, 2)}

UTILISE CE TEMPLATE comme structure de base.
Pour le scénario ${scenarioType}, utilise "gamme_${scenarioType}".
`;
}

const prompt = `... ${templateContext} ...`;
```

---

## 📋 Templates Disponibles

| # | Template ID | Nom | Catégorie | Lots Inclus |
|---|-------------|-----|-----------|-------------|
| 1 | `second_oeuvre_interieur` | Second œuvre intérieur | Second œuvre | 5 lots |
| 2 | `extension_maison` | Extension de maison | Gros œuvre | 6 lots |
| 3 | `renovation_piece` | Rénovation pièce | Rénovation | 4 lots |
| 4 | `construction_maison_neuve` | Construction neuve | Maison neuve | 8 lots |
| 5 | `amenagement_combles` | Aménagement combles | Transformation | 4 lots |
| 6 | `garage_en_piece_habitable` | Garage en pièce | Transformation | 5 lots |
| 7 | `surelevation` | Surélévation | Gros œuvre | 4 lots |
| 8 | `amenagement_local_commercial` | Local commercial | Tertiaire | 4 lots |
| 9 | `vrd_amenagement_exterieur` | VRD extérieurs | Extérieur | 3 lots |
| 10 | `piscine_poolhouse_terrasse` | Piscine poolhouse | Loisirs | 4 lots |

---

## 🎯 Cas d'Usage

### Cas 1 : Projet Standard avec Template

**Utilisateur** : "Je veux rénover mon salon"

**Actions** :
```
1. Saisir titre : "Rénovation salon"
2. Décrire : "Salon 30m², repeindre murs, changer sol..."
3. Sélectionner : "Rénovation complète d'une pièce"
4. Générer
```

**Résultat** :
- ✅ Devis structuré avec lots professionnels
- ✅ Postes cohérents (dépose, préparation, sols, peinture)
- ✅ Prix adaptés au scénario

### Cas 2 : Projet Atypique sans Template

**Utilisateur** : "Installation d'une serre de jardin avec système hydroponique"

**Actions** :
```
1. Saisir titre et description
2. Sélectionner : "Aucun template (génération libre)"
3. Générer
```

**Résultat** :
- ✅ IA génère librement selon la description
- ✅ Flexibilité pour projets uniques

### Cas 3 : Construction Neuve Complète

**Utilisateur** : "Construction maison 120m²"

**Actions** :
```
1. Décrire projet en détail
2. Sélectionner : "Construction maison individuelle TCE"
3. Générer
```

**Résultat** :
- ✅ Tous les lots de construction (études, gros œuvre, second œuvre, finitions, VRD, annexes)
- ✅ Structure professionnelle complète
- ✅ Rien n'est oublié

---

## ✅ Avantages

### Pour l'Utilisateur

1. **Devis Plus Complets**
   - Aucun poste oublié
   - Structure professionnelle

2. **Gain de Temps**
   - Pas besoin de tout détailler
   - Template pré-remplit la logique

3. **Cohérence**
   - Standards BTP respectés
   - Organisation claire

### Pour l'IA

1. **Guidage Structuré**
   - Template = guide clair
   - Moins de risques d'oubli

2. **Descriptions Adaptées**
   - 3 gammes pré-définies
   - IA adapte au contexte

3. **Qualité Améliorée**
   - Devis plus professionnels
   - Vocabulaire BTP approprié

---

## 🔄 Workflow Complet

```
┌──────────────────────────────────────────┐
│ 1. Utilisateur crée projet              │
│    - Titre + Description                 │
│    - Sélectionne template (optionnel)    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 2. Front-End envoie requête              │
│    - projectDescription                  │
│    - templateId (si sélectionné)         │
│    - scenarioType (eco/standard/premium) │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 3. Edge Function charge template        │
│    - Requête Supabase                    │
│    - Récupère lots + postes + gammes    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 4. Construction du prompt IA             │
│    - Description projet                  │
│    + Template (structure)                │
│    + Scénario (coefficient)              │
│    + Ratios BTP 2024-2025                │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 5. Génération IA                         │
│    - Combine tout le contexte            │
│    - Adapte template au projet           │
│    - Applique scénario                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 6. Devis Généré                          │
│    ✅ Structuré selon template            │
│    ✅ Adapté au projet                    │
│    ✅ Prix réalistes                      │
└──────────────────────────────────────────┘
```

---

## 🧪 Tests Recommandés

### Test 1 : Sans Template
```
Projet : "Pose d'une cuisine équipée 10m²"
Template : Aucun
Résultat attendu : Devis basique mais fonctionnel
```

### Test 2 : Avec Template Approprié
```
Projet : "Rénovation complète salle de bain"
Template : "Rénovation complète d'une pièce"
Résultat attendu : Devis structuré (dépose, préparation, réseaux, finitions)
```

### Test 3 : Template Non Adapté
```
Projet : "Installation panneau solaire"
Template : "Piscine poolhouse"
Résultat attendu : IA adapte intelligemment (ignore lots non pertinents)
```

### Test 4 : Projet Complexe
```
Projet : "Construction maison 150m² avec garage"
Template : "Construction maison individuelle TCE"
Résultat attendu : Devis complet avec tous les corps d'état
```

---

## ⚠️ Points d'Attention

### 1. Template ≠ Rigidité

Le template est un **guide**, pas une contrainte :
- ✅ L'IA adapte au projet
- ✅ Peut ajouter/retirer des postes
- ✅ Respecte la description utilisateur

### 2. Optionnel

L'utilisateur peut **toujours choisir** :
- "Aucun template" → Génération libre
- Template spécifique → Génération guidée

### 3. Compatibilité

Les devis générés **avant** cette fonctionnalité :
- ✅ Restent accessibles
- ✅ Fonctionnent normalement
- ✅ Aucune migration nécessaire

---

## 📈 Prochaines Évolutions Possibles

### Phase 2 : Templates Personnalisés
- Permettre aux utilisateurs de créer leurs propres templates
- Sauvegarder templates favoris
- Partager templates entre utilisateurs

### Phase 3 : Templates Intelligents
- Détection automatique du meilleur template
- Suggestions basées sur mots-clés
- Machine learning pour améliorer templates

### Phase 4 : Templates Régionaux
- Templates adaptés par région
- Coefficients automatiques
- Nomenclature locale

---

## ✅ Résumé

| Aspect | Détail |
|--------|--------|
| **Fonctionnalité** | Sélection template lors génération devis |
| **Localisation** | `/project/new` (Projet + Devis) |
| **Nombre templates** | 10 templates BTP |
| **Obligatoire** | Non (optionnel) |
| **Impact** | Devis plus structurés et complets |
| **Build** | ✅ Fonctionnel |
| **Rétrocompatibilité** | ✅ Complète |

---

**Version** : 2.1.0
**Date** : 2025-11-28
**Statut** : ✅ Implémenté et testé
**Build** : ✅ OK
