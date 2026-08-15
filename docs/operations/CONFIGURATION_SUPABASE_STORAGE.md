# 🗄️ Configuration Supabase Storage pour Photos

## ⚠️ IMPORTANT : Action Manuelle Requise

Le bucket de stockage des photos doit être créé **manuellement** dans le dashboard Supabase.

---

## 📋 ÉTAPES DE CONFIGURATION

### 1. Accéder au Dashboard Supabase

```
1. Aller sur : https://supabase.com/dashboard
2. Sélectionner votre projet Devisia
3. Menu latéral → Storage
```

### 2. Créer le Bucket

```
1. Cliquer sur "New bucket"

2. Remplir le formulaire :
   - Name: project-photos
   - Public bucket: ✅ Coché (ou configurer RLS)
   - File size limit: 5242880 (5MB en bytes)
   - Allowed MIME types: image/*

3. Cliquer "Create bucket"
```

### Configuration Détaillée

| Paramètre | Valeur | Explication |
|-----------|--------|-------------|
| **Name** | `project-photos` | Nom du bucket (ne pas modifier) |
| **Public bucket** | `true` | Photos accessibles via URL publique |
| **File size limit** | `5242880` | 5MB max par fichier |
| **Allowed MIME types** | `image/*` | Tous formats image acceptés |

---

## 🔒 OPTION : Row Level Security (RLS)

Si vous préférez un accès plus sécurisé (non-public), configurez des policies :

### Politique 1 : Upload (Authenticated users)

```sql
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);
```

**Explication :**
- Utilisateurs authentifiés peuvent uploader
- Uniquement dans leurs propres projets
- Structure : `{projectId}/{roomId}/{filename}`

### Politique 2 : Lecture (Authenticated users)

```sql
CREATE POLICY "Authenticated users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);
```

**Explication :**
- Utilisateurs peuvent voir uniquement leurs photos
- Basé sur le projectId dans le path

### Politique 3 : Suppression (Authenticated users)

```sql
CREATE POLICY "Authenticated users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);
```

**Explication :**
- Suppression uniquement de ses propres photos

---

## 📂 STRUCTURE DES FICHIERS

### Organisation Automatique

Les photos sont organisées automatiquement :

```
project-photos/
  ├── {projectId}/
  │   ├── {roomId}/
  │   │   ├── 1701234567890.jpg
  │   │   ├── 1701234578901.png
  │   │   └── 1701234589012.webp
  │   └── {roomId2}/
  │       └── ...
  └── {projectId2}/
      └── ...
```

### Exemple Réel

```
project-photos/
  ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  ← Project ID
  │   ├── x9y8z7w6-v5u4-3210-stuv-wxyz12345678/  ← Room ID (Salon)
  │   │   ├── 1732800000000.jpg  ← Photo 1
  │   │   ├── 1732800010000.jpg  ← Photo 2
  │   │   └── 1732800020000.png  ← Photo 3
  │   └── m4n3o2p1-q9r8-s7t6-u5v4-w3x2y1z09876/  ← Room ID (Cuisine)
  │       └── 1732800030000.jpg
```

**Avantages de cette structure :**
- ✅ Isolation par projet
- ✅ Organisation par pièce
- ✅ Nom unique (timestamp)
- ✅ Suppression en cascade facile
- ✅ Pas de conflit de noms

---

## 🧪 TESTER LA CONFIGURATION

### Test 1 : Upload Simple

```typescript
// Dans la console navigateur sur /project/create
const { data, error } = await supabase.storage
  .from('project-photos')
  .upload('test/test.jpg', file);

console.log('Upload result:', { data, error });
```

**Résultat attendu :**
```json
{
  "data": {
    "path": "test/test.jpg",
    "id": "...",
    "fullPath": "project-photos/test/test.jpg"
  },
  "error": null
}
```

### Test 2 : Récupération URL

```typescript
const { data } = supabase.storage
  .from('project-photos')
  .getPublicUrl('test/test.jpg');

console.log('Public URL:', data.publicUrl);
```

**Résultat attendu :**
```
https://{project-ref}.supabase.co/storage/v1/object/public/project-photos/test/test.jpg
```

### Test 3 : Liste Fichiers

