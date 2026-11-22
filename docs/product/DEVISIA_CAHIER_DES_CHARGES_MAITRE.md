# DEVISIA — CAHIER DES CHARGES MAÎTRE CONSOLIDÉ
## Vision 22 modules + fonctions IA V2.1/V2.2 + spécification détaillée d'exécution

**Date de consolidation : 15 octobre 2026**  
**Dépôt :** https://github.com/crashboom34/devisia  
**Supabase de production identifié :** `fwuwzoxanrmsobwfnbxe`  
**Production :** https://devisia.vercel.app  

> **Promesse centrale : « Avec Devisia, vous ne remplissez plus vos devis. Vous leur parlez. »**
>
> Le produit doit faire gagner du temps dans les devis et rendre les coûts, les tâches et la rentabilité réellement pilotables. L'IA suggère, l'utilisateur décide. Les calculs financiers sont déterministes.

### Structure de ce document

- **Partie I — Décisions de cadrage et compléments :** arbitrages précédents et exigences absentes ou moins détaillées du cahier à 22 modules.
- **Partie II — Cahier des charges intégral des 22 modules :** reproduit sans retranchement depuis le document transmis.
- **Partie III — Spécification d'exécution/pointage/rentabilité :** reprise intégrale du document transmis précédemment (son ancien titre « Module 4 » ne correspond PAS à la numérotation du pôle A des 22 modules).

**Précédence en cas d'écart :** garder toute fonctionnalité de la vision ; appliquer les décisions explicites de phasage de la Partie I ; conserver la Partie III pour les détails du pointage et des coûts ; signaler toute contradiction matérielle avant implémentation. Les statuts « existant / partiel / absent » ne peuvent être attribués qu'après audit du dépôt et de la base autorisée.

---

# PARTIE I — DÉCISIONS DE CADRAGE ET COMPLÉMENTS TRANSVERSES

## 1. Produit : vision long terme, livraison incrémentale

La vision cible est un ERP SaaS BTP/TCE intégré de **22 modules**. Elle ne constitue **ni une demande de développer les 22 modules immédiatement, ni une autorisation d'accéder/modifier la production**. Pour la première mission Codex : auditer l'état réel, cartographier les dépendances, proposer une architecture modulaire et un backlog de PR testables. Soumettre le plan et les gates de migration et déploiement à validation. Commencer les PRs de développement seulement dans les périmètres explicitement autorisés.

Le nom commercial définitif et le domaine restent hors périmètre ; ne pas rebrander automatiquement. Ne pas dégrader la qualité de la bêta actuellement déployée.

## 2. Décisions conservées des échanges précédents

- **V2.1 — effet waouh sur les devis :** modifier un devis **par texte et à la voix** (en une instruction multi-opérations), dupliquer un devis, gérer une bibliothèque d'ouvrages propres à l'entreprise, voir la marge en temps réel et lancer un radar anti-oubli avant envoi.
- **V2.2 — apprentissage documentaire :** importer d'**anciens devis PDF** pour en extraire les ouvrages/quantités/prix de vente avec **validation humaine**, indépendamment de l'extraction des factures fournisseurs. Les factures fournisseurs reçues, leur historique de prix et l'affectation des achats sont également à intégrer, en réutilisant une infrastructure documentaire commune.
- **Exécution/Rentabilité :** tâches générées depuis devis accepté, planning modifiable, pointage salarié mobile, heures-homme et coûts imputés une seule fois, consommations distinctes des achats, marges finales prévisionnelles, alertes et ratios des chantiers terminés.
- **Signature électronique tierce : REPORTÉE** : conserver le suivi du statut d'acceptation et les preuves existantes, préparer l'intégration éventuelle avec un partenaire plus tard ; ne pas implémenter l'envoi pour signature à ce stade.
- **Facturation CLIENT électronique / émission de factures : REPORTÉE** : le module 17 demeure dans la vision P2, mais ne fait pas partie des premières livraisons. Les **factures fournisseurs reçues** du module 10 restent en périmètre prioritaire : ce sont deux domaines distincts.
- **Tarifs commerciaux et nom de domaine** : inchangés, ne pas les modifier sans décision explicite.

## 3. Exigences complémentaires pour la commande IA « Modifie mon devis » (modules 02 et 03)

### Expérience utilisateur

Dans un devis **brouillon**, proposer « Modifier avec l'IA » : commande textuelle, bouton micro exploitant la dictée existante, exemples et aperçu **avant/après**. Exemple : « Ajoute 25 m² de peinture à 32 € HT, retire la fourniture du carrelage, augmente la pose de 8 % et applique 5 % de remise ». Une instruction peut produire plusieurs propositions d'opérations.

### Contrat technique

1. Envoyer à l'IA un contexte minimal (lignes et identifiants stables, contenu nécessaire, sans exposer inutilement les données sensibles).
2. L'IA propose des opérations typées : ajout, retrait, modification de quantité/prix/description/catégorie/remise/conditions autorisées. Elle n'écrit **jamais** directement en base.
3. Parser et valider avec schéma strict : types, bornes, références, droits, organisation, statut et version courante, notamment contre la prompt injection.
4. En cas d'ambiguïté ou de coût/prix absent, faire confirmer sans inventer silencieusement.
5. Prévisualiser lignes changées, HT/TVA/TTC et marges connues ; enregistrer **uniquement après confirmation**, de façon atomique et avec gestion des conflits multi-onglets.
6. Conserver les coûts manuels, allocations internes, snapshots, devis acceptés immuables et séparation PDF client / coûts internes.
7. Réutiliser les moteurs de calcul et d'édition existants, pas de calcul de totaux par LLM.
8. Réutiliser la reconnaissance vocale existante, avec fallback texte et QA physique mobile à documenter.

### Coûts IA

Un appel à la validation de la commande, pas à chaque frappe. Ne pas appeler de LLM pour la duplication, les calculs de marge ni la recherche SQL dans une bibliothèque. Router vers un modèle économique **évalué sur la fiabilité**, limiter taille du contexte et retries, journaliser tokens/modèle/coût. Préparer des quotas administrables (hypothèses, non déploiement automatique) : Starter 20, Business 100, Pro 300 modifications/mois ; appliquer côté serveur avec contrôle des requêtes concurrentes et des abus, en respectant tous les quotas actuels.

## 4. Exigences complémentaires bibliothèque, marge, duplication (module 03)

- **Duplication :** un devis source même accepté peut servir de modèle à un **nouveau brouillon**, nouvel identifiant/numéro, nouvel client/projet explicite, aucune réutilisation d'acceptation/engagement/historique, aucun coût réel recopié, pas de double imputation.
- **Bibliothèque d'ouvrages :** distinguer clairement coût d'achat, composant, temps prévu, coût horaire, ouvrage de vente et prix de vente. Afficher unité, quantité, composantes matériaux/main-d'œuvre/autres et date/source du prix. Les changements futurs ne réécrivent jamais les devis historiques. Isolation par organisation.
- **Marge :** coûts incomplets = statut « incomplet / non calculable », pas de fausse marge. Marges prévisionnelles internes après remises sans réduire fictivement les coûts. Séparer **taux de marque** (marge/prix de vente), **taux de marge** (marge/coût) et résultat net comptable. Ne jamais publier les coûts internes au client.

## 5. Radar anti-oubli avant envoi (modules 02, 03 et 20)

Proposer un contrôle final visible et déclenché à la demande, sans dupliquer le moteur d'affinage existant. Réutiliser en particulier `btp-quote-auditor` si confirmé dans le code. Vérifier : incohérences de quantité, doublons, coûts ou prestations possiblement oubliés, évacuations/accessoires, hypothèses et études, risques et exclusions insuffisamment précisés. Séparer détections **déterministes** et recommandations IA. Pour chaque point : motif, gravité, référence au lot concerné, action manuelle, marquer traité/non applicable. Aucune correction automatique ; aucune garantie de conformité réglementaire ; résultat mis en cache par version du devis et invalidé en cas de changement pertinent.

