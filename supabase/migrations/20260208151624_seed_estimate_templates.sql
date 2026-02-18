/*
  # Seed Estimate Templates BTP
  
  ## Description
  Insertion des templates de devis BTP standards pour structurer automatiquement
  les devis selon les types de projets de construction.
  
  ## Templates Créés
  1. Rénovation intérieure complète
  2. Construction neuve maison individuelle  
  3. Extension de maison
  4. Rénovation de toiture
  5. Aménagement de combles
  6. Rénovation de salle de bain
  7. Rénovation de cuisine
  8. Ravalement de façade
  9. Création terrasse/patio
  10. Installation piscine
  
  ## Notes
  - Tous les templates sont actifs par défaut
  - Structure JSON avec lots, postes et 3 gammes (entrée/standard/premium)
  - Templates réutilisables et modifiables par les admins
*/

-- Template 1: Rénovation intérieure complète
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'renovation-interieure-complete',
  'Rénovation Intérieure Complète',
  'Rénovation',
  '[
    {
      "name": "Démolition et Préparation",
      "postes": [
        {"name": "Démolition cloisons", "description": "Démolition des cloisons existantes", "gamme_entree": "Démolition manuelle", "gamme_standard": "Démolition avec évacuation", "gamme_premium": "Démolition complète avec tri des déchets"},
        {"name": "Préparation sols", "description": "Nettoyage et préparation des sols", "gamme_entree": "Nettoyage basique", "gamme_standard": "Ragréage et nivellement", "gamme_premium": "Ragréage fibré haute résistance"}
      ]
    },
    {
      "name": "Électricité",
      "postes": [
        {"name": "Mise aux normes", "description": "Mise aux normes électriques", "gamme_entree": "Normes de base", "gamme_standard": "Normes NF C 15-100", "gamme_premium": "Normes + domotique"},
        {"name": "Tableaux électriques", "description": "Installation tableaux", "gamme_entree": "Tableau standard", "gamme_standard": "Tableau avec protection différentielle", "gamme_premium": "Tableau connecté"}
      ]
    },
    {
      "name": "Plomberie",
      "postes": [
        {"name": "Réseau eau", "description": "Réfection réseau eau", "gamme_entree": "Tuyaux PVC", "gamme_standard": "Tuyaux multicouche", "gamme_premium": "Tuyaux cuivre avec isolation"},
        {"name": "Sanitaires", "description": "Installation sanitaires", "gamme_entree": "Sanitaires standard", "gamme_standard": "Sanitaires de marque", "gamme_premium": "Sanitaires haut de gamme"}
      ]
    },
    {
      "name": "Isolation et Cloisons",
      "postes": [
        {"name": "Isolation thermique", "description": "Isolation des murs", "gamme_entree": "Laine de verre 100mm", "gamme_standard": "Laine de roche 120mm", "gamme_premium": "Isolant biosourcé 140mm"},
        {"name": "Cloisons", "description": "Montage cloisons", "gamme_entree": "BA13 simple", "gamme_standard": "BA13 hydrofuge", "gamme_premium": "BA13 phonique haute performance"}
      ]
    },
    {
      "name": "Sols et Revêtements",
      "postes": [
        {"name": "Revêtements sols", "description": "Pose revêtements", "gamme_entree": "Lino ou stratifié", "gamme_standard": "Parquet flottant", "gamme_premium": "Parquet massif"},
        {"name": "Carrelage", "description": "Pose carrelage", "gamme_entree": "Carrelage standard", "gamme_standard": "Carrelage grès cérame", "gamme_premium": "Carrelage grand format"}
      ]
    },
    {
      "name": "Peinture et Finitions",
      "postes": [
        {"name": "Peinture murs", "description": "Peinture des murs", "gamme_entree": "2 couches standard", "gamme_standard": "2 couches qualité", "gamme_premium": "Peinture décorative"},
        {"name": "Menuiseries", "description": "Portes et plinthes", "gamme_entree": "Portes isoplane", "gamme_standard": "Portes postformées", "gamme_premium": "Portes bois massif"}
      ]
    }
  ]'::jsonb,
  true,
  1
) ON CONFLICT (template_id) DO NOTHING;

