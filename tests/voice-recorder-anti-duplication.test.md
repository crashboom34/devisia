# Plan de QA manuelle — dictée vocale

Ce document est une checklist manuelle. Les tests automatisés réellement exécutables sont dans
`tests/voice-recognition.test.ts`. Aucun résultat sur appareil réel ne doit être déclaré « passé »
tant que la ligne correspondante n’a pas été vérifiée sur l’appareil indiqué.

## Préconditions

- Utiliser le déploiement Preview en HTTPS.
- Se connecter avec un compte QA prévu à cet effet.
- Ouvrir **Nouveau projet → Dictée vocale**.
- Autoriser le microphone uniquement pour ce test.
- Ne pas utiliser de données client réelles dans la dictée.

## Parcours fonctionnel

| Vérification | Résultat attendu | État |
| --- | --- | --- |
| Démarrer | Le navigateur demande l’autorisation si nécessaire, puis affiche « Écoute en cours… » | À vérifier |
| Résultat intermédiaire | Le texte provisoire est visible mais n’est pas ajouté plusieurs fois | À vérifier |
| Résultat final | Le texte final apparaît une seule fois | À vérifier |
| Pause | L’écoute s’arrête et aucun redémarrage automatique ne se produit | À vérifier |
| Reprendre | L’écoute reprend sans effacer le texte déjà dicté | À vérifier |
| Arrêter | L’écoute s’arrête définitivement et le CTA de validation reste accessible | À vérifier |
| Modifier puis annuler | Les modifications non enregistrées sont abandonnées | À vérifier |
| Modifier puis enregistrer | Le texte corrigé est conservé | À vérifier |
| Recommencer | Le transcript, le compteur et l’état de validation sont remis à zéro | À vérifier |
| Quitter l’écran pendant l’écoute | Le microphone est libéré et la reconnaissance ne redémarre pas | À vérifier |

## Cas d’erreur

| Scénario | Résultat attendu | État |
| --- | --- | --- |
| Permission refusée | Message clair, sans code technique, avec possibilité de réessayer | À vérifier |
| Aucun microphone | Message indiquant de vérifier le microphone | À vérifier |
| Perte réseau | Message réseau, fin du chargement, aucun redémarrage en boucle | À vérifier |
| Navigateur non compatible | Alternative de saisie texte clairement proposée | À vérifier |
| Silence prolongé | La session peut reprendre sans dupliquer le transcript | À vérifier |

## Matrice appareils

| Appareil | Navigateur | Démarrage | Pause/reprise | Anti-duplication | Erreurs | État |
| --- | --- | --- | --- | --- | --- | --- |
| iPhone récent | Safari | — | — | — | — | Non testé |
| Android récent | Chrome | — | — | — | — | Non testé |
| Desktop | Chrome | — | — | — | — | Non testé |
| Desktop | Edge | — | — | — | — | Non testé |

## Accessibilité et mobile

- Tester au clavier les boutons démarrer, pause, reprendre, arrêter, modifier et valider.
- Vérifier que le statut d’écoute et les erreurs sont annoncés par un lecteur d’écran.
- Vérifier les largeurs 390×844, 375×812 et 360×800 sans débordement horizontal.
- Vérifier que les boutons restent accessibles quand le clavier virtuel est ouvert.

## Limites connues du test automatisé

Les tests unitaires simulent l’API de reconnaissance vocale. Ils couvrent les courses de redémarrage,
pause, arrêt, démontage, erreurs et anti-duplication, mais ne prouvent ni la qualité de transcription,
ni l’autorisation microphone, ni la disponibilité du service du navigateur. Ces points exigent les
tests manuels sur le Preview avec de vrais appareils.