## 6. Import des anciens devis et extraction documentaire (module 18, lien 03/10/11)

- Importer PDF anciens devis, extraire d'abord le texte et les tableaux (OCR / vision uniquement si nécessaire), gérer unités, décimales françaises, multi-pages et lots ; prévisualiser et corriger les lignes avant intégration en bibliothèque.
- **Prix de vente historique ≠ coût de revient** ; ne jamais fabriquer les coûts absents. Provenance, date, fichier source, confiance, doublons et données incomplètes doivent être visibles.
- Les factures fournisseurs alimentent les **prix d'achat** et les mouvements d'achat / stock, distinctement des devis historiques qui alimentent les **prix de vente**. Aucune mise à jour rétroactive des prix historiques.
- Contrôles sur taille/type, analyse sécurisée, rétention, stockage privé, antivirus/validation si nécessaire, RLS, confidentialité et prévention du traitement répété ; le contenu importé n'est jamais une instruction système.

## 7. Invariants métier transverses à tous les 22 modules

1. **Sources de vérité uniques :** coût engagé, facture reçue, réception, stock, consommation, coût imputé et paiement sont des concepts séparés. Définir les écritures sources et vues calculées pour éviter les doubles comptes.
2. **Temps unique :** `time_entries` et toute session future doivent avoir une relation claire ; une heure de salarié ne doit pas alimenter deux fois le coût chantier. Heures serveur, pauses, corrections auditables, snapshot de taux horaire, sessions persistantes.
3. **Allocation contrôlée :** la somme des sous-tâches/ventilations de chiffre d'affaires ne peut excéder le poste parent ; les achats et consommations ne doivent pas être comptabilisés à la fois comme coût consommé sur le même montant.
4. **Snapshots contractuels :** devis acceptés et budgets initiaux restent figés ; les évolutions passent par avenants et écritures justifiées.
5. **Multi-tenant + rôles :** RLS et contrôle serveur, accès minimum salarié, isolation salaires/marges/coûts et documents privés.
6. **Transactions et concurrence :** opérations idempotentes, anti-double-clic, verrouillage optimiste des devis/tâches, journal d'audit, rollback planifié et tests migrations.
7. **L'IA n'est jamais la source de vérité des montants :** propositions, extractions et recommandations révisables ; calculs HT/TVA/TTC, besoins nets, allocations, coûts et alertes déterministes.
8. **Paie et RGPD :** les relevés de temps ne remplacent pas automatiquement un système de paie, appliquer des permissions limitées, règles BTP variables et durée de conservation documentée.

## 8. Proposition de séquencement pour Codex — à vérifier et chiffrer après audit

La roadmap originale des 22 modules est reproduite ci-dessous. Les décisions déjà prises pour Devisia V2.1 restent valables et doivent être raccordées aux **priorités P0 de rentabilité réelle par chantier et tâche**, sans développement monolithique.

| Vague | Livraison attendue | Dépendances majeures |
|---|---|---|
| 0 | Audit code/base, cartographie 22 modules, contrats et modèle de données cible, tests de référence | Aucune migration prod |
| 1A | **V2.1 devis** : duplication, marges, bibliothèque, commande IA texte puis voix, radar anti-oubli | Éditeur de devis, prix, IA/voix existants |
| 1B | **Cœur opérationnel P0** : tâches depuis devis accepté, affectations, pointage, coûts historiques, rentabilité par tâche | Modèles de devis/budget/temps, intégrité financière |
| 2 | Planning Gantt mobile, matériel, conflits de ressources | Tâches/équipes et calendrier |
| 3 | PDF historiques + factures fournisseurs reçues, catalogue prix d'achat, achats, réception, stocks | Ingestion documentaire, produits, flux matières |
| 4 | Prévisions d'achats, commandes fournisseurs, rapprochements | Planning, besoins, stocks, commandes |
| 5 | Pilotage direction, alertes, analyse des chantiers terminés, rapports | Données d'exécution fiables |
| 6 | Élargissements CRM/SaaS et intégrations ; **signature tierce et facturation client seulement sur décision ultérieure** | Validation marché + contrats/contraintes légales |

Les sous-vagues 1A/1B ne doivent pas introduire des développements parallèles conflictuels. Codex doit recommander l'ordre exact des PR en fonction du graphe de dépendances observé. Ne pas débloquer 1B avec des hypothèses non vérifiées sur les coûts.

## 9. Première mission Codex et livrables

**Première mission : AUDIT ET ROADMAP, pas codage massif.**

1. Contrôler la tête de `main`, les PR ouvertes et l'état des checks. Distinguer code livré, branches non mergées, migrations appliquées et déploiements prêts.
2. Pour chacun des **22 modules numérotés**, restituer : objectif, état vérifié (`EXISTANT / PARTIEL / ABSENT / REDONDANT`), preuves (fichiers / fonctions / tables), manques, complexité, dépendances, charge par plage min–max avec hypothèses, tests critiques et acceptance gate.
3. Produire le schéma métier des sources de vérité pour devis→chantiers→tâches→heures→achats→stocks→consommations→rentabilité→historique, en distinguant les cas qui restent hors scope.
4. Proposer un backlog ordonné de PR modestes avec points de contrôle, migration additive, tests unitaires+intégration+RLS+end-to-end, QA mobile et charge de maintenance / appels IA / stockage.
5. Mettre en avant les zones à risque : double comptage, migration RH historique, confidentialité salariale, TVA/PDF, tarifs et quotas, coût IA, saisies hors ligne et conflits de synchronisation.
6. Préparer le plan de tests et les procédures de rollback ; préciser ce qui ne peut pas être testé sans équipement, compte de test ou environnement.
7. Fournir un rapport prêt pour décision **sans** modifier le Supabase de production, sans déployer ni fusionner des PR. Si l'utilisateur autorise ensuite des lots précis, les implémenter par PR testables avec preuves.

**Ne pas prétendre que le simple texte de ce document démontre que le code fonctionne déjà.**

---

# PARTIE II — CAHIER DES CHARGES ORIGINAL DES 22 MODULES (INTÉGRAL)

# DEVISIA — CAHIER DES CHARGES GLOBAL ET ROADMAP DES 22 MODULES

## 1. VISION STRATÉGIQUE

Je souhaite faire évoluer Devisia en un ERP SaaS intelligent dédié aux entreprises du bâtiment, particulièrement aux entreprises tous corps d'état (TCE).

Dépôt GitHub : https://github.com/crashboom34/devisia

L'objectif est de créer une plateforme professionnelle capable de gérer l'activité complète d'une entreprise BTP.

Le logiciel doit couvrir le cycle suivant :

**Prospection → Client → Étude du projet → Devis IA → Signature → Chantier → Tâches → Planning → Équipes → Achats → Stocks → Exécution → Pointage → Rentabilité → Facturation → Analyse et apprentissage.**

L'application doit être conçue pour être utilisée initialement par la SARL Bruno Mira, puis pouvoir être commercialisée auprès d'autres entreprises.

Je souhaite une solution très performante, simple à utiliser sur mobile, dotée d'une interface premium et d'une intelligence artificielle réellement utile.

L'IA doit assister les décisions, mais les utilisateurs autorisés doivent conserver la possibilité de modifier et contrôler les informations opérationnelles.

**Consigne importante : ce cahier des charges constitue la vision globale. Il ne faut pas recréer les fonctionnalités déjà présentes ni tout coder dans une seule modification gigantesque. Il faut auditer l'existant et construire une roadmap cohérente, avec des modules interconnectés, des priorités et des étapes testables.**

---

# PÔLE A — GESTION COMMERCIALE ET DEVIS

## MODULE 01 — CRM, CLIENTS ET PROSPECTS

**Priorité : P1 — Réutiliser et compléter l'existant.**