-- Template 2: Construction neuve
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'construction-neuve-maison',
  'Construction Neuve Maison Individuelle',
  'Construction',
  '[
    {
      "name": "Terrassement et Fondations",
      "postes": [
        {"name": "Terrassement", "description": "Décapage et terrassement", "gamme_entree": "Terrassement standard", "gamme_standard": "Terrassement avec étude de sol", "gamme_premium": "Terrassement + stabilisation terrain"},
        {"name": "Fondations", "description": "Fondations béton", "gamme_entree": "Semelles filantes", "gamme_standard": "Semelles + drainage", "gamme_premium": "Radier béton armé"}
      ]
    },
    {
      "name": "Gros Œuvre",
      "postes": [
        {"name": "Murs porteurs", "description": "Élévation murs", "gamme_entree": "Parpaings traditionnels", "gamme_standard": "Brique mono-mur", "gamme_premium": "Brique + ITE"},
        {"name": "Planchers", "description": "Planchers béton", "gamme_entree": "Hourdis polystyrène", "gamme_standard": "Poutrelles + entrevous", "gamme_premium": "Plancher chauffant intégré"}
      ]
    },
    {
      "name": "Charpente et Couverture",
      "postes": [
        {"name": "Charpente", "description": "Charpente toiture", "gamme_entree": "Fermettes industrielles", "gamme_standard": "Charpente traditionnelle", "gamme_premium": "Charpente en bois lamellé-collé"},
        {"name": "Couverture", "description": "Toiture", "gamme_entree": "Tuiles béton", "gamme_standard": "Tuiles terre cuite", "gamme_premium": "Ardoises naturelles"}
      ]
    },
    {
      "name": "Menuiseries Extérieures",
      "postes": [
        {"name": "Fenêtres", "description": "Fenêtres", "gamme_entree": "PVC blanc", "gamme_standard": "PVC couleur double vitrage", "gamme_premium": "Alu triple vitrage"},
        {"name": "Porte entrée", "description": "Porte d entrée", "gamme_entree": "Porte PVC", "gamme_standard": "Porte alu", "gamme_premium": "Porte bois massif sécurisée"}
      ]
    },
    {
      "name": "Isolation",
      "postes": [
        {"name": "Isolation combles", "description": "Isolation toiture", "gamme_entree": "Laine de verre 200mm", "gamme_standard": "Laine de roche 300mm", "gamme_premium": "Isolant biosourcé 400mm"},
        {"name": "Isolation murs", "description": "Isolation périphérique", "gamme_entree": "ITI 100mm", "gamme_standard": "ITI + VMC", "gamme_premium": "ITE + VMC double flux"}
      ]
    },
    {
      "name": "Second Œuvre",
      "postes": [
        {"name": "Plomberie", "description": "Installation complète", "gamme_entree": "Installation standard", "gamme_standard": "Installation optimisée", "gamme_premium": "Installation + récupération eau pluie"},
        {"name": "Électricité", "description": "Installation électrique", "gamme_entree": "Installation de base", "gamme_standard": "Installation NF + domotique basique", "gamme_premium": "Installation connectée complète"},
        {"name": "Chauffage", "description": "Système de chauffage", "gamme_entree": "Radiateurs électriques", "gamme_standard": "Pompe à chaleur air-eau", "gamme_premium": "PAC géothermique + plancher chauffant"}
      ]
    }
  ]'::jsonb,
  true,
  2
) ON CONFLICT (template_id) DO NOTHING;

