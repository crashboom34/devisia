# Configuration Supabase - Guide Complet

## ✅ Étape 1: Retrouver le Projet Supabase Existant

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inspectez toutes les organisations auxquelles vous avez accès et recherchez le projet Devisia, y compris sous un ancien nom.
3. Comparez son Project Ref avec la configuration Vercel, les sauvegardes, les migrations et l’historique du dépôt.
4. Si le projet est introuvable, **arrêtez-vous avant toute recréation** afin de ne pas rompre le lien avec la base existante.

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

## ✅ Étape 6: Configurer Password Recovery

Dans **Authentication → URL Configuration** :

- définissez la Site URL sur le domaine Devisia de production ;
- autorisez `https://devisia.vercel.app/auth/reset-password` ;
- autorisez les domaines Preview explicitement nécessaires ;
- autorisez `http://localhost:3000/auth/reset-password` pour le développement local.

Dans **Authentication → Email** :

- vérifiez que le provider e-mail est actif ;
- vérifiez le template de récupération et sa variable de lien ;
- vérifiez le SMTP, les quotas et les rate limits avant un test réel contrôlé.

Le client accepte uniquement `NEXT_PUBLIC_SUPABASE_URL` et une clé publique `anon` ou
`publishable`. N’utilisez jamais une clé `service_role` dans une variable `NEXT_PUBLIC_*`.

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