Fonctionnalités :

- Fiches clients particuliers et professionnels.
- Coordonnées, adresses et informations utiles.
- Historique des échanges.
- Historique des devis.
- Projets associés.
- Suivi des prospects.
- Statuts : nouveau, contacté, visite programmée, devis envoyé, négociation, gagné, perdu.
- Gestion des rendez-vous.
- Notes commerciales.
- Documents clients.
- Historique des chantiers.
- Relances manuelles et automatisables.
- Recherche et filtres.

Prévoir un tableau commercial montrant les devis en cours, les montants potentiels et les taux de transformation.

## MODULE 02 — SAISIE INTELLIGENTE DES PROJETS PAR IA

**Priorité : P1 — Améliorer le module actuel.**

Conserver et améliorer les fonctionnalités IA existantes.

Permettre de décrire un projet par :

- Texte.
- Dictée vocale.
- Photos.
- Plans PDF.
- Documents techniques.
- Métrés.
- Descriptions successives.

L'IA doit :

- Comprendre la demande.
- Identifier les corps de métier concernés.
- Structurer les travaux.
- Proposer des lots et sous-postes.
- Identifier les informations manquantes.
- Signaler les hypothèses incertaines.
- Proposer des quantités lorsque les données le permettent.

Ne jamais inventer des métrés précis à partir de photographies insuffisantes.

Permettre une conversation de raffinement du projet avant génération du devis.

## MODULE 03 — GÉNÉRATION DE DEVIS ET CHIFFRAGE BTP

**Priorité : P0 — Consolider le cœur de Devisia.**

Fonctionnalités attendues :

- Génération de devis assistée par IA.
- Devis manuels.
- Devis détaillés par corps de métier.
- Sous-tâches et sous-postes.
- Quantités et unités.
- Prix de vente unitaires.
- Coûts matériaux.
- Coûts de main-d'œuvre.
- Coûts de matériel.
- Sous-traitance.
- Frais généraux.
- Marges paramétrables.
- Différents taux de TVA applicables.
- Remises.
- Scénarios économique, standard et premium.
- Édition complète de chaque ligne.
- Bibliothèque de prix et de prestations.
- Export PDF professionnel.
- Historique et versions.
- Duplication de devis.

Intégrer progressivement les prix fournisseurs validés et les ratios de productivité issus des chantiers précédents.

Séparer clairement les coûts, le prix de vente, la marge sur coûts et les éventuelles charges indirectes.

## MODULE 04 — CYCLE COMMERCIAL, SIGNATURE ET AVENANTS

**Priorité : P1.**

Suivre les statuts :

Brouillon → Envoyé → Accepté → Refusé / Expiré.

Fonctions :

- Historique des versions.
- Envoi de devis.
- Suivi des consultations lorsque possible et autorisé.
- Validation d'acceptation.
- Pièces justificatives de signature.
- Signature électronique via un prestataire adapté si intégrée ultérieurement.
- Archivage du devis accepté.
- Création du chantier correspondant.
- Avenants.
- Travaux supplémentaires.
- Historique des modifications contractuelles.

Conserver les devis acceptés comme références contractuelles immuables.

Les modifications ultérieures doivent être traitées par avenants ou opérations traçables.

---

# PÔLE B — EXÉCUTION ET ORGANISATION DES CHANTIERS

## MODULE 05 — CRÉATION DES CHANTIERS ET TO-DO LIST INTELLIGENTE

**Priorité : P0 — Module majeur.**

Dès qu'un devis est accepté, proposer automatiquement la création du chantier.

Récupérer :

- Client.
- Adresse.
- Prestations.
- Lots.
- Sous-postes.
- Quantités.
- Budgets.
- Prix de vente.
- Main-d'œuvre prévue.
- Matériaux nécessaires.

Générer une liste de tâches opérationnelles à partir du devis.

Chaque tâche doit pouvoir être :

- Ajoutée.
- Modifiée.
- Fractionnée.
- Fusionnée.
- Replanifiée.
- Réaffectée.
- Archivée.
- Rouverte.

Statuts :

À faire → Planifiée → En cours → En pause / Bloquée → Terminée → Validée.

Chaque tâche doit contenir :

- Libellé.
- Chantier.
- Poste de devis d'origine.
- Quantité prévue.
- Prix de vente attribué, si connu.
- Budget de coûts prévu.
- Budget d'heures-homme.
- Salariés affectés.
- Matériel affecté.
- Matériaux nécessaires.
- Dates prévues et réelles.
- Avancement.
- Commentaires.

**Objectif : suivre la production réellement effectuée, poste par poste.**

## MODULE 06 — POINTAGE DES HEURES PAR SALARIÉ

**Priorité : P0 — Module majeur.**

Créer une interface mobile permettant à chaque salarié de :

- Sélectionner son chantier.
- Sélectionner sa tâche.
- Commencer le travail.
- Mettre en pause.
- Reprendre.
- Terminer.
- Enregistrer ses heures.
- Ajouter un commentaire.
- Corriger une saisie selon ses droits.

Permettre également la saisie manuelle, quotidienne et hebdomadaire.

Prévoir le pointage collectif par un chef de chantier.

Une tâche peut être exécutée par plusieurs salariés, à des horaires différents et sur plusieurs jours.

Calculer précisément les heures-homme.

Exemple :

Trois salariés travaillent quatre heures sur une tâche.

Résultat : 12 heures-homme, et non quatre heures.

Distinguer :

- Temps de production.
- Préparation.
- Nettoyage.
- Chargement.
- Déplacements.
- Pauses.
- Temps commun à plusieurs chantiers.

Conserver les horaires et corrections dans un historique sécurisé.

Réutiliser le système `time_entries` existant plutôt que créer un moteur comptable parallèle.

Éviter absolument de comptabiliser deux fois les heures.

## MODULE 07 — GESTION DES SALARIÉS ET COÛTS HORAIRES

**Priorité : P0/P1 — Compléter l'existant.**

Fonctionnalités :

- Fiches salariés.
- Fonctions et compétences.
- Équipes.
- Horaires habituels.
- Disponibilités.
- Absences.
- Congés.
- Planning individuel.
- Coût horaire employeur.
- Coûts complémentaires.
- Historique des taux.
- Affectations aux chantiers.
- Heures réalisées.
- Exports des pointages.

Prévoir un calcul du coût horaire interne de production, distinct des éléments réglementaires utilisés pour la paie.

Tenir compte du salaire brut, des cotisations employeur et des autres charges réellement pertinentes.

Ne pas confondre salaire net, coût employeur et coût complet d'une heure productive.

Limiter l'accès aux données salariales sensibles aux personnes habilitées.

## MODULE 08 — CALENDRIER ET PLANNING DES CHANTIERS

**Priorité : P0 — Module majeur.**

Je veux un calendrier BTP haut de gamme, fluide et entièrement modifiable.

Vues obligatoires :

- Jour.
- Semaine.
- Mois.
- Gantt.
- Par chantier.
- Par salarié.
- Par équipe.
- Par matériel.

Fonctionnalités :

- Création automatique ou manuelle de planning.
- Glisser-déposer.
- Modification des dates.
- Modification des horaires.
- Allongement et réduction des tâches.
- Fractionnement.
- Gestion des pauses.
- Dépendances entre travaux.
- Affectation de plusieurs équipes.
- Gestion des jours non travaillés.
- Gestion des conflits de ressources.
- Réorganisation des chantiers.
- Alertes de retard.
- Export PDF.
- Impression.

Une modification du calendrier ne doit jamais modifier les heures historiques déjà travaillées.

L'IA peut suggérer les durées et l'ordre des tâches selon le devis, les ressources disponibles et l'historique, mais ne doit pas imposer ses choix.

**Exigence absolue : le planning doit rester modifiable même après validation, avec historisation des changements.**

## MODULE 09 — GESTION DU MATÉRIEL ET DES ENGINS

