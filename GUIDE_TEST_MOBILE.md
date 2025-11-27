# 📱 Guide de Test - Dictée Vocale sur Smartphone

## 🎯 Test Rapide (2 minutes)

### Sur votre smartphone

1. **Ouvrez** https://devisia.vercel.app/project/new
2. **Cliquez** sur "Commencer la Dictée" (bouton rouge avec micro 🎤)
3. **Autorisez** le microphone si demandé
4. **Dites** : "Rénovation complète de ma cuisine avec nouveaux meubles"
5. **Vérifiez** que le texte apparaît EN TEMPS RÉEL
6. **Cliquez** sur "Arrêter" puis "Valider"

### ✅ Résultat attendu
```
Transcription : "rénovation complète de ma cuisine avec nouveaux meubles"
```

### ❌ Ce que vous NE devez PAS voir
```
"rénovation rénovation complète complète de ma cuisine cuisine..."
```

---

## 🔧 Si vous avez des problèmes

### "Accès au microphone refusé"
1. Sur **Android** : Appuyez sur le cadenas dans la barre d'adresse → Paramètres du site → Microphone → Autoriser
2. Sur **iOS** : Réglages → Safari → Microphone → Autoriser pour ce site

### "La reconnaissance vocale n'est pas supportée"
- Vérifiez votre navigateur :
  - **Android** : Utilisez Chrome ou Edge
  - **iOS** : Utilisez Safari (version 14.5+)

### Le micro ne démarre pas
1. Vérifiez que vous êtes bien sur **https://devisia.vercel.app** (pas http://)
2. Rechargez la page
3. Réessayez de cliquer sur "Commencer la Dictée"

---

## 📊 Navigateurs compatibles

| Plateforme | Navigateur | Statut |
|------------|-----------|--------|
| Android | Chrome 33+ | ✅ Recommandé |
| Android | Edge 79+ | ✅ OK |
| iOS | Safari 14.5+ | ✅ Recommandé |
| iOS | Chrome | ❌ Pas supporté (limitation iOS) |

---

**Note** : Sur iOS Safari, le micro peut prendre 1-2 secondes pour démarrer (c'est normal).
