# Créer un Utilisateur Administrateur

## Méthode 1 : Via SQL Editor de Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez d'abord votre compte utilisateur via l'interface `/auth/register`
4. Récupérez votre user_id avec cette requête :

```sql
-- Trouver votre user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

5. Ajoutez-vous comme super admin :

```sql
-- Remplacez 'VOTRE_USER_ID' par l'UUID obtenu ci-dessus
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  'VOTRE_USER_ID',
  'super_admin',
  '{"full_access": true}'::jsonb
);
```

6. Vérifiez que ça fonctionne :

```sql
SELECT
  au.role,
  u.email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

## Méthode 2 : Commande Rapide

Si vous connaissez votre email, exécutez cette commande SQL :

```sql
-- Remplacez 'votre@email.com' par votre email
INSERT INTO admin_users (user_id, role, permissions)
SELECT
  id,
  'super_admin',
  '{"full_access": true}'::jsonb
FROM auth.users
WHERE email = 'votre@email.com';
```

## Après avoir créé l'admin

1. Déconnectez-vous et reconnectez-vous
2. Allez sur `/admin` - vous devriez maintenant avoir accès
3. Vous verrez le dashboard administrateur complet

## Rôles disponibles

- **super_admin** : Accès complet (config système, modèles, tout)
- **admin** : Accès à la gestion mais pas à la config système
- **support** : Accès en lecture uniquement

## Créer d'autres admins

Une fois que vous êtes super_admin, utilisez cette requête :

```sql
-- Ajouter un autre admin
INSERT INTO admin_users (user_id, role, permissions, created_by)
VALUES (
  'OTHER_USER_ID',
  'admin',
  '{"manage_users": true, "view_logs": true}'::jsonb,
  'YOUR_USER_ID'
);
```