**Priorité : P1.**

Créer un catalogue des ressources matérielles :

- Pelles.
- Mini-pelles.
- Bobcat.
- Camions.
- Télescopiques.
- Outillage.
- Matériel loué.
- Autres équipements.

Informations :

- Nom.
- Type.
- Immatriculation ou numéro interne si pertinent.
- Disponibilité.
- Localisation déclarée.
- Affectations.
- Entretien.
- Immobilisations.
- Location.
- Coût d'utilisation estimé.
- Historique.

Relier chaque ressource au calendrier.

Détecter les doubles réservations.

Permettre l'imputation du coût du matériel aux tâches ou aux chantiers.

Prévoir une distinction entre coût direct d'utilisation, entretien, amortissement et coût locatif pour éviter les doubles comptes.

---

# PÔLE C — FOURNISSEURS, ACHATS ET STOCKS

## MODULE 10 — IMPORT INTELLIGENT DES FACTURES FOURNISSEURS

**Priorité : P0 — Module majeur.**

Je souhaite pouvoir transmettre toutes les factures fournisseurs à Devisia, même lorsqu'elles ne concernent aucun chantier particulier.

Modes d'import :

- Photo smartphone.
- PDF.
- JPG/PNG.
- Import multiple.
- Import email ultérieur sous autorisation.

L'IA extrait :

- Fournisseur.
- Numéro de facture.
- Date.
- Désignations des articles.
- Références.
- Quantités.
- Unités.
- Prix unitaires HT.
- Remises.
- Frais de transport.
- TVA.
- Total HT/TTC.

Les extractions doivent être vérifiables, corrigeables et validées avant de modifier les données métier.

Conserver le document original.

Détecter les factures en double, avoirs et incohérences.

Ce module concerne les **factures reçues des fournisseurs**, à distinguer des factures émises aux clients.

## MODULE 11 — CATALOGUE MATÉRIAUX ET HISTORIQUE DES PRIX

**Priorité : P0/P1.**

Créer une bibliothèque de matériaux contenant :

- Désignation normalisée.
- Caractéristiques techniques.
- Unités.
- Conditionnements.
- Références fournisseurs.
- Prix HT observés.
- Remises.
- Frais annexes.
- Dates d'achat.
- Historique.
- Justificatifs.

Fonctionnalités :

- Recherche de matériau.
- Dernier prix validé.
- Comparateur fournisseurs.
- Évolution du prix.
- Alertes de hausse.
- Références de prix pour les futurs devis.
- Détection des matériaux similaires.

Ne pas considérer deux produits comme identiques uniquement parce que leurs noms se ressemblent.

Les prix doivent être historisés, et non simplement écrasés.

Un prix historiquement payé n'est pas nécessairement une offre commerciale encore valable.

## MODULE 12 — GESTION DES STOCKS ET MOUVEMENTS

**Priorité : P0/P1.**

Créer une gestion des stocks par entreprise et éventuellement par dépôt.

Distinguer :

- Achat.
- Réception.
- Entrée en stock.
- Stock disponible.
- Stock réservé.
- Sortie vers chantier.
- Consommation.
- Retour de chantier.
- Retour fournisseur.
- Ajustement d'inventaire.

Permettre l'affectation d'un achat à plusieurs chantiers et au stock.

Exemple :

Une facture contient 100 agglos.

- 40 sont affectés au chantier A.
- 35 au chantier B.
- 25 au stock général.

L'utilisateur doit pouvoir modifier cette ventilation.

Distinguer la destination prévue d'un achat de sa consommation réelle.

Empêcher les affectations supérieures aux quantités disponibles, les sorties incohérentes et la double comptabilisation.

Prévoir une méthode de valorisation du stock cohérente et documentée.

## MODULE 13 — ACHATS PRÉVISIONNELS INTELLIGENTS

**Priorité : P0 — Module majeur.**

À partir des devis signés, des tâches et du planning, Devisia doit calculer les besoins en matériaux.

Prendre en compte :

- Quantités nécessaires.
- Quantités déjà consommées.
- Stock disponible.
- Stock réservé.
- Commandes en cours.
- Livraisons prévues.
- Pertes prévisionnelles.
- Conditionnements.
- Délais fournisseurs.
- Dates de besoin sur chantier.

Créer un tableau « Achats à prévoir ».

Afficher :

- Matériau.
- Chantier.
- Quantité nécessaire.
- Quantité disponible.
- Quantité nette à commander.
- Fournisseur suggéré.
- Prix connu.
- Coût prévisionnel.
- Date limite de commande.
- Priorité.

Exemple :

Besoin de 500 agglos.

Stock physique : 250.

Dont 70 réservés.

Stock disponible : 180.

Besoin net : 320 agglos, sous réserve des éventuelles commandes déjà attendues.

Le système doit recalculer les besoins lorsque les quantités ou le planning changent, sans modifier automatiquement des commandes validées.

## MODULE 14 — COMMANDES FOURNISSEURS ET APPROVISIONNEMENTS

**Priorité : P1.**

Créer un processus complet :

- Liste d'achats.
- Demande de prix.
- Comparaison fournisseurs.
- Brouillon de commande.
- Bon de commande.
- Suivi de livraison.
- Réception.
- Réception partielle.
- Contrôle des écarts.
- Rapprochement commande/facture.

Statuts :

Brouillon → Validé → Commandé → Partiellement reçu → Reçu → Rapproché.

Permettre le regroupement des achats de plusieurs chantiers.

Exemple :

Trois chantiers nécessitent respectivement 150, 80 et 70 sacs de ciment.

Le logiciel peut proposer une commande groupée de 300 sacs.

Vérifier les délais, remises, frais de transport, conditionnements, capacités de stockage et trésorerie avant de recommander un regroupement.

Aucune commande ne doit être envoyée automatiquement sans validation.

---

# PÔLE D — COÛTS, MARGES ET RENTABILITÉ

## MODULE 15 — RENTABILITÉ PAR TÂCHE

**Priorité : P0 — Fonction stratégique.**

Je veux savoir si chaque prestation vendue rapporte réellement de l'argent.

Pour chaque tâche :

- Prix de vente HT attribué.
- Budget main-d'œuvre.
- Heures-homme prévues.
- Heures-homme réelles.
- Coût main-d'œuvre.
- Budget matériaux.
- Consommation réelle.
- Matériel.
- Sous-traitance.
- Autres dépenses.
- Coût réel à date.
- Reste à faire.
- Coût final prévisionnel.
- Marge prévisionnelle.
- Écart au budget.

Exemple :

Prestation vendue 1 000 € HT.

Coût horaire de production estimé : 35 €/h.

- 1 salarié pendant 1 heure = 35 € de main-d'œuvre.
- 6 salariés pendant 1 heure = 210 €.
- 2 salariés pendant 3 jours de 7 heures = 1 470 €.

Le logiciel doit montrer immédiatement l'impact du nombre de salariés et du temps sur la rentabilité.

Ajouter des alertes :

- Budget d'heures consommé à 75 %.
- Budget dépassé.
- Coût matériaux dépassé.
- Tâche probablement déficitaire.

Les seuils doivent être paramétrables.

Distinguer une tâche terminée d'une tâche encore en cours : le coût enregistré à date n'est pas forcément le coût final.

Les budgets de vente répartis entre sous-tâches ne doivent jamais être comptés plusieurs fois.

## MODULE 16 — RENTABILITÉ GLOBALE ET TABLEAU DE BORD DIRECTION

**Priorité : P0/P1.**

Créer un tableau de bord de gestion affichant :

- Chantiers actifs.
- Chantiers à venir.
- Montant des devis signés.
- Chiffre d'affaires contractuel.
- Travaux supplémentaires validés.
- Coûts engagés.
- Coûts consommés.
- Budget restant estimé.
- Marge initiale.
- Marge finale prévisionnelle.
- Tâches déficitaires.
- Alertes de dépassement.
- Heures prévues/réelles.
- Achats à venir.
- Stocks disponibles.
- Matériel immobilisé.
- Ressources disponibles.

