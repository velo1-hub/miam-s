-- Idya Auto — seed (brief §16, §22). Idempotent: safe to re-run.
--
-- Run after the migrations:  supabase db reset   (local)   or   psql "$DATABASE_URL" -f supabase/seed.sql
-- Demo vehicles are NOT seeded here: in production the inventory is entered through the admin
-- (DEMO_MODE=true serves demo/seed.json without a database, §28.1).

-- ---------------------------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------------------------
-- The first owner is created by hand once the person has signed in through Supabase Auth
-- (Authentication → Users → copy the id). Only owners can add more staff afterwards (RLS).
--
--   insert into staff (user_id, role, full_name)
--   values ('00000000-0000-0000-0000-000000000000', 'owner', '[CLIENT: nom du propriétaire]')
--   on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;

-- ---------------------------------------------------------------------------------------------
-- Settings — singleton row (id = 1), JSON generated from lib/settings/defaults.ts.
-- Every [CLIENT: …] value is a placeholder tracked in docs/client-todo.md. Existing settings are
-- never overwritten by a re-run (on conflict do nothing).
-- ---------------------------------------------------------------------------------------------
insert into settings (id, data)
values (1, '{
  "business": {
    "legalName": "[CLIENT: nom légal] Idya Auto",
    "displayName": "Idya Auto",
    "city": "[CLIENT: ville]",
    "addressLine1": "[CLIENT: adresse]",
    "postalCode": "[CLIENT: code postal]",
    "province": "Québec",
    "phone": "+15145550123",
    "email": "info@idya-auto.example",
    "leadsEmail": "ventes@idya-auto.example",
    "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Idya+Auto",
    "googleBusinessUrl": null,
    "socials": {},
    "lat": null,
    "lng": null
  },
  "hours": {
    "0": {
      "open": null,
      "close": null
    },
    "1": {
      "open": "09:00",
      "close": "20:00"
    },
    "2": {
      "open": "09:00",
      "close": "20:00"
    },
    "3": {
      "open": "09:00",
      "close": "20:00"
    },
    "4": {
      "open": "09:00",
      "close": "20:00"
    },
    "5": {
      "open": "09:00",
      "close": "18:00"
    },
    "6": {
      "open": "10:00",
      "close": "16:00"
    }
  },
  "closures": [
    {
      "day": "2026-12-25",
      "reason": "Noël"
    },
    {
      "day": "2026-12-26",
      "reason": "Lendemain de Noël"
    },
    {
      "day": "2027-01-01",
      "reason": "Jour de l''An"
    }
  ],
  "booking": {
    "slotMinutes": 30,
    "capacityPerSlot": 2,
    "minLeadHours": 2,
    "horizonDays": 21
  },
  "finance": {
    "defaultRatePct": 7.99,
    "terms": [
      36,
      48,
      60,
      72,
      84,
      96
    ],
    "defaultTerm": 72,
    "creditFees": [],
    "gstPct": 5,
    "qstPct": 9.975,
    "disclaimerFr": "Estimation à titre indicatif seulement, sous réserve de l''approbation du crédit. Le taux offert dépend de votre dossier.",
    "disclaimerEn": "Estimate for information purposes only, subject to credit approval. The rate offered depends on your file."
  },
  "warranty": {
    "A": {
      "fr": "Garantie légale de bon fonctionnement de catégorie A : 6 mois ou 10 000 km, selon la première éventualité.",
      "en": "Class A legal warranty of good working order: 6 months or 10,000 km, whichever comes first."
    },
    "B": {
      "fr": "Garantie légale de bon fonctionnement de catégorie B : 3 mois ou 5 000 km, selon la première éventualité.",
      "en": "Class B legal warranty of good working order: 3 months or 5,000 km, whichever comes first."
    },
    "C": {
      "fr": "Garantie légale de bon fonctionnement de catégorie C : 1 mois ou 1 700 km, selon la première éventualité.",
      "en": "Class C legal warranty of good working order: 1 month or 1,700 km, whichever comes first."
    },
    "D": {
      "fr": "Véhicule de catégorie D : aucune garantie légale de bon fonctionnement ne s''applique. La garantie légale générale de la Loi sur la protection du consommateur demeure.",
      "en": "Class D vehicle: no legal warranty of good working order applies. The general legal warranty of the Consumer Protection Act still applies."
    }
  },
  "privacyOfficer": {
    "name": "[CLIENT: responsable de la protection des renseignements personnels]",
    "title": "[CLIENT: titre]",
    "email": "confidentialite@idya-auto.example",
    "phone": null
  },
  "retention": {
    "leadsMonths": 24,
    "chatDays": 90
  },
  "assistant": {
    "name": "Assistant Idya",
    "enabled": true,
    "afterHoursNote": {
      "fr": "Notre équipe vous répondra dès la réouverture.",
      "en": "Our team will get back to you when we reopen."
    }
  },
  "featuredVehicleId": null,
  "hero": {
    "posterUrl": null,
    "posterMobileUrl": null,
    "av1Url": null,
    "h264Url": null,
    "mobileUrl": null
  },
  "whyUs": [
    {
      "key": "all_in_price",
      "enabled": true,
      "fr": {
        "title": "Prix tout inclus, sans surprise",
        "body": "Le prix affiché comprend tous les frais. Seules la TPS et la TVQ s''ajoutent."
      },
      "en": {
        "title": "All-in price, no surprises",
        "body": "The displayed price includes every fee. Only GST and QST are added."
      }
    },
    {
      "key": "inspection",
      "enabled": false,
      "fr": {
        "title": "[CLIENT: inspection]",
        "body": "[CLIENT: description de l''inspection]"
      },
      "en": {
        "title": "[CLIENT: inspection]",
        "body": "[CLIENT: inspection description]"
      }
    },
    {
      "key": "financing",
      "enabled": false,
      "fr": {
        "title": "[CLIENT: financement]",
        "body": "[CLIENT: promesse de financement à confirmer]"
      },
      "en": {
        "title": "[CLIENT: financing]",
        "body": "[CLIENT: financing claim to confirm]"
      }
    },
    {
      "key": "trade_in",
      "enabled": false,
      "fr": {
        "title": "[CLIENT: échange]",
        "body": "[CLIENT: délai d''évaluation à confirmer]"
      },
      "en": {
        "title": "[CLIENT: trade-in]",
        "body": "[CLIENT: valuation delay to confirm]"
      }
    }
  ]
}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- Knowledge base — the 8 FAQ entries of demo/seed.json (knowledgeBase), fixed ids so a re-run
-- updates the texts in place. Staff edit them from the admin afterwards.
-- ---------------------------------------------------------------------------------------------
insert into knowledge_base (id, active, question_fr, answer_fr, question_en, answer_en)
values
  -- kb01
  ('a0000000-0000-4000-8000-000000000001', true, 'Quels documents dois-je apporter pour un essai routier ?', 'Un permis de conduire valide suffit pour l''essai routier. Pour un achat, apportez aussi une preuve d''assurance et, si vous financez, une pièce d''identité avec photo et une preuve de revenu. [CLIENT: à valider]', 'What documents do I need for a test drive?', 'A valid driver''s licence is enough for the test drive. For a purchase, also bring proof of insurance and, if you finance, photo ID and proof of income. [CLIENT: to validate]'),
  -- kb02
  ('a0000000-0000-4000-8000-000000000002', true, 'Les prix affichés incluent-ils les frais ?', 'Oui. Chaque prix affiché est tout inclus : frais d''administration, de préparation et de livraison compris. Seules la TPS et la TVQ s''ajoutent.', 'Do the displayed prices include fees?', 'Yes. Every displayed price is all-in: administration, preparation and delivery fees included. Only GST and QST are added.'),
  -- kb03
  ('a0000000-0000-4000-8000-000000000003', true, 'Acceptez-vous les véhicules d''échange ?', 'Oui. Remplissez le formulaire « Évaluer mon échange » avec le NIV, le kilométrage et quelques photos, et un conseiller vous contacte avec une estimation. [CLIENT: délai d''évaluation]', 'Do you accept trade-ins?', 'Yes. Fill in the “Value my trade-in” form with the VIN, mileage and a few photos, and an advisor contacts you with an estimate. [CLIENT: valuation delay]'),
  -- kb04
  ('a0000000-0000-4000-8000-000000000004', true, 'Comment fonctionne la garantie légale sur un véhicule d''occasion ?', 'Au Québec, la Loi sur la protection du consommateur prévoit une garantie de bon fonctionnement selon l''âge et le kilométrage du véhicule : catégorie A (6 mois ou 10 000 km), B (3 mois ou 5 000 km), C (1 mois ou 1 700 km) ou D (aucune garantie de bon fonctionnement). La catégorie est indiquée sur chaque fiche de véhicule.', 'How does the legal warranty work on a used vehicle?', 'In Québec, the Consumer Protection Act provides a warranty of good working order based on the vehicle''s age and mileage: class A (6 months or 10,000 km), B (3 months or 5,000 km), C (1 month or 1,700 km) or D (no warranty of good working order). The class is shown on each vehicle page.'),
  -- kb05
  ('a0000000-0000-4000-8000-000000000005', true, 'Puis-je réserver un véhicule ?', 'Vous pouvez réserver un essai routier en ligne en deux minutes. Pour retenir un véhicule, contactez un conseiller : les modalités de dépôt vous seront expliquées. [CLIENT: politique de dépôt]', 'Can I reserve a vehicle?', 'You can book a test drive online in two minutes. To hold a vehicle, contact an advisor who will explain the deposit terms. [CLIENT: deposit policy]'),
  -- kb06
  ('a0000000-0000-4000-8000-000000000006', true, 'Offrez-vous du financement ?', 'Oui, nous travaillons avec plusieurs institutions financières. Le calculateur du site donne une estimation ; le taux final dépend de votre dossier et de l''approbation du crédit. Aucune décision de crédit n''est prise en ligne.', 'Do you offer financing?', 'Yes, we work with several financial institutions. The site''s calculator gives an estimate; the final rate depends on your file and credit approval. No credit decision is made online.'),
  -- kb07
  ('a0000000-0000-4000-8000-000000000007', true, 'Quel est le délai de livraison ?', '[CLIENT: délai de livraison habituel après la signature]', 'How long does delivery take?', '[CLIENT: usual delivery delay after signing]'),
  -- kb08
  ('a0000000-0000-4000-8000-000000000008', true, 'Les photos 360° sont-elles de vraies photos ?', 'Oui. Chaque véhicule est photographié sous 36 angles dans notre studio ; ce que vous voyez est le véhicule réel. Pendant la période de démonstration du site, certaines images sont des rendus de démonstration identifiés comme tels.', 'Are the 360° photos real photos?', 'Yes. Each vehicle is photographed from 36 angles in our studio; what you see is the actual vehicle. During the site''s demonstration period, some images are demo renders identified as such.')
on conflict (id) do update
  set active      = excluded.active,
      question_fr = excluded.question_fr,
      answer_fr   = excluded.answer_fr,
      question_en = excluded.question_en,
      answer_en   = excluded.answer_en,
      updated_at  = now();
