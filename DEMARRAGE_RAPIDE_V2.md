# ⚡ Démarrage Rapide - Devisia V2.0

## 🎯 3 Nouvelles Fonctionnalités

✅ **Projets sans devis obligatoire**
✅ **Photos par pièce avec dimensions**
✅ **10 templates BTP professionnels**

---

## 🚀 POUR COMMENCER (5 min)

### 1. Configuration Supabase Storage ⚠️

**Action manuelle requise avant utilisation des photos :**

```
1. Dashboard Supabase → Storage
2. Créer bucket "project-photos"
3. Configuration :
   - Public: ✅ Oui
   - Size limit: 5MB
   - MIME: image/*
```

> **Détails complets** : `CONFIGURATION_SUPABASE_STORAGE.md`

### 2. Tester les Fonctionnalités

#### Test 1 : Projet Simple
```
Dashboard → "Créer un Projet"
→ Remplir titre + infos client
→ Enregistrer
→ Page projet créée ✅
```

#### Test 2 : Photos
```
Page projet → Onglet "Photos"
→ "Ajouter une pièce" (ex: "Salon")
→ "Ajouter photo"
→ Choisir image
→ Photo visible ✅
```

#### Test 3 : Ancien Workflow
```
Dashboard → "Projet + Devis"
→ Génération immédiate des 3 scénarios
→ Fonctionne comme avant ✅
```

---

## 📱 TEST MOBILE (iOS/Android)

```
1. Ouvrir app sur smartphone
2. Dashboard → "Créer un Projet"
3. Page projet → "Photos"
4. "Ajouter photo" → Accès caméra natif
5. Prendre photo → Upload automatique
```

**Attendu** : Photo uploadée et visible immédiatement

---

## 📊 VÉRIFICATIONS

### Base de Données ✅

Tables créées automatiquement :
- `projects` (champs client ajoutés)
- `project_rooms`
- `room_photos`
- `estimate_templates` (10 templates insérés)

Vérifier :
```sql
SELECT COUNT(*) FROM estimate_templates;
-- Attendu: 10
```

### Application ✅

Routes disponibles :
- `/project/create` - Nouveau formulaire simple
- `/project/new` - Formulaire avec génération (existant)
- `/dashboard` - 2 boutons création

### Build ✅

```bash
npm run build
# Doit compiler sans erreurs
# 16 routes générées
```

---

## 🗂️ DOCUMENTS DISPONIBLES

| Document | Contenu |
|----------|---------|
| **`DEVISIA_EVOLUTION_V2.md`** | 📘 Documentation technique complète |
| **`GUIDE_NOUVELLES_FONCTIONNALITES.md`** | 👥 Guide utilisateur détaillé |
| **`CONFIGURATION_SUPABASE_STORAGE.md`** | ⚙️ Config bucket photos |
| **`DEMARRAGE_RAPIDE_V2.md`** | ⚡ Ce document |

---

## ⚠️ POINTS D'ATTENTION

### 1. Bucket Storage
```
❌ Pas créé automatiquement
✅ Créer manuellement dans Dashboard Supabase
```

### 2. Ancien Workflow
```
✅ Conservé et fonctionnel
✅ Bouton "Projet + Devis" fonctionne comme avant
```

### 3. Templates
```
✅ Insérés en base de données
⏳ Utilisation dans génération : future version
📋 Actuellement : disponibles en lecture
```

---

## 🐛 PROBLÈMES COURANTS

### Photos ne s'affichent pas
```
Cause: Bucket non créé ou mal configuré
Fix: Voir CONFIGURATION_SUPABASE_STORAGE.md
```

### Erreur "Bucket not found"
```
Cause: Bucket project-photos manquant
Fix: Créer bucket dans Dashboard Supabase
```

### Onglets non visibles
```
Cause: Cache navigateur
Fix: Vider cache et recharger (Ctrl+Shift+R)
```

---

## 📈 WORKFLOW RECOMMANDÉ

### Pour Projets Simples
```
1. Créer projet simple (infos client)
2. Ajouter pièces + photos sur chantier
3. Compléter description au bureau
4. Générer devis avec IA
```

### Pour Devis Urgents
```
1. "Projet + Devis" (workflow rapide)
2. Génération immédiate 3 scénarios
3. Envoyer au client
4. Ajouter photos plus tard si besoin
```

---

## ✅ CHECKLIST MISE EN PRODUCTION

- [ ] Bucket `project-photos` créé
- [ ] Configuration bucket vérifiée
- [ ] Test upload photo mobile OK
- [ ] Test création projet OK
- [ ] Test génération devis OK
- [ ] 10 templates présents en base
- [ ] Build production OK
- [ ] Documentation lue

---

## 🆘 BESOIN D'AIDE ?

### Documentation
1. `GUIDE_NOUVELLES_FONCTIONNALITES.md` - Guide utilisateur
2. `DEVISIA_EVOLUTION_V2.md` - Documentation technique

### Tests
- Tester sur mobile (iOS + Android)
- Vérifier upload photos
- Valider workflow complet

### Support
- Logs Supabase : Dashboard → Logs
- Console navigateur : F12
- Tester avec utilisateur de test

---

**Version** : 2.0.0 - Devisia
**Date** : 2025-11-28
**Statut** : ✅ Prêt à tester
**Build** : ✅ OK

🎉 **Toutes les fonctionnalités sont implémentées et prêtes à l'emploi !**