Prévoir une vue par chantier et une vue consolidée entreprise.

Distinguer :

- Chiffre d'affaires vendu.
- Chiffre d'affaires facturé.
- Encaissements.
- Coûts constatés.
- Engagements de dépenses.
- Trésorerie.
- Marge.

Ne pas mélanger ces indicateurs.

Prévoir des graphiques d'évolution et des filtres par période, chantier, client et type de travaux.

## MODULE 17 — FACTURATION CLIENT ET SUIVI DES RÈGLEMENTS

**Priorité : P2 — À réaliser après stabilisation des devis et chantiers.**

Compléter la page de facturation existante.

Prévoir :

- Factures clients.
- Factures d'acompte.
- Factures de situation.
- Factures de solde.
- Avoirs.
- Références aux devis et avenants.
- Échéances.
- Paiements partiels.
- Soldes restant dus.
- Relances.
- Export comptable.
- Documents PDF.

Prévoir un rapprochement entre les factures émises, les montants contractuels, les paiements enregistrés et les travaux réalisés.

Respecter les obligations françaises de facturation et anticiper les exigences de facturation électronique applicables selon les entreprises et les échéances réglementaires.

Ne pas considérer l'édition d'un PDF comme une solution de facturation électronique conforme.

---

# PÔLE E — PILOTAGE, AUTOMATISATION ET IA

## MODULE 18 — DOCUMENTS ET DOSSIERS DE CHANTIER

**Priorité : P1/P2.**

Créer un espace documentaire organisé par chantier :

- Devis.
- Devis signés.
- Avenants.
- Plans.
- Photographies.
- Factures fournisseurs.
- Bons de livraison.
- Bons de commande.
- Comptes rendus.
- Documents de sécurité.
- Attestations.
- Réceptions.
- Réserves.
- Autres justificatifs.

Prévoir :

- Classement.
- Recherche.
- Versions.
- Téléchargement.
- Prévisualisation.
- Permissions.
- Historique.
- Liens avec les tâches correspondantes.

Les documents sensibles doivent être enregistrés dans un stockage privé.

## MODULE 19 — ALERTES, NOTIFICATIONS ET AUTOMATISATIONS

**Priorité : P1/P2.**

Créer un centre de notifications regroupant :

- Chantiers en retard.
- Tâches dépassant leur budget.
- Conflits de planning.
- Manque de matériaux.
- Commandes à passer.
- Livraisons attendues.
- Factures à valider.
- Documents manquants.
- Tâches bloquées.
- Échéances clients.
- Variations importantes des prix d'achat.

Prévoir des préférences individuelles et des niveaux d'importance.

Permettre des automatisations internes, mais demander une autorisation explicite pour les actions externes sensibles : envoi d'email, commande, modification contractuelle ou relance financière.

## MODULE 20 — INTELLIGENCE HISTORIQUE ET AMÉLIORATION DES FUTURS DEVIS

**Priorité : P2 — Fonction stratégique à long terme.**

L'application doit progressivement apprendre des chantiers terminés.

Objectifs :

- Comparer estimations et réalisations.
- Mesurer les heures-homme par unité.
- Mesurer les coûts matériaux.
- Identifier les tâches régulièrement sous-évaluées.
- Améliorer les durées prévisionnelles.
- Améliorer les prix de revient.
- Proposer des prix de vente cohérents.
- Affiner les besoins d'équipes.
- Améliorer la planification.
- Anticiper les risques financiers.

Exemples de ratios :

- Heures-homme par m² de mur.
- Heures-homme par m³ de béton.
- Heures-homme par m² de placo.
- Heures-homme par m² de carrelage.
- Coût réel de main-d'œuvre par poste.
- Variation des prix des matériaux.

L'IA doit utiliser des données comparables et indiquer son niveau de confiance.

Une tâche terminée dans des conditions particulières ne doit pas modifier automatiquement tous les ratios de l'entreprise.

Les suggestions doivent être explicables et validables.

Ne jamais modifier les anciens devis signés.

## MODULE 21 — RAPPORTS, EXPORTS ET INTÉGRATIONS

**Priorité : P2.**

Prévoir des rapports professionnels :

- Rentabilité par chantier.
- Rentabilité par tâche.
- Suivi des heures.
- Planning hebdomadaire.
- Suivi des équipes.
- Matériaux consommés.
- Stock.
- Achats prévisionnels.
- Historique des prix.
- Fournisseurs.
- Facturation.
- Trésorerie prévisionnelle.

Exports :

- PDF.
- Excel/CSV.
- Formats structurés adaptés aux intégrations.

Préparer des connecteurs futurs avec :

- Logiciels comptables.
- Fournisseurs.
- Email.
- Agendas.
- Outils d'automatisation.
- Services de facturation électronique.

Ne pas créer toutes ces intégrations immédiatement.

Concevoir une architecture extensible, documentée et sécurisée.

---

# PÔLE F — PLATEFORME SAAS

## MODULE 22 — ADMINISTRATION, ABONNEMENTS, SÉCURITÉ ET APPLICATION MOBILE

**Priorité : P0 pour la sécurité et les fondations ; P2 pour les fonctionnalités commerciales avancées.**

### A. Gestion SaaS

Conserver et améliorer :

- Authentification.
- Organisations.
- Gestion multi-entreprises.
- Permissions.
- Abonnements.
- Fonctionnalités selon l'offre.
- Limites d'utilisation.
- Administration.
- Gestion des modèles IA.
- Historique de consommation IA.

### B. Rôles

Prévoir au minimum :

- Super-administrateur.
- Administrateur d'entreprise.
- Responsable ou chef de chantier.
- Salarié.
- Collaborateur administratif.

Les permissions doivent être adaptées à chaque action.

Un salarié ne doit pas voir automatiquement les marges commerciales, les prix fournisseurs confidentiels ou les coûts individuels des autres salariés.

### C. Application mobile

L'ensemble de la plateforme doit être responsive.

Les usages les plus fréquents sur chantier doivent être particulièrement simples :

- Voir son planning.
- Consulter les tâches.
- Pointer ses heures.
- Prendre une photo de facture.
- Enregistrer une livraison.
- Déclarer une consommation.
- Signaler un problème.
- Suivre l'avancement.

Étudier une PWA installable sur smartphone, avec gestion sécurisée des interruptions réseau et synchronisation différée pour les actions compatibles.

### D. Sécurité

- Isolation stricte des organisations.
- Supabase RLS.
- Contrôle des permissions côté serveur.
- Stockage privé des documents.
- Gestion des secrets.
- Journal d'audit.
- Historique des corrections.
- Protection contre les doubles écritures.
- Sauvegardes et procédures de restauration.
- Tests de non-régression.
- Respect du RGPD.

### E. Commercialisation future

Concevoir les modules pour qu'ils puissent être activés ou désactivés selon les abonnements.

Ne pas imposer à une petite entreprise toutes les fonctions avancées si elle souhaite uniquement créer ses devis.

Prévoir une évolution modulaire des offres SaaS sans perturber les utilisateurs existants.

---

# ARCHITECTURE FONCTIONNELLE ATTENDUE

Les modules ne doivent pas fonctionner indépendamment.

Je souhaite les liaisons suivantes :

**Devis signé**
→ Création du chantier
→ Création des tâches
→ Budget initial figé
→ Proposition de planning
→ Affectation des ressources.

**Tâches planifiées**
→ Besoins en matériaux
→ Vérification du stock
→ Calcul des quantités à acheter
→ Commandes proposées
→ Réception et affectation.

**Travaux exécutés**
→ Pointage des salariés
→ Consommations réelles
→ Coûts de matériel
→ Rentabilité par tâche
→ Rentabilité globale.

