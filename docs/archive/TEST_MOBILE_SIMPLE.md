# 📱 Guide de Test Simple - Mobile

## 🎯 Test en 5 Minutes

### Prérequis
- Smartphone Android (Chrome) ou iOS (Safari)
- Connexion à https://devisia.vercel.app

---

## ÉTAPE 1 : Ouvrir la console (optionnel mais recommandé)

### Sur Android + PC
1. PC : Ouvrez Chrome → `chrome://inspect`
2. Smartphone : Connectez en USB
3. PC : Cliquez "Inspect" pour votre appareil

### Sur iOS + Mac
1. iPhone : Réglages → Safari → Avancé → Inspecteur web (ON)
2. Mac : Safari → Développement → [Votre iPhone]

---

## ÉTAPE 2 : Test de base

1. **Ouvrez** https://devisia.vercel.app/project/new sur votre smartphone
2. **Cliquez** sur "Commencer la Dictée" (bouton rouge 🎤)
3. **Autorisez** le microphone
4. **Dites** : "Rénovation complète de ma cuisine"
5. **Vérifiez** : Le texte apparaît dans la carte ?
   - ✅ OUI : Continuez
   - ❌ NON : Partagez les logs de console
6. **Cliquez** "Arrêter"
7. **Cliquez** "Valider"
8. **Vérifiez** : Le texte est dans le champ "Description" ?
   - ✅ OUI : Test réussi !
   - ❌ NON : Partagez les logs

---

## ÉTAPE 3 : Test anti-duplication

1. **Recommencez** (bouton "Recommencer")
2. **Dites** : "hello world"
3. **Vérifiez** le résultat :
   - ✅ "hello world" → PARFAIT
   - ❌ "hello hello world" → PROBLÈME (partagez les logs)

---

## ÉTAPE 4 : Test avec pause

1. **Recommencez**
2. **Dites** : "projet" [pause 2 secondes] "de rénovation"
3. **Vérifiez** :
   - ✅ "projet de rénovation" → PARFAIT
   - ❌ "projet projet de rénovation" → PROBLÈME

---

## 📊 Résultats attendus

| Test | Vous dites | Résultat attendu |
|------|-----------|------------------|
| 1 | "Rénovation complète de ma cuisine" | "rénovation complète de ma cuisine" |
| 2 | "hello world" | "hello world" |
| 3 | "projet" [pause] "de rénovation" | "projet de rénovation" |

**Aucun doublon de mots !**

---

## 🚨 Si ça ne marche pas

### Le micro ne démarre pas
- Vérifiez les permissions microphone
- Vérifiez que vous êtes en HTTPS (https://)
- Partagez les logs de console

### Texte dupliqué
- Partagez les logs de console
- Notez exactement ce que vous avez dit et ce qui s'affiche

### Autre problème
- Faites une capture d'écran
- Partagez les logs de console

---

## 📋 Checklist rapide

- [ ] Test 1 : Transcription de base OK
- [ ] Test 2 : Pas de doublon sur "hello world"
- [ ] Test 3 : Pas de doublon avec pause
- [ ] Le texte est copié dans le champ Description

**Si tout est ✅ : Le système fonctionne !**

---

**Note** : Les logs de console commencent par `[VoiceRecorder]`
