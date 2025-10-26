# 🚀 Appliquer le Schéma à Votre Projet Supabase

## ✅ Étape 1: Ouvrir le SQL Editor

1. Allez sur votre dashboard Supabase: [https://supabase.com/dashboard/project/przldngfbtgdfblbuxlw](https://supabase.com/dashboard/project/przldngfbtgdfblbuxlw)
2. Dans le menu de gauche, cliquez sur **SQL Editor**

## ✅ Étape 2: Exécuter le Schéma Complet

1. Cliquez sur **"New Query"**
2. Ouvrez le fichier `COMPLETE_SCHEMA.sql` (dans ce projet)
3. **Copiez TOUT le contenu** (440 lignes)
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **"Run"** (en bas à droite)

### ⚠️ Si vous voyez des erreurs:

- **"relation already exists"** → C'est OK, ignorez (tables déjà créées)
- **"duplicate key"** → C'est OK, ignorez (données déjà insérées)
- D'autres erreurs → Envoyez-moi le message d'erreur

## ✅ Étape 3: Vérifier les Tables

1. Dans le menu, cliquez sur **Table Editor**
2. Vous devriez voir ces tables:
   - ✅ `profiles`
   - ✅ `api_keys`
   - ✅ `projects`
   - ✅ `estimates`
   - ✅ `ai_models` (avec 11 modèles)
   - ✅ `admin_users`
   - ✅ `subscription_tiers` (avec 4 tiers)
   - ✅ `user_subscriptions`
   - ✅ `api_usage_logs`
   - ✅ `rate_limits`
   - ✅ `system_config`
   - ✅ `user_preferences`

## ✅ Étape 4: Vérifier les Données Initiales

1. Cliquez sur la table **`ai_models`**
2. Vous devriez voir **11 modèles IA** pré-configurés
3. Cliquez sur **`subscription_tiers`**
4. Vous devriez voir **4 plans** (Free, Pro, Business, Enterprise)

## 🎯 Prochaine Étape: Créer Votre Compte Admin

Une fois le schéma appliqué:

### Option A: Via l'interface (Recommandé)

1. Démarrez l'app en local: `npm run dev`
2. Allez sur: `http://localhost:3000/auth/register`
3. Créez votre compte avec un email/mot de passe
4. Revenez à ce guide pour la dernière étape

### Option B: Via SQL (Avancé)

Si vous préférez créer un compte directement dans Supabase:

1. **Authentication** → **Users** → **Add User**
2. Email: `votre-email@example.com`
3. Password: choisissez un mot de passe
4. Cochez "Auto Confirm User"
5. Notez le **User ID** généré

## 🔐 Dernière Étape: Devenir Super Admin

Après avoir créé votre compte (Option A ou B):

1. Allez dans **Authentication** → **Users**
2. Copiez votre **User ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Allez dans **SQL Editor** → **New Query**
4. Exécutez cette commande:

```sql
INSERT INTO admin_users (user_id, role)
VALUES ('VOTRE-USER-ID-ICI', 'super_admin');
```

**Exemple:**
```sql
INSERT INTO admin_users (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'super_admin');
```

5. Cliquez **"Run"**

## ✅ Vérification Finale

1. Retournez sur votre app: `http://localhost:3000`
2. Connectez-vous avec vos identifiants
3. Allez sur: `http://localhost:3000/admin`
4. 🎉 Vous devriez voir le panel admin!

## 🚀 Déploiement sur Vercel

Une fois que tout fonctionne en local:

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez ces 2 variables (cochez Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://przldngfbtgdfblbuxlw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByemxkbmdmYnRnZGZibGJ1eGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzE3MzUsImV4cCI6MjA3NzA0NzczNX0.28u4pzLm0h85Aa7i1jrzmKLbhzQmXZROByTtJrqqN98
```

3. Push votre code:
```bash
git add .
git commit -m "feat: connect to Supabase production database"
git push
```

4. Vercel va automatiquement redéployer avec les nouvelles variables!

---

## 🆘 Besoin d'Aide?

Si quelque chose ne fonctionne pas:
1. Vérifiez les logs dans la console (F12)
2. Vérifiez les logs Supabase: **Logs** dans le menu
3. Envoyez-moi le message d'erreur exact