**Factures fournisseurs**
→ Extraction IA
→ Validation
→ Historique des prix
→ Entrées ou affectations
→ Stocks et coûts
→ Actualisation des estimations futures.

**Chantiers terminés**
→ Analyse des écarts
→ Constitution de références historiques
→ Amélioration des futurs devis
→ Amélioration des plannings et achats prévisionnels.

Chaque événement doit avoir une source de vérité clairement identifiée.

Ne jamais compter deux fois une même dépense, une même quantité de matériau ou une même heure de travail.

---

# PRIORISATION ET ROADMAP

Je veux un plan de développement organisé en phases et en Pull Requests indépendantes.

## Phase 0 — Audit et sécurisation des fondations

- Inventaire exact de l'existant.
- État des modules fonctionnels et incomplets.
- Audit des tables et migrations.
- Analyse des dépendances.
- Vérification du modèle de permissions.
- Stratégie de compatibilité.
- Tests de référence.
- Architecture cible.
- Stratégie de découpage.

## Phase 1 — Exécution et rentabilité opérationnelle

Développer ou compléter en priorité :

- Module 05 : chantiers et tâches.
- Module 06 : pointage.
- Module 07 : salariés et coûts.
- Module 15 : rentabilité par tâche.

Objectif : mesurer réellement les heures-homme et les dépassements.

## Phase 2 — Planification et ressources

- Module 08 : calendrier et Gantt.
- Module 09 : matériel.
- Intégration aux tâches et aux pointages.

Objectif : maîtriser l'organisation quotidienne.

## Phase 3 — Fournisseurs et stocks

- Module 10 : factures fournisseurs.
- Module 11 : catalogue de prix.
- Module 12 : stocks.
- Module 14 : commandes et réceptions.

Objectif : disposer d'une source fiable pour les achats et consommations.

## Phase 4 — Achats prévisionnels

- Module 13 : achats prévisionnels.
- Connexion aux tâches, plannings, stocks et fournisseurs.

Objectif : anticiper les besoins, les délais et les dépenses.

## Phase 5 — Consolidation financière

- Module 16 : rentabilité globale.
- Module 17 : facturation client.
- Module 18 : documents.
- Module 19 : alertes.

Objectif : piloter l'activité et les flux financiers.

## Phase 6 — Intelligence et industrialisation SaaS

- Module 20 : apprentissage historique.
- Module 21 : rapports et intégrations.
- Améliorations des modules 01 à 04.
- Finalisation des évolutions du module 22.

Objectif : rendre la plateforme plus automatisée, fiable, compétitive et commercialisable.

Cet ordre est une proposition stratégique. L'audit du code doit permettre de le valider ou de l'ajuster.

Ne pas différer les exigences fondamentales de sécurité, d'autorisations et de qualité à la dernière phase.

---

# PRINCIPES TECHNIQUES IMPÉRATIFS

1. Réutiliser Next.js, TypeScript, Supabase et les fonctions existantes lorsqu'ils sont adaptés.
2. Ne pas recréer de tables ou moteurs métier faisant doublon.
3. Préserver les données existantes.
4. Mettre en place des migrations vérifiables.
5. Utiliser des calculs déterministes pour les montants et quantités.
6. Utiliser l'IA pour l'extraction, la compréhension, les propositions et les analyses.
7. Conserver l'historique des prix et des coûts.
8. Garantir l'isolation des données entre entreprises.
9. Maintenir une application fonctionnelle à chaque étape.
10. Vérifier les flux complets, pas seulement les composants visuels.
11. Prévoir des tests automatisés des règles financières et des mouvements de stock.
12. Optimiser le coût des appels IA.
13. Préserver les devis signés et les documents comptables.
14. Séparer données réelles, estimations et suggestions IA.
15. Privilégier des interfaces simples et rapides sur mobile.

---

# EXIGENCES DE DESIGN

Le futur Devisia doit avoir une interface professionnelle comparable aux meilleurs logiciels SaaS spécialisés.

Je veux :

- Un tableau de bord moderne.
- Une navigation claire entre les modules.
- Un calendrier haut de gamme.
- Une to-do list très intuitive.
- Des fiches chantiers lisibles.
- Des graphiques financiers précis.
- Des tableaux de stocks faciles à filtrer.
- Des alertes utiles.
- Des formulaires rapides.
- Des couleurs cohérentes.
- Un excellent rendu sur téléphone.
- Des actions accessibles en peu de clics.

Privilégier la lisibilité, la rapidité et l'efficacité opérationnelle.

L'utilisateur doit comprendre immédiatement l'état d'un chantier, même sans compétences informatiques avancées.

---

# CE QUE J'ATTENDS DE CE CHAT DEVISIA

Je te transmets ce cahier des charges pour l'intégrer à notre projet Devisia.

Ta première mission est de :

1. Analyser l'état actuel du dépôt GitHub.
2. Répertorier les 22 modules ci-dessus.
3. Identifier lesquels sont déjà réalisés, partiellement réalisés, absents ou redondants.
4. Proposer l'architecture définitive sans casser l'existant.
5. Évaluer les dépendances techniques et fonctionnelles.
6. Prioriser les modules selon leur valeur commerciale et leur complexité.
7. Proposer un découpage détaillé du développement.
8. Estimer les charges de travail et coûts d'exploitation avec leurs hypothèses.
9. Définir les conditions de validation de chaque phase.
10. Recommander l'ordre optimal d'implémentation.

Pour chaque module, produire un tableau indiquant :

- Nom.
- Objectif.
- État actuel vérifié.
- Fonctions existantes réutilisables.
- Fonctionnalités manquantes.
- Priorité.
- Dépendances.
- Complexité.
- Charge estimative.
- Tests nécessaires.
- Critères de validation.

Ensuite, conserver cette feuille de route comme référence du projet et préparer les instructions de développement pour Codex, module par module.

**Je ne veux pas un empilement de fonctionnalités indépendantes. Je veux un logiciel cohérent dans lequel toutes les informations circulent correctement et servent à améliorer la gestion et la rentabilité réelle des entreprises du bâtiment.**

La priorité absolue est la rentabilité par chantier et par tâche, avec une vision fiable des heures réellement travaillées, des matériaux consommés et des coûts supportés.

Ne pas commencer une refonte massive non contrôlée et ne pas modifier la production sans validation.

Commence par un audit du dépôt actuel et une roadmap détaillée des 22 modules.

---

# PARTIE III — SPÉCIFICATION DÉTAILLÉE DU SUIVI D'EXÉCUTION (ANNEXE INTÉGRALE)

**Attention aux intitulés historiques :** cette annexe portait précédemment le titre « Module 4 : gestion des tâches, pointage... ». Dans la numérotation cible à 22 modules, elle détaille surtout les **modules 05, 06, 07, 08, 10, 12, 13, 15, 16 et 20**. Le « Module 04 » de la Partie II reste le cycle commercial/signature/avenants. Ne jamais confondre ces numéros.

# DEVISIA — MODULE 4 : GESTION DES TÂCHES, POINTAGE DES SALARIÉS ET RENTABILITÉ PAR POSTE

## MISSION

Je souhaite ajouter à Devisia un module complet de suivi d'exécution des chantiers.

Ce module doit être entièrement intégré aux trois autres modules déjà demandés :

1. Factures fournisseurs et suivi des prix.
2. Planning de chantiers entièrement modifiable.
3. Besoins d'achats prévisionnels.

**Objectif : savoir précisément combien rapporte ou coûte chaque tâche d'un chantier, en fonction du temps réellement consacré, du nombre de salariés mobilisés, des matériaux consommés et des autres coûts.**

Le logiciel doit pouvoir apprendre des chantiers terminés pour améliorer progressivement les futurs devis et plannings.

## 1. IMPORTANT : RÉUTILISER LES FONCTIONNALITÉS EXISTANTES

Dépôt : https://github.com/crashboom34/devisia

Le code possède déjà notamment :