-- Template 3: Extension de maison
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'extension-maison',
  'Extension de Maison',
  'Extension',
  '[
    {
      "name": "Fondations et Structure",
      "postes": [
        {"name": "Fondations extension", "description": "Fondations de l extension", "gamme_entree": "Semelles simples", "gamme_standard": "Semelles + liaison existant", "gamme_premium": "Micro-pieux si nécessaire"},
        {"name": "Structure", "description": "Ossature extension", "gamme_entree": "Ossature bois", "gamme_standard": "Ossature bois + ITE", "gamme_premium": "Structure mixte béton/bois"}
      ]
    },
    {
      "name": "Toiture Extension",
      "postes": [
        {"name": "Charpente", "description": "Charpente extension", "gamme_entree": "Charpente simple pente", "gamme_standard": "Charpente 2 pentes", "gamme_premium": "Charpente + fenêtres de toit"},
        {"name": "Couverture", "description": "Toiture extension", "gamme_entree": "Tuiles assorties", "gamme_standard": "Tuiles + isolation renforcée", "gamme_premium": "Toiture végétalisée"}
      ]
    },
    {
      "name": "Liaison Existant",
      "postes": [
        {"name": "Ouverture mur porteur", "description": "Création ouverture", "gamme_entree": "Ouverture avec IPN", "gamme_standard": "Ouverture avec poutre renforcée", "gamme_premium": "Ouverture baie XXL"},
        {"name": "Raccordements", "description": "Raccords électricité/plomberie", "gamme_entree": "Raccordements basiques", "gamme_standard": "Raccordements optimisés", "gamme_premium": "Raccordements + régulation zone"}
      ]
    },
    {
      "name": "Aménagement Intérieur",
      "postes": [
        {"name": "Cloisons", "description": "Cloisons intérieures", "gamme_entree": "BA13 standard", "gamme_standard": "BA13 + isolation phonique", "gamme_premium": "Cloisons vitrées + BA13"},
        {"name": "Revêtements", "description": "Sols et murs", "gamme_entree": "Carrelage + peinture", "gamme_standard": "Parquet + peinture qualité", "gamme_premium": "Matériaux nobles"}
      ]
    }
  ]'::jsonb,
  true,
  3
) ON CONFLICT (template_id) DO NOTHING;

-- Template 4: Rénovation toiture
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'renovation-toiture',
  'Rénovation de Toiture',
  'Toiture',
  '[
    {
      "name": "Dépose Existant",
      "postes": [
        {"name": "Dépose couverture", "description": "Retrait ancienne couverture", "gamme_entree": "Dépose simple", "gamme_standard": "Dépose + évacuation", "gamme_premium": "Dépose + tri recyclage"},
        {"name": "Vérification charpente", "description": "Contrôle et traitement", "gamme_entree": "Contrôle visuel", "gamme_standard": "Contrôle + traitement préventif", "gamme_premium": "Contrôle + traitement curatif complet"}
      ]
    },
    {
      "name": "Isolation Toiture",
      "postes": [
        {"name": "Isolation sous-toiture", "description": "Isolation combles", "gamme_entree": "Laine de verre 200mm", "gamme_standard": "Laine de roche 300mm + écran", "gamme_premium": "Isolant biosourcé 400mm + pare-vapeur"},
        {"name": "Ventilation", "description": "Système de ventilation", "gamme_entree": "Chatières simples", "gamme_standard": "VMC + chatières", "gamme_premium": "VMC hygro + entrées air"}
      ]
    },
    {
      "name": "Nouvelle Couverture",
      "postes": [
        {"name": "Couverture", "description": "Pose nouvelle couverture", "gamme_entree": "Tuiles béton", "gamme_standard": "Tuiles terre cuite", "gamme_premium": "Ardoises ou zinc"},
        {"name": "Zinguerie", "description": "Gouttières et descentes", "gamme_entree": "PVC", "gamme_standard": "Alu laqué", "gamme_premium": "Zinc ou cuivre"}
      ]
    }
  ]'::jsonb,
  true,
  4
) ON CONFLICT (template_id) DO NOTHING;

