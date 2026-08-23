# Aide Devis IA - Application de génération de devis BTP

Application Next.js avec Supabase pour générer des devis BTP automatiquement via IA.

## Fonctionnalités principales

- 🤖 **Génération automatique** de devis via IA (14 modèles disponibles)
- 🌡️ **Contrôle de température** pour ajuster la créativité de l'IA (0.0 à 1.0)
- 📊 **3 scénarios** par projet: Économique, Standard, Premium
- 🎙️ **Dictée vocale** pour décrire vos projets
- 🔄 **Fallback automatique** entre modèles en cas d'erreur
- 💡 **Justifications explicatives** pour chaque scénario de devis
- 💰 **Traçabilité complète** du modèle et paramètres utilisés
- 📱 **Interface responsive** pour mobile et desktop
- 🔐 **Authentification** Supabase avec RLS
- 👥 **Administration** complète des modèles et utilisateurs

## Modèles IA disponibles

### Gratuits (0€)
- Qwen 2 7B (par défaut, stable)
- Gemini 2.0 Flash (peut être rate-limité)

### Économiques (< 0.001$/1K tokens)
- DeepSeek Chat
- GPT-4o Mini
- Claude 3 Haiku
- Llama 3.1 70B

### Premium
- GPT-4o, Claude 3.5 Sonnet, Gemini Pro 1.5, et plus

## Installation et déploiement

Consultez les fichiers de documentation:
- `docs/operations/SUPABASE_SETUP.md` - Configuration de la base de données
- `docs/operations/OPENROUTER_SETUP.md` - Configuration de l'API OpenRouter
- `docs/operations/REDEPLOY.md` - Instructions de redéploiement
- `docs/archive/PROFESSIONAL_PROMPT.md` - Prompt professionnel d'économiste de la construction (historique, à vérifier contre le code)
- `docs/archive/TEMPERATURE_CONTROL.md` - Contrôle de température et liberté des IA (historique, à vérifier contre le code)
- `docs/archive/MODEL_FALLBACK.md` - Système de fallback automatique (historique, à vérifier contre le code)

Voir `docs/README.md` pour l'index complet et le niveau de fiabilité de chaque dossier de documentation.

## Technologies utilisées

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **IA**: OpenRouter (accès à 14+ modèles LLM)
- **Déploiement**: Vercel (recommandé)

## Développement local

```bash
npm install
npm run dev
```

L'application sera disponible sur http://localhost:3000

## Build production

```bash
npm run build
```

## Structure du projet

```
├── app/                    # Pages Next.js
│   ├── admin/             # Pages d'administration
│   ├── auth/              # Authentification
│   ├── dashboard/         # Tableau de bord
│   └── project/           # Gestion des projets
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants shadcn/ui
│   └── ...               # Composants métier
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Migrations SQL
└── lib/                  # Utilitaires
```

## Licence

Privé
