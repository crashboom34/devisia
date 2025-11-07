# Guide Utilisateur - Fonctionnalités d'Édition des Devis

## Vue d'ensemble

L'application Aide Devis IA dispose maintenant de fonctionnalités complètes d'édition et de gestion des devis générés par l'IA. Ce guide vous explique étape par étape comment utiliser ces nouvelles fonctionnalités.

## Table des matières

1. [Visualisation des devis](#1-visualisation-des-devis)
2. [Mode Édition](#2-mode-édition)
3. [Modification des lignes](#3-modification-des-lignes)
4. [Suppression de lignes](#4-suppression-de-lignes)
5. [Recalcul automatique](#5-recalcul-automatique)
6. [Traçabilité du modèle IA](#6-traçabilité-du-modèle-ia)
7. [Justification des scénarios](#7-justification-des-scénarios)
8. [Enregistrement des modifications](#8-enregistrement-des-modifications)

---

## 1. Visualisation des devis

### Éléments affichés

Lorsque vous consultez un projet, vous voyez pour chaque devis:

✅ **Badge de scénario** (Économique/Standard/Premium) avec le montant TTC total
✅ **Informations de base**: N° devis, date, validité
✅ **Traçabilité IA**: "Généré par: [Nom du modèle]" (ex: "Qwen 2 7B (GRATUIT)")
✅ **Boîte bleue de justification** avec l'icône 💡 "Pourquoi ce scénario?"
✅ **Bouton "Modifier"** pour activer le mode édition

### Modes de vue

L'interface propose 3 modes de visualisation:

1. **Vue Client**: Affichage simplifié avec seulement les montants TTC
2. **Vue Détaillée**: Affichage complet avec quantités, prix unitaires, TVA
3. **Vue Interne**: Affichage avec marges et prix de revient (si disponibles)

---

## 2. Mode Édition

### Activer le mode édition

1. Allez sur la page de détail d'un projet
2. Localisez le devis que vous souhaitez modifier
3. Cliquez sur le bouton **"Modifier"** (icône crayon) en haut à droite du devis

### Interface en mode édition

Lorsque le mode édition est activé:

- ✏️ Les champs deviennent éditables (fond blanc avec bordure)
- 🗑️ Une colonne "Supprimer" apparaît à droite avec des icônes de corbeille
- 💾 Le bouton "Modifier" devient **"Enregistrer"** (vert)
- ❌ Un bouton **"Annuler"** apparaît à côté
- 🏷️ Un badge **"Modifié"** s'affiche si des changements sont détectés

---

## 3. Modification des lignes

### Champs modifiables

En mode édition, vous pouvez modifier:

| Champ | Type | Description |
|-------|------|-------------|
| **Poste** | Texte | Nom du poste de travail |
| **Description** | Texte | Description détaillée |
| **Quantité** | Nombre | Quantité (décimales acceptées) |
| **Unité** | Texte | Unité de mesure (m², ml, forfait, etc.) |
| **PU HT** | Nombre | Prix unitaire hors taxes |
| **TVA** | Nombre | Taux de TVA en pourcentage |

### Comment modifier

1. **Cliquez dans le champ** que vous souhaitez modifier
2. **Saisissez la nouvelle valeur**
3. **Le recalcul est automatique** dès que vous quittez le champ

**Exemple pratique:**

```
Ligne originale:
Poste: Terrassement
Quantité: 50 m²
PU HT: 25,00 €
TVA: 20%
Montant HT: 1 250,00 €
Montant TTC: 1 500,00 €

Vous modifiez la quantité à 60 m²:
→ Montant HT recalculé: 1 500,00 €
→ Montant TTC recalculé: 1 800,00 €
→ Sous-total de la catégorie recalculé
→ Total du devis recalculé
```

---

## 4. Suppression de lignes

### Comment supprimer une ligne

1. **En mode édition**, localisez la ligne à supprimer
2. Cliquez sur l'icône **🗑️ (corbeille)** dans la dernière colonne
3. Une boîte de dialogue de confirmation s'affiche:

```
┌─────────────────────────────────────┐
│ Confirmer la suppression            │
├─────────────────────────────────────┤
│ Êtes-vous sûr de vouloir supprimer │
│ cette ligne? Cette action est       │
│ irréversible et les totaux seront   │
│ recalculés automatiquement.         │
├─────────────────────────────────────┤
│ [Annuler]      [Supprimer] ⚠️       │
└─────────────────────────────────────┘
```

4. **Cliquez sur "Supprimer"** pour confirmer
5. La ligne est supprimée et **tous les totaux sont recalculés automatiquement**

### Cas particuliers

**Suppression de toutes les lignes d'une catégorie:**
- Si vous supprimez la dernière ligne d'une catégorie, **la catégorie entière est supprimée**
- Le total du devis est recalculé en conséquence

---

## 5. Recalcul automatique

### Fonctionnement

Le système recalcule **automatiquement et en temps réel**:

1. **Pour chaque ligne modifiée:**
   - Montant HT = Quantité × Prix Unitaire HT
   - TVA = Montant HT × (Taux TVA / 100)
   - Montant TTC = Montant HT + TVA

2. **Pour chaque catégorie:**
   - Sous-total HT = Somme des montants HT
   - Sous-total TVA = Somme des TVA
   - Sous-total TTC = Somme des montants TTC

3. **Pour le devis complet:**
   - Total HT = Somme des sous-totaux HT
   - Total TVA = Somme des sous-totaux TVA
   - Total TTC = Somme des sous-totaux TTC

### Indicateur visuel

Le **badge "Modifié"** s'affiche en temps réel lorsque:
- Le total TTC du devis édité diffère du total TTC original
- Cela vous confirme que vos modifications ont bien été prises en compte

---

## 6. Traçabilité du modèle IA

### Où trouver cette information

La traçabilité du modèle IA est affichée **sous le numéro de devis**:

```
┌──────────────────────────────────────┐
│ Scénario Standard        12 450,00 € │
├──────────────────────────────────────┤
│ Projet: Extension 50m²               │
│ N° Devis: DEVIS-2024-001             │
│ Date: 7 novembre 2024                │
│ Validité: 30 jours                   │
│ 🤖 Généré par: Qwen 2 7B (GRATUIT)  │ ← Traçabilité IA
└──────────────────────────────────────┘
```

### Informations affichées

- **Nom du modèle IA**: Ex: "Qwen 2 7B", "Mistral 7B", "GPT-4o"
- **Type de modèle**: "(GRATUIT)" ou prix si payant
- **Température utilisée**: (Visible dans les logs si nécessaire)

### Pourquoi c'est important

Cette information vous permet de:
- ✅ Savoir quel modèle IA a généré chaque devis
- ✅ Comparer la qualité des estimations selon les modèles
- ✅ Reproduire un devis avec le même modèle si besoin
- ✅ Avoir un historique complet et traçable

---

## 7. Justification des scénarios

### La boîte bleue 💡

Chaque devis affiche une **boîte bleue mise en évidence** avec:

```
┌────────────────────────────────────────────────┐
│ 💡 Pourquoi ce scénario?                      │
├────────────────────────────────────────────────┤
│ Ce scénario Standard propose un excellent     │
│ rapport qualité-prix avec des matériaux de    │
│ qualité moyenne et des techniques éprouvées.  │
│ Le budget de 45k€ inclut tous les postes     │
│ essentiels avec des finitions soignées.       │
│ Coefficient régional Montpellier +12%         │
│ appliqué.                                      │
└────────────────────────────────────────────────┘
```

### Contenu de la justification

La justification explique:

1. **Les matériaux utilisés**: Standards, moyenne gamme, ou haut de gamme
2. **Les techniques de construction**: Simples, éprouvées, ou avancées
3. **La région**: Coefficients géographiques appliqués (ex: Montpellier +10-15%)
4. **Le rapport qualité-prix**: Pourquoi ce scénario par rapport aux autres
5. **Les différences entre scénarios**: Éco vs Standard vs Premium

### Utilité

Cette justification vous aide à:
- ✅ Comprendre le positionnement de chaque devis
- ✅ Expliquer les écarts de prix à vos clients
- ✅ Choisir le scénario le plus adapté à vos besoins
- ✅ Justifier techniquement et commercialement vos choix

---

## 8. Enregistrement des modifications

### Sauvegarder les changements

1. Après avoir effectué vos modifications (édition ou suppression de lignes)
2. Vérifiez que le badge **"Modifié"** s'affiche bien
3. Cliquez sur le bouton **"Enregistrer"** (vert, icône disquette)
4. Un indicateur de chargement s'affiche: **"Enregistrement..."**
5. Une fois terminé, la page se recharge avec les modifications appliquées

### Annuler les modifications

Si vous souhaitez **annuler tous les changements**:

1. Cliquez sur le bouton **"Annuler"** (gris, icône X)
2. Tous les champs reviennent à leurs valeurs d'origine
3. Le mode édition reste actif (vous pouvez faire d'autres modifications)

### Que se passe-t-il après l'enregistrement?

Les données suivantes sont mises à jour dans la base de données:

- ✅ Structure complète des catégories et lignes
- ✅ Total HT du devis
- ✅ Total TVA du devis
- ✅ Total TTC du devis
- ✅ Date de dernière modification (updated_at)

Les données suivantes sont **conservées**:
- ✅ Numéro du devis original
- ✅ Modèle IA utilisé (traçabilité)
- ✅ Justification du scénario
- ✅ Historique de création

---

## Cas d'usage pratiques

### Cas 1: Ajuster une quantité

**Scénario**: Le modèle IA a estimé 50m² de carrelage, mais vous en avez mesuré 55m².

**Solution**:
1. Activez le mode édition (bouton "Modifier")
2. Localisez la ligne "Carrelage"
3. Modifiez le champ "Quantité" de 50 à 55
4. Le montant se recalcule automatiquement
5. Enregistrez les modifications

### Cas 2: Supprimer un poste non nécessaire

**Scénario**: Le devis inclut une "Clim bi-split", mais le client n'en veut pas.

**Solution**:
1. Activez le mode édition
2. Localisez la ligne "Climatisation bi-split"
3. Cliquez sur l'icône 🗑️ de suppression
4. Confirmez la suppression dans la boîte de dialogue
5. Le total se recalcule sans ce poste
6. Enregistrez les modifications

### Cas 3: Corriger un prix unitaire

**Scénario**: Votre fournisseur vous a donné un meilleur prix pour le parquet.

**Solution**:
1. Activez le mode édition
2. Localisez la ligne "Parquet flottant"
3. Modifiez le champ "PU HT" (ex: de 35€ à 28€)
4. Tous les montants se recalculent automatiquement
5. Le sous-total de la catégorie "Finitions" est mis à jour
6. Le total général du devis est recalculé
7. Enregistrez les modifications

### Cas 4: Comparer les scénarios avant de choisir

**Scénario**: Vous avez 3 devis (Éco, Standard, Premium) et souhaitez comprendre les différences.

**Solution**:
1. Consultez la boîte bleue 💡 de chaque devis
2. Lisez les justifications qui expliquent:
   - Les matériaux utilisés dans chaque scénario
   - Les techniques de pose
   - Le rapport qualité-prix
3. Regardez la traçabilité "Généré par:" pour voir quel modèle IA a créé chaque estimation
4. Comparez les structures et postes de chaque devis
5. Choisissez le scénario le plus adapté à votre budget et besoins

---

## Astuces et bonnes pratiques

### 💡 Astuce 1: Vérifiez toujours le badge "Modifié"

Avant d'enregistrer, assurez-vous que le badge "Modifié" s'affiche. Cela confirme que vos changements ont été détectés.

### 💡 Astuce 2: Utilisez "Annuler" pour recommencer

Si vous faites une erreur ou changez d'avis, cliquez sur "Annuler" au lieu de recharger la page. Vos modifications seront annulées sans perdre le mode édition.

### 💡 Astuce 3: Consultez la justification avant de modifier

La boîte bleue 💡 explique pourquoi certains choix ont été faits. Lisez-la avant de modifier pour comprendre la logique du devis.

### 💡 Astuce 4: Exportez avant de modifier

Si vous voulez conserver une copie du devis original, exportez-le en PDF avant de le modifier. (Bouton "Exporter PDF")

### 💡 Astuce 5: Comparez les modèles IA

Si un devis ne vous satisfait pas, créez un nouveau projet avec une description plus détaillée et testez avec un autre modèle IA (voir les paramètres).

---

## Questions fréquentes (FAQ)

### Q: Puis-je annuler une suppression de ligne après avoir enregistré?

**R**: Non, une fois enregistrée, la suppression est définitive. C'est pourquoi une confirmation est demandée avant chaque suppression. Si vous avez supprimé par erreur, vous devrez créer une nouvelle ligne manuellement ou régénérer le devis.

### Q: Que se passe-t-il si je ferme la page sans enregistrer?

**R**: Toutes vos modifications seront perdues. Le système ne sauvegarde les changements que lorsque vous cliquez sur "Enregistrer".

### Q: Puis-je modifier plusieurs devis en même temps?

**R**: Non, chaque devis doit être modifié individuellement. Activez le mode édition sur le devis souhaité, effectuez vos modifications, puis enregistrez avant de passer au suivant.

### Q: Les modifications affectent-elles les autres scénarios (Éco/Standard/Premium)?

**R**: Non, chaque scénario est indépendant. Modifier le devis "Standard" n'affecte pas les devis "Éco" et "Premium".

### Q: Puis-je modifier le modèle IA utilisé après la génération?

**R**: Non, le modèle IA utilisé est enregistré pour traçabilité et ne peut pas être modifié. Pour utiliser un autre modèle, créez un nouveau projet.

### Q: Comment savoir si mon devis modifié est toujours réaliste?

**R**: Les ratios de référence 2024-2025 et coefficients régionaux sont appliqués lors de la génération initiale. Si vous modifiez significativement les montants, il est recommandé de consulter un professionnel du bâtiment pour validation.

### Q: Puis-je ajouter des lignes au devis?

**R**: Dans la version actuelle, vous pouvez uniquement modifier ou supprimer des lignes existantes. L'ajout de nouvelles lignes n'est pas encore disponible. Pour un devis personnalisé, créez un nouveau projet avec une description plus détaillée.

---

## Support et assistance

Si vous rencontrez des problèmes ou avez des questions:

1. **Vérifiez que vous êtes en mode édition** (bouton "Modifier" cliqué)
2. **Actualisez la page** si les champs ne se mettent pas à jour
3. **Consultez les logs** dans la console du navigateur (F12) en cas d'erreur
4. **Testez avec un autre navigateur** si le problème persiste

---

## Récapitulatif des fonctionnalités

| Fonctionnalité | Description | État |
|----------------|-------------|------|
| **Boîte bleue de justification 💡** | Affichage de la justification du scénario | ✅ Disponible |
| **Traçabilité du modèle IA** | Affichage du modèle IA utilisé | ✅ Disponible |
| **Mode édition** | Activation/désactivation de l'édition | ✅ Disponible |
| **Modification des lignes** | Édition des quantités, prix, TVA | ✅ Disponible |
| **Suppression de lignes** | Suppression avec confirmation | ✅ Disponible |
| **Recalcul automatique** | Recalcul temps réel des totaux | ✅ Disponible |
| **Enregistrement** | Sauvegarde dans la base de données | ✅ Disponible |
| **Annulation** | Restauration des valeurs originales | ✅ Disponible |
| **Badge "Modifié"** | Indicateur visuel de modifications | ✅ Disponible |
| **Export PDF** | Export du devis en PDF | 🔄 À venir |
| **Ajout de lignes** | Création de nouvelles lignes | 🔄 À venir |

---

**Version du guide**: 1.0
**Date**: 7 novembre 2024
**Application**: Aide Devis IA