-- Template 5: Aménagement combles
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'amenagement-combles',
  'Aménagement de Combles',
  'Aménagement',
  '[
    {
      "name": "Structure et Plancher",
      "postes": [
        {"name": "Renforcement plancher", "description": "Renfort structure", "gamme_entree": "Solives renforcées", "gamme_standard": "Plancher OSB", "gamme_premium": "Plancher bois massif"},
        {"name": "Escalier accès", "description": "Escalier vers combles", "gamme_entree": "Escalier escamotable", "gamme_standard": "Escalier droit bois", "gamme_premium": "Escalier design sur-mesure"}
      ]
    },
    {
      "name": "Isolation Combles",
      "postes": [
        {"name": "Isolation rampants", "description": "Isolation sous-toiture", "gamme_entree": "Laine de verre 200mm", "gamme_standard": "Laine de roche 300mm", "gamme_premium": "Isolant mince multicouche"},
        {"name": "Pare-vapeur", "description": "Étanchéité à l air", "gamme_entree": "Film standard", "gamme_standard": "Membrane hygrovariable", "gamme_premium": "Membrane haute performance"}
      ]
    },
    {
      "name": "Aménagement Intérieur",
      "postes": [
        {"name": "Cloisons et plafonds", "description": "Habillage intérieur", "gamme_entree": "BA13 standard", "gamme_standard": "BA13 + rangements", "gamme_premium": "BA13 + dressing sur-mesure"},
        {"name": "Fenêtres de toit", "description": "Création ouvertures", "gamme_entree": "1 Velux standard", "gamme_standard": "2-3 Velux double vitrage", "gamme_premium": "Velux + verrière"}
      ]
    },
    {
      "name": "Électricité et Chauffage",
      "postes": [
        {"name": "Installation électrique", "description": "Circuit combles", "gamme_entree": "Installation basique", "gamme_standard": "Installation complète", "gamme_premium": "Installation domotique"},
        {"name": "Chauffage", "description": "Système de chauffage", "gamme_entree": "Radiateurs électriques", "gamme_standard": "Radiateurs + régulation", "gamme_premium": "Plancher chauffant"}
      ]
    }
  ]'::jsonb,
  true,
  5
) ON CONFLICT (template_id) DO NOTHING;

-- Template 6: Salle de bain
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'renovation-salle-de-bain',
  'Rénovation Salle de Bain',
  'Second Œuvre',
  '[
    {
      "name": "Démolition",
      "postes": [
        {"name": "Dépose existant", "description": "Retrait équipements", "gamme_entree": "Dépose simple", "gamme_standard": "Dépose + évacuation", "gamme_premium": "Dépose soignée + recyclage"}
      ]
    },
    {
      "name": "Plomberie",
      "postes": [
        {"name": "Réseau eau", "description": "Réfection plomberie", "gamme_entree": "PVC basique", "gamme_standard": "Multicouche + robinetterie", "gamme_premium": "Cuivre + robinetterie design"},
        {"name": "Évacuations", "description": "Système évacuation", "gamme_entree": "PVC standard", "gamme_standard": "PVC insonorisé", "gamme_premium": "Siphons de sol invisibles"}
      ]
    },
    {
      "name": "Électricité",
      "postes": [
        {"name": "Installation électrique", "description": "Prises et éclairages", "gamme_entree": "Installation conforme", "gamme_standard": "Installation + spots", "gamme_premium": "Installation + miroir LED + domotique"}
      ]
    },
    {
      "name": "Revêtements",
      "postes": [
        {"name": "Carrelage", "description": "Sols et murs", "gamme_entree": "Carrelage standard", "gamme_standard": "Grès cérame imitation", "gamme_premium": "Carrelage grand format + mosaïque"},
        {"name": "Étanchéité", "description": "Protection zones humides", "gamme_entree": "Étanchéité basique", "gamme_standard": "Sous-couche + joints", "gamme_premium": "Système étanchéité complet"}
      ]
    },
    {
      "name": "Équipements",
      "postes": [
        {"name": "Sanitaires", "description": "WC, lavabo, douche/baignoire", "gamme_entree": "Sanitaires standard", "gamme_standard": "Sanitaires de marque", "gamme_premium": "Sanitaires design haut de gamme"},
        {"name": "Meubles", "description": "Meuble vasque et rangements", "gamme_entree": "Meuble simple", "gamme_standard": "Meuble double vasque", "gamme_premium": "Meuble sur-mesure"}
      ]
    }
  ]'::jsonb,
  true,
  6
) ON CONFLICT (template_id) DO NOTHING;