- `jobs`
- `employees`
- `time_entries`
- `quote_cost_items`
- `job_budget_snapshots`
- `job_cost_entries`
- `job_change_orders`
- `job_performance_snapshots`
- `lib/job-costing.ts`
- `lib/job-intelligence.ts`

Il existe également une fonction `accept_estimate_and_create_job`.

Examiner leur implémentation complète et les migrations avant toute modification.

Le suivi des heures existe déjà partiellement, avec un enregistrement par salarié, chantier et journée. Il faut le faire évoluer vers un suivi détaillé par tâche et par session de travail.

Ne pas recréer un moteur parallèle qui comptabiliserait les heures ou les coûts en double.

Respecter l'immuabilité des devis acceptés et des coûts horaires historiques. Si une correction comptable est nécessaire, prévoir une écriture rectificative traçable.

## 2. TO-DO LIST AUTOMATIQUE À PARTIR DU DEVIS ACCEPTÉ

Dès qu'un devis est signé et transformé en chantier, proposer de générer une liste de tâches opérationnelles.

Reprendre les postes du devis et permettre leur décomposition en sous-tâches.

Exemple :

Chantier : construction d'une extension.

- Préparation du chantier.
- Implantation.
- Terrassement.
- Ferraillage.
- Coffrage.
- Coulage du béton.
- Élévation des murs.
- Plancher.
- Étanchéité.
- Second œuvre.
- Finitions.

Ces tâches doivent être adaptées au devis réel et non produites à partir d'une liste générique imposée.

Chaque tâche doit comporter :

- Identifiant unique.
- Chantier parent.
- Référence du ou des postes du devis.
- Intitulé et description.
- Quantité et unité de travail, si applicable.
- Prix de vente HT attribué lorsqu'il peut être déterminé.
- Budget de main-d'œuvre prévu.
- Nombre d'heures-homme prévues.
- Budget matériaux.
- Budget matériel et autres dépenses.
- Équipe affectée.
- Dates et horaires planifiés.
- Date et heure du début réel.
- Date et heure de fin réelle.
- Avancement.
- Statut.
- Commentaires éventuels.

Si un poste commercial couvre plusieurs sous-tâches, permettre la répartition explicite des budgets sans dupliquer le prix de vente.

Ne jamais inventer une ventilation financière lorsque le devis ne permet pas de l'établir. Proposer une saisie manuelle.

## 3. STATUTS DES TÂCHES

Créer les statuts suivants :

- À faire.
- Planifiée.
- En cours.
- En pause.
- Bloquée.
- Terminée.
- Validée.

Permettre de démarrer, arrêter, reprendre et rouvrir une tâche selon les droits de l'utilisateur.

Une tâche peut s'étaler sur plusieurs jours.

Une tâche peut être effectuée par plusieurs salariés simultanément ou successivement.

Les tâches restent entièrement modifiables, sans altérer les devis contractuels déjà signés.

## 4. CHRONOMÉTRAGE INDIVIDUEL SUR MOBILE

Créer un espace salarié très simple.

Après authentification, chaque salarié voit ses chantiers et les tâches qui lui sont affectées.

Il peut :

- Sélectionner son chantier.
- Sélectionner sa tâche.
- Appuyer sur « Commencer ».
- Mettre son travail en pause.
- Reprendre.
- Appuyer sur « Terminer ».
- Consulter ses heures.
- Proposer une correction en cas d'erreur.

Lorsqu'il démarre une tâche, enregistrer l'heure serveur de début.

Lorsqu'il termine, enregistrer l'heure serveur de fin.

Permettre de saisir manuellement des horaires oubliés, avec indication explicite que la saisie est manuelle.

Les interruptions, pauses et temps non imputables à la tâche doivent être distingués.

Ne pas utiliser uniquement un compteur JavaScript local : les sessions doivent être persistées et récupérables après fermeture de l'application ou changement d'appareil.

Prévoir une reconnexion robuste et le traitement des sessions incomplètes.

## 5. GESTION DES ÉQUIPES

Un chef de chantier ou administrateur doit pouvoir :

- Démarrer une tâche pour une équipe autorisée.
- Ajouter ou retirer un salarié affecté.
- Modifier les horaires individuels.
- Déclarer une intervention collective.
- Corriger une erreur de pointage.
- Réaffecter une période à une autre tâche.
- Ajouter une intervention imprévue.

Un démarrage collectif doit créer des sessions individuelles distinctes.

Exemple :

Trois salariés travaillent de 8 h à 12 h.

Temps de présence sur la tâche : 4 heures.

Temps total consommé : 12 heures-homme.

Si un salarié part à 10 h, le calcul doit utiliser ses deux heures réelles et non lui attribuer quatre heures.

Contrôler les chevauchements incohérents de sessions pour une même personne.

Les corrections doivent conserver l'identité de leur auteur, l'heure et le motif.

## 6. SAISIE DES HEURES ET TEMPS DE TRAVAIL

Distinguer deux notions :

A. Temps de travail du salarié, utile au suivi des horaires et éventuellement à la préparation des éléments de paie.

B. Temps productif imputé à une tâche, utilisé pour déterminer la rentabilité du chantier.

Ne pas supposer que ces deux durées sont toujours identiques.

Prévoir notamment :

- Travail productif sur tâche.
- Préparation et rangement.
- Déplacement.
- Chargement ou déchargement.
- Pause.
- Activité commune à plusieurs chantiers.
- Temps non affecté à une tâche précise.

Permettre une répartition validée des temps communs sans double comptabilisation.

Créer une vue hebdomadaire par salarié et par chantier.

Permettre l'export CSV ou PDF des relevés.

Les règles de qualification du temps de travail, notamment les trajets et déplacements BTP, doivent être paramétrées et validées selon le régime applicable. Ne pas transformer directement les heures de tâches en bulletin de paie.

## 7. COÛT RÉEL DE MAIN-D'ŒUVRE

Calculer la consommation de main-d'œuvre en heures-homme.

Formule fondamentale :

Heures-homme = somme des durées productives réellement affectées de chaque salarié.

Coût de main-d'œuvre = somme, pour chaque salarié, de ses heures imputées multipliées par son coût horaire applicable à la période.

Réutiliser les données de coûts salariés déjà présentes dans Devisia.

Prévoir un coût horaire employeur paramétrable et historisé, tenant compte des éléments pertinents :

- Rémunération brute.
- Cotisations patronales.
- Coûts employeur supplémentaires.
- Éventuelles majorations ou indemnités imputables.
- Hypothèses de durée annuelle productive pour les coûts internes de gestion.

Ne pas présenter un simple salaire net ou brut divisé par 151,67 comme le coût complet réel d'une heure productive.

Conserver un coût historique par session ou écriture, compatible avec le mécanisme existant `hourly_cost_cents_snapshot`.

Les salariés ne doivent pas pouvoir consulter les coûts salariaux individuels des autres salariés.

## 8. RENTABILITÉ PAR TÂCHE

Pour chaque tâche, afficher :

- Prix de vente HT attribué.
- Budget de coûts prévu.
- Heures-homme prévues.
- Heures-homme réalisées.
- Coût de main-d'œuvre prévu.
- Coût de main-d'œuvre réel.
- Coût matériaux prévu.
- Coût matériaux réellement consommés.
- Autres coûts affectés.
- Coût total réel à date.
- Marge prévue.
- Marge actuelle sur coûts enregistrés.
- Marge finale projetée lorsque l'avancement est suffisamment fiable.
- Écart par rapport au budget.

Attention : ne pas déclarer une tâche rentable uniquement parce que les dépenses enregistrées sont faibles alors que la tâche est encore inachevée.

Afficher distinctement :

- Coûts réels constatés à date.
- Reste à faire estimé.
- Coût final prévisionnel.
- Marge finale prévisionnelle.

Ne pas mélanger prix de vente et coûts de main-d'œuvre, ni confondre la marge de contribution avec le résultat net.