```typescript
const { data, error } = await supabase.storage
  .from('project-photos')
  .list('test');

console.log('Files:', data);
```

**Résultat attendu :**
```json
[
  {
    "name": "test.jpg",
    "id": "...",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "last_accessed_at": "2024-01-15T10:30:00Z",
    "metadata": {
      "size": 123456,
      "mimetype": "image/jpeg"
    }
  }
]
```

---

## 🔧 CONFIGURATION AVANCÉE

### Limites de Taille par Type

Si vous voulez des limites spécifiques par type d'image :

```json
{
  "image/jpeg": 5242880,
  "image/png": 10485760,
  "image/webp": 2097152
}
```

### Formats Acceptés

Par défaut : `image/*`

Pour restreindre :
```
image/jpeg, image/png, image/webp, image/gif
```

### Compression Automatique

Supabase ne compresse pas automatiquement.
Options :
1. Compression côté client (avant upload)
2. Transformation Supabase (service payant)
3. Accepter taille originale (5MB max)

---

## ⚠️ ERREURS COURANTES

### Erreur : "Bucket not found"

**Cause :** Bucket `project-photos` pas créé

**Solution :**
```
1. Dashboard Supabase → Storage
2. Vérifier existence bucket "project-photos"
3. Si absent → le créer
```

### Erreur : "Policy violation"

**Cause :** RLS trop restrictif ou mal configuré

**Solution :**
```
1. Vérifier bucket est "Public" OU
2. Vérifier policies RLS si non-public
3. Tester avec utilisateur authentifié
```

### Erreur : "File too large"

**Cause :** Fichier > 5MB

**Solution :**
```
1. Augmenter limite dans bucket settings
2. Ou compresser image avant upload
3. Ou afficher message utilisateur
```

### Erreur : "Invalid file type"

**Cause :** Type MIME non autorisé

**Solution :**
```
1. Vérifier "Allowed MIME types"
2. Ajouter type manquant
3. Ou utiliser image/* (tous formats)
```

---

## 📊 MONITORING

### Voir l'Utilisation

```
Dashboard Supabase → Settings → Usage
→ Storage (section)
→ project-photos bucket
```

**Métriques disponibles :**
- Espace utilisé (MB/GB)
- Nombre de fichiers
- Nombre de requêtes
- Bande passante

### Quotas Supabase

| Plan | Storage | Bandwidth | Fichiers |
|------|---------|-----------|----------|
| **Free** | 1 GB | 2 GB/mois | Illimité |
| **Pro** | 100 GB | 200 GB/mois | Illimité |
| **Team** | Illimité | Illimité | Illimité |

---

## 🗑️ NETTOYAGE

### Supprimer Fichiers de Test

```typescript
// Supprimer tous les fichiers de test
const { data, error } = await supabase.storage
  .from('project-photos')
  .remove(['test/test.jpg']);
```

### Supprimer Dossier Complet

```typescript
// Lister fichiers
const { data: files } = await supabase.storage
  .from('project-photos')
  .list('test');

// Supprimer tous
const filesToRemove = files.map(x => `test/${x.name}`);
await supabase.storage
  .from('project-photos')
  .remove(filesToRemove);
```

---

## ✅ CHECKLIST FINALE

Avant de lancer en production :

- [ ] Bucket `project-photos` créé
- [ ] Configuration :
  - [ ] Public bucket : OUI (ou RLS configuré)
  - [ ] File size limit : 5MB
  - [ ] MIME types : image/*
- [ ] Test upload réussi
- [ ] Test récupération URL réussie
- [ ] Test suppression réussie
- [ ] RLS testé (si configuré)
- [ ] Monitoring activé

---

## 📞 SUPPORT

### En cas de problème

1. **Vérifier logs Supabase**
   ```
   Dashboard → Logs → Storage logs
   ```

2. **Tester en local**
   ```typescript
   // Test connection
   const { data, error } = await supabase.storage.listBuckets();
   console.log('Buckets:', data);
   ```

3. **Documentation Supabase**
   - https://supabase.com/docs/guides/storage
   - https://supabase.com/docs/guides/storage/uploads

---

**Configuration** : Storage Supabase
**Version** : 2.0.0
**Date** : 2025-11-28
**Statut** : ⚠️ Action manuelle requise