-- Template 7: Cuisine
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'renovation-cuisine',
  'Rénovation de Cuisine',
  'Second Œuvre',
  '[
    {
      "name": "Démolition et Préparation",
      "postes": [
        {"name": "Dépose cuisine existante", "description": "Retrait meubles et équipements", "gamme_entree": "Dépose standard", "gamme_standard": "Dépose + évacuation", "gamme_premium": "Dépose + protection totale"}
      ]
    },
    {
      "name": "Plomberie",
      "postes": [
        {"name": "Arrivées eau", "description": "Eau chaude/froide", "gamme_entree": "Installation basique", "gamme_standard": "Installation + robinet filtrant", "gamme_premium": "Installation + osmoseur"},
        {"name": "Évacuations", "description": "Evier et lave-vaisselle", "gamme_entree": "Évacuation simple", "gamme_standard": "Évacuation + siphon", "gamme_premium": "Évacuation + broyeur"}
      ]
    },
    {
      "name": "Électricité",
      "postes": [
        {"name": "Prises électriques", "description": "Circuit cuisine", "gamme_entree": "Prises standard", "gamme_standard": "Prises + circuit plaque", "gamme_premium": "Installation complète + domotique"},
        {"name": "Éclairage", "description": "Spots et lumières", "gamme_entree": "Éclairage basique", "gamme_standard": "Spots LED encastrés", "gamme_premium": "Éclairage scénarios"}
      ]
    },
    {
      "name": "Revêtements",
      "postes": [
        {"name": "Sol", "description": "Revêtement de sol", "gamme_entree": "Lino", "gamme_standard": "Carrelage", "gamme_premium": "Carrelage XXL ou parquet"},
        {"name": "Crédence", "description": "Protection mur", "gamme_entree": "Carrelage simple", "gamme_standard": "Carrelage métro", "gamme_premium": "Verre ou inox"}
      ]
    },
    {
      "name": "Meubles et Équipements",
      "postes": [
        {"name": "Meubles cuisine", "description": "Meubles bas et hauts", "gamme_entree": "Meubles en kit", "gamme_standard": "Cuisine de marque", "gamme_premium": "Cuisine sur-mesure"},
        {"name": "Plan de travail", "description": "Plan de travail", "gamme_entree": "Stratifié", "gamme_standard": "Quartz ou granit", "gamme_premium": "Céramique ou marbre"},
        {"name": "Électroménager", "description": "Équipements intégrés", "gamme_entree": "Équipement basique", "gamme_standard": "Équipement marque", "gamme_premium": "Équipement haut de gamme"}
      ]
    }
  ]'::jsonb,
  true,
  7
) ON CONFLICT (template_id) DO NOTHING;

-- Template 8: Ravalement façade
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'ravalement-facade',
  'Ravalement de Façade',
  'Façade',
  '[
    {
      "name": "Préparation",
      "postes": [
        {"name": "Échafaudage", "description": "Mise en place échafaudage", "gamme_entree": "Échafaudage standard", "gamme_standard": "Échafaudage + bâches", "gamme_premium": "Échafaudage complet + protections"},
        {"name": "Nettoyage façade", "description": "Nettoyage haute pression", "gamme_entree": "Nettoyage basique", "gamme_standard": "Hydrogommage", "gamme_premium": "Hydrogommage + traitement anti-mousse"}
      ]
    },
    {
      "name": "Réparations",
      "postes": [
        {"name": "Réparation fissures", "description": "Traitement fissures", "gamme_entree": "Rebouchage simple", "gamme_standard": "Pontage fissures", "gamme_premium": "Traitement structurel"},
        {"name": "Reprise maçonnerie", "description": "Réfection parties abîmées", "gamme_entree": "Réparations ponctuelles", "gamme_standard": "Réfection complète zones", "gamme_premium": "Reconstruction partielle"}
      ]
    },
    {
      "name": "Isolation Extérieure (ITE)",
      "postes": [
        {"name": "Isolation thermique", "description": "ITE complète", "gamme_entree": "Polystyrène 100mm", "gamme_standard": "Polystyrène graphité 120mm", "gamme_premium": "Laine de roche 140mm"}
      ]
    },
    {
      "name": "Finitions",
      "postes": [
        {"name": "Enduit façade", "description": "Revêtement final", "gamme_entree": "Enduit monocouche", "gamme_standard": "Enduit taloché", "gamme_premium": "Enduit décoratif ou pierre"},
        {"name": "Peinture", "description": "Peinture de façade", "gamme_entree": "Peinture standard", "gamme_standard": "Peinture haute qualité", "gamme_premium": "Peinture minérale respirante"}
      ]
    }
  ]'::jsonb,
  true,
  8
) ON CONFLICT (template_id) DO NOTHING;