### Exemple de référence

Tâche vendue : 1 000 € HT.

Matériaux : 300 €.

Autres coûts : 50 €.

Coût de main-d'œuvre : 35 €/heure-homme.

Scénario A : 1 salarié pendant 1 heure.
Coût main-d'œuvre : 35 €.
Marge sur les coûts indiqués : 615 €.

Scénario B : 6 salariés pendant 1 heure.
Coût main-d'œuvre : 210 €.
Marge sur les coûts indiqués : 440 €.

Scénario C : 2 salariés, 7 heures par jour, pendant 3 jours.
Temps consommé : 42 heures-homme.
Coût main-d'œuvre : 1 470 €.
Marge sur les coûts indiqués : -820 €.

Ces données sont fictives et doivent servir aux tests.

## 9. ALERTES INTELLIGENTES

Créer des alertes lorsqu'une tâche :

- Dépasse 75 % du budget d'heures.
- Atteint 100 % du budget.
- Dépasse le budget.
- Prend plus de temps que prévu.
- Consomme trop de matériaux.
- Risque de devenir déficitaire.

Seuils paramétrables par entreprise.

Les alertes doivent tenir compte du pourcentage réel d'avancement : une tâche consommant 75 % des heures prévues alors qu'elle est seulement réalisée à 30 % est potentiellement préoccupante.

Afficher des suggestions de correction, sans les appliquer automatiquement.

Ne pas utiliser ces alertes pour produire des classements individuels simplistes de performance des salariés.

## 10. INTÉGRATION AU CALENDRIER

Chaque tâche doit pouvoir être visualisée dans le calendrier et le Gantt des chantiers.

Prévoir :

- Durée prévue et réelle.
- Début et fin réels.
- Retard éventuel.
- Équipe affectée.
- Temps de travail cumulé.
- Avancement.
- Statut de réalisation.

Toute tâche doit rester déplaçable et modifiable.

Une modification du calendrier ne doit pas réécrire les horaires historiques déjà réellement effectués.

Lorsque la durée prévue change, proposer une mise à jour du planning à venir sans la rendre automatique.

## 11. INTÉGRATION AUX FACTURES ET MATÉRIAUX

Associer les consommations de matériaux à une tâche lorsque cette affectation est connue.

Exemple :

La facture fournisseur contient 100 agglos.

40 sont destinés au chantier A.

Parmi ces 40, 25 sont réellement utilisés pour la tâche « Élévation des murs ».

Seule la consommation correctement affectée doit entrer dans les coûts consommés de cette tâche.

Les 15 autres peuvent rester disponibles pour les autres tâches du chantier.

Permettre de corriger ces affectations sans créer de double dépense.

## 12. AMÉLIORATION DES FUTURS DEVIS PAR L'IA

Créer un historique exploitable des tâches réellement terminées.

Enregistrer notamment :

- Métier.
- Nature de la tâche.
- Quantité exécutée.
- Unité.
- Conditions connues.
- Nombre de salariés.
- Heures-homme consommées.
- Coûts réels.
- Période.
- Chantier source.

À partir des tâches comparables, calculer des références de productivité.

Exemples :

- Heures-homme par m² de placo.
- Heures-homme par m² de mur.
- Heures-homme par m³ de béton.
- Heures-homme par m² de carrelage.

Tenir compte des différences techniques et des effectifs.

Proposer des améliorations des futurs devis lorsque les données historiques sont suffisantes.

Toujours présenter :

- Échantillon utilisé.
- Valeurs historiques.
- Éventuelle dispersion.
- Niveau de confiance.
- Hypothèses.

Ne jamais réviser automatiquement un devis signé.

## 13. TABLEAUX DE BORD

Créer trois vues.

### Vue salarié

- Mes tâches.
- Ma tâche en cours.
- Démarrer / Pause / Terminer.
- Mes heures de la journée.
- Historique de la semaine.

### Vue chef de chantier

- Tâches à effectuer.
- Tâches en cours.
- Tâches terminées.
- Effectifs présents par tâche.
- Heures prévues et réalisées.
- Retards.
- Possibilité de corriger les pointages autorisés.

### Vue direction

- Rentabilité par tâche.
- Rentabilité par chantier.
- Heures consommées par poste.
- Écarts budgétaires.
- Alertes.
- Prévision du coût final.
- Historique des performances de production.

Prévoir une séparation stricte des informations visibles selon les rôles.

## 14. MODÈLE DE DONNÉES

Étudier l'ajout de structures du type :

- `job_tasks`
- `job_task_dependencies`
- `job_task_assignments`
- `work_sessions`
- `work_session_breaks`
- `task_cost_allocations`
- `task_progress_history`
- `task_audit_events`

Ce sont des propositions, pas des noms à imposer si des modèles équivalents existent déjà.

Relier les tâches aux chantiers, aux postes des devis, aux salariés, aux consommations de matériaux et au planning.

Adapter `time_entries` sans perdre les données existantes.

Assurer une comptabilisation unique des heures : si les sessions de travail alimentent les écritures existantes, elles ne doivent pas être additionnées une deuxième fois dans la rentabilité.

Conserver toutes les règles existantes de cloisonnement par organisation, permissions Supabase RLS et snapshots financiers.

Prévoir des migrations compatibles avec les anciennes données.

## 15. CONFORMITÉ ET CONFIDENTIALITÉ

Les heures enregistrées constituent des données concernant les salariés.

Prévoir :

- Information des salariés.
- Contrôle d'accès par rôle.
- Durées de conservation documentées.
- Historique des corrections.
- Séparation des données RH et financières sensibles.
- Export des données nécessaires aux relevés du temps de travail.
- Contrôles des durées quotidiennes et hebdomadaires pertinentes.
- Aucune photographie systématique ou géolocalisation permanente pour le pointage.

Les obligations légales dépendent de l'organisation du temps de travail et du régime applicable : prévoir une validation RH et juridique avant usage comme système officiel de décompte du temps.

## 16. TESTS OBLIGATOIRES

Tester au minimum :

- Une tâche avec un salarié.
- Une tâche avec six salariés.
- Une tâche sur plusieurs jours.
- Deux salariés commençant à des heures différentes.
- Une tâche interrompue puis reprise.
- Un salarié changeant de tâche dans une journée.
- Une session oubliée puis corrigée.
- Deux sessions qui se chevauchent.
- Une saisie manuelle rétroactive.
- Une modification du taux horaire ultérieure.
- Une répartition de matériaux entre plusieurs tâches.
- Une tâche réalisée partiellement.
- Une tâche dépassant son budget de main-d'œuvre.
- Une tâche déficitaire.
- Une correction de pointage après validation.
- Une journée entière comprenant du temps non affecté.
- Une migration avec des heures historiques existantes.
- Le respect des droits salariés, chefs de chantier et administrateurs.

Vérifier que les chiffres présentés dans les tableaux de bord sont cohérents avec les données de base.

## 17. LIVRAISON

Développer effectivement le module, avec priorité au parcours :

Devis accepté → Liste des tâches → Affectation → Pointage → Clôture de tâche → Analyse des coûts.

Produire :

1. Le code fonctionnel.
2. Les migrations documentées.
3. Les tests.
4. Les interfaces mobile et ordinateur.
5. Le tableau de bord de rentabilité par tâche.
6. Le rapport d'intégration aux modules précédents.
7. Les Pull Requests prêtes à être vérifiées.

Ne pas déployer ni fusionner sans mon accord.

**Consigne fondamentale : chaque tâche doit pouvoir être modifiée, suivie et analysée. L'IA aide à prévoir, à comprendre les dépassements et à améliorer les futurs chiffrages, mais les décisions restent entre les mains de l'entrepreneur.**

Commence par auditer le suivi des heures et les fonctions de rentabilité déjà présentes, puis implémente ce module de façon progressive, sans régression ni duplication des coûts.
