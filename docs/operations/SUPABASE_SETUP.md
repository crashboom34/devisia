# Configuration Supabase - Guide Complet

## ✅ Étape 1: Créer le Projet Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquez **"New project"**
3. Remplissez:
   - **Name:** `devisia` (ou votre choix)
   - **Database Password:** _(notez-le quelque part!)_
   - **Region:** Europe West (Ireland)
   - **Pricing Plan:** Free
4. Cliquez **"Create new project"** (prend ~2 minutes)

---

## ✅ Étape 2: Récupérer les Credentials

Une fois le projet créé:

1. Allez dans **Settings** (⚙️) → **API**
2. Copiez ces deux valeurs:

### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```

### **anon public key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

---

## ✅ Étape 3: Appliquer les Migrations

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez/collez TOUT le contenu du fichier `COMPLETE_SCHEMA.sql` (généré ci-dessous)
3. Cliquez **"Run"**

---

## ✅ Étape 4: Configurer les Variables d'Environnement

### **Local (.env)**

Éditez le fichier `.env` à la racine du projet:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

### **Vercel (Production)**

Dans Vercel Dashboard → **Settings** → **Environment Variables**, ajoutez:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` | ✅ Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Production, Preview, Development |

---

## ✅ Étape 5: Créer le Premier Admin

Une fois les migrations appliquées:

1. Créez un compte sur `/auth/register`
2. Récupérez votre `user_id` depuis le dashboard Supabase:
   - **Authentication** → **Users** → copiez l'ID
3. Dans **SQL Editor**, exécutez:

```sql
INSERT INTO admin_users (user_id, role)
VALUES ('VOTRE-USER-ID-ICI', 'super_admin');
```

4. Rafraîchissez la page, vous avez maintenant accès à `/admin`

---

## 🎯 Pages Disponibles Après Configuration

- `/` - Page d'accueil
- `/auth/login` - Connexion
- `/auth/register` - Inscription
- `/dashboard` - Dashboard utilisateur
- `/project/new` - Nouveau projet
- `/admin` - Panel admin (réservé aux admins)
- `/admin/models` - Gestion des modèles IA
- `/admin/config` - Configuration système
- `/admin/usage` - Statistiques d'utilisation

---

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Les utilisateurs ne voient que leurs propres données
- ✅ Les admins ont des permissions spéciales
- ✅ Les API keys sont chiffrées dans la base

---

## 🆘 Besoin d'Aide?

Si vous avez des problèmes:
1. Vérifiez les logs dans Vercel Dashboard → **Deployments** → (cliquez sur le deployment) → **Functions**
2. Vérifiez la console navigateur (F12)
3. Testez la connexion Supabase dans le SQL Editor