-- Template 9: Terrasse
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'creation-terrasse',
  'Création Terrasse / Patio',
  'Extérieur',
  '[
    {
      "name": "Terrassement et Fondations",
      "postes": [
        {"name": "Terrassement", "description": "Décaissement terrain", "gamme_entree": "Terrassement manuel", "gamme_standard": "Terrassement mécanique", "gamme_premium": "Terrassement + drainage"},
        {"name": "Fondations", "description": "Dalle béton", "gamme_entree": "Hérisson + dalle béton", "gamme_standard": "Dalle armée", "gamme_premium": "Dalle sur plots béton"}
      ]
    },
    {
      "name": "Structure Terrasse",
      "postes": [
        {"name": "Structure", "description": "Ossature terrasse", "gamme_entree": "Plots PVC", "gamme_standard": "Structure bois traité", "gamme_premium": "Structure alu ou composite"},
        {"name": "Garde-corps", "description": "Sécurisation", "gamme_entree": "Garde-corps bois", "gamme_standard": "Garde-corps alu", "gamme_premium": "Garde-corps inox + verre"}
      ]
    },
    {
      "name": "Revêtement",
      "postes": [
        {"name": "Revêtement terrasse", "description": "Lames ou dalles", "gamme_entree": "Bois standard", "gamme_standard": "Bois exotique", "gamme_premium": "Composite ou pierre naturelle"},
        {"name": "Éclairage", "description": "Lumières extérieures", "gamme_entree": "Spots LED simples", "gamme_standard": "Éclairage encastré", "gamme_premium": "Éclairage scénarisé"}
      ]
    },
    {
      "name": "Aménagements",
      "postes": [
        {"name": "Pergola/Store", "description": "Protection soleil", "gamme_entree": "Parasol", "gamme_standard": "Pergola bois", "gamme_premium": "Pergola bioclimatique"},
        {"name": "Arrosage automatique", "description": "Système d arrosage", "gamme_entree": "Arrosage manuel", "gamme_standard": "Arrosage programmable", "gamme_premium": "Arrosage connecté"}
      ]
    }
  ]'::jsonb,
  true,
  9
) ON CONFLICT (template_id) DO NOTHING;

-- Template 10: Piscine
INSERT INTO estimate_templates (template_id, name, category, lots, is_active, sort_order)
VALUES (
  'installation-piscine',
  'Installation Piscine',
  'Extérieur',
  '[
    {
      "name": "Terrassement",
      "postes": [
        {"name": "Excavation", "description": "Creusement bassin", "gamme_entree": "Terrassement standard", "gamme_standard": "Terrassement + évacuation", "gamme_premium": "Terrassement + étude de sol"},
        {"name": "Fondations", "description": "Lit de pose", "gamme_entree": "Sable compacté", "gamme_standard": "Sable + géotextile", "gamme_premium": "Radier béton"}
      ]
    },
    {
      "name": "Bassin Piscine",
      "postes": [
        {"name": "Structure piscine", "description": "Coque ou maçonnerie", "gamme_entree": "Coque polyester", "gamme_standard": "Béton projeté", "gamme_premium": "Béton armé + carrelage"},
        {"name": "Revêtement", "description": "Liner ou carrelage", "gamme_entree": "Liner basique", "gamme_standard": "Liner armé", "gamme_premium": "Carrelage émaux"}
      ]
    },
    {
      "name": "Système Filtration",
      "postes": [
        {"name": "Filtration", "description": "Pompe et filtre", "gamme_entree": "Filtration sable", "gamme_standard": "Filtration à cartouche", "gamme_premium": "Filtration au sel + UV"},
        {"name": "Chauffage", "description": "Chauffage eau", "gamme_entree": "Sans chauffage", "gamme_standard": "Pompe à chaleur", "gamme_premium": "PAC + panneaux solaires"}
      ]
    },
    {
      "name": "Aménagements",
      "postes": [
        {"name": "Plage piscine", "description": "Terrasse tour de piscine", "gamme_entree": "Dalle béton", "gamme_standard": "Carrelage antidérapant", "gamme_premium": "Pierre naturelle ou bois"},
        {"name": "Sécurité", "description": "Dispositif sécurité", "gamme_entree": "Bâche", "gamme_standard": "Volet roulant", "gamme_premium": "Volet immergé + alarme"},
        {"name": "Local technique", "description": "Abri équipements", "gamme_entree": "Coffre extérieur", "gamme_standard": "Local enterré", "gamme_premium": "Local technique isolé"}
      ]
    }
  ]'::jsonb,
  true,
  10
) ON CONFLICT (template_id) DO NOTHING;