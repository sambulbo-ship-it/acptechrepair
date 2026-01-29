
# Plan d'Implémentation - Fonctionnalités Avancées

## Résumé des fonctionnalités demandées

1. **Upload et stockage des factures PDF** dans Supabase Storage pour les réparations externes
2. **Onglet "Vendu"** dans Location/Vente avec coordonnées client et factures jointes
3. **Assistant IA global** pour la maintenance/réparation hors machines spécifiques, avec historique partagé pour enrichir l'expertise collective
4. **API publique améliorée** permettant l'accès sans compte à la boutique du workspace "AC Repair" (code: 77B7436B, ID: `3687cfb3-6191-49a0-8484-d06bad99c3c1`)

---

## Phase 1 : Stockage des Factures PDF

### 1.1 Création du bucket Supabase Storage

Migration SQL pour créer le bucket de stockage :
```text
+-------------------+
|  repair-invoices  |
|    (bucket)       |
|  - public: false  |
|  - RLS policies   |
+-------------------+
```

Politiques RLS :
- Les membres du workspace peuvent uploader/voir les factures de leur workspace
- Les admins peuvent supprimer les factures

### 1.2 Modification de la table `rental_transactions`

Ajout de colonnes pour les factures de vente :
- `invoice_url` (text, nullable) - URL de la facture dans le storage

### 1.3 Composant d'Upload PDF

Nouveau composant `InvoiceUpload.tsx` avec :
- Sélection de fichier PDF (max 10MB)
- Upload vers Supabase Storage
- Affichage du statut et téléchargement

### 1.4 Hook `useInvoiceStorage.ts`

Fonctions :
- `uploadInvoice(file, transactionId)` - Upload et retourne l'URL
- `deleteInvoice(url)` - Suppression
- `getInvoiceUrl(path)` - URL publique temporaire

---

## Phase 2 : Onglet "Vendu" amélioré

### 2.1 Modification de `RentalSale.tsx`

Ajout d'un 4ème onglet "Vendu" dans les Tabs :

```text
+----------+----------+---------+--------+
| Dispo    | Locations| Ventes  | Vendu  |
+----------+----------+---------+--------+
                                    ^
                                    |
                            Nouvel onglet
```

L'onglet "Vendu" affichera :
- Machines vendues (status `completed`)
- Coordonnées complètes du client (nom, email, téléphone, société)
- Date de vente et prix
- Statut de garantie (active/expirée)
- Bouton pour télécharger/voir la facture jointe
- Bouton pour uploader une facture si manquante

### 2.2 Logique de transition

Quand une vente est finalisée :
- Le statut de la transaction passe à `completed`
- La machine reste dans la base mais n'apparaît plus dans le stock actif
- Accessible uniquement depuis l'onglet "Vendu"

---

## Phase 3 : Assistant IA Global avec Historique Partagé

### 3.1 Architecture

```text
+---------------------------+
|   AIAssistant.tsx         | <- Page existante (assistant lié au workspace)
+---------------------------+
            |
            v
+---------------------------+
|   ai-diagnostic (Edge)    | <- Fonction existante
+---------------------------+
            |
            v
+---------------------------+
|   diagnostic_entries      | <- Table existante (réparations anonymisées)
+---------------------------+
```

### 3.2 Enrichissement de l'historique

L'assistant actuel recherche déjà dans les réparations anonymisées. Pour permettre aux techniciens de partager leur expertise SANS passer par une machine du stock :

**Nouvelle page** : `src/pages/AIAssistant.tsx` (modification)
- Ajout d'un formulaire permettant de décrire un problème résolu sur un équipement NON enregistré
- Catégorie, marque, modèle (saisie libre)
- Description du problème
- Solution trouvée
- Ces informations sont enregistrées dans une nouvelle table `knowledge_entries`

### 3.3 Nouvelle table `knowledge_entries`

```text
knowledge_entries
├── id (uuid)
├── workspace_id (uuid)
├── user_id (uuid)
├── category (text)
├── brand (text)
├── model (text)
├── problem_description (text)
├── solution_description (text)
├── created_at (timestamp)
```

RLS : Les membres peuvent créer et voir les entrées de leur workspace.

### 3.4 Modification de la fonction Edge `ai-diagnostic`

Enrichir le contexte de l'IA avec :
1. Les `diagnostic_entries` (réparations sur machines du stock) - déjà fait
2. Les nouvelles `knowledge_entries` (expertise partagée manuellement)

L'IA pourra ainsi répondre avec des solutions issues de l'expérience collective des techniciens.

---

## Phase 4 : API Publique pour Clients Sans Compte

### 4.1 Modification de `public-catalog/index.ts`

**Problème actuel** : L'API requiert un `workspace_id` en paramètre.

**Solution** : Ajouter un paramètre `invite_code` comme alternative :
- `?invite_code=77B7436B` → Résout vers le workspace ID correspondant
- Plus pratique pour les intégrations externes

### 4.2 Comportement de l'API

L'API reste publique (verify_jwt = false) et :
- Ne requiert AUCUNE authentification
- Accepte `workspace_id` OU `invite_code` (au moins un requis)
- Retourne UNIQUEMENT les données publiques :
  - Nom, marque, modèle de la machine
  - Prix location (jour/semaine/mois) et vente
  - État (neuf/occasion)
  - Stock (en stock / rupture)
  - Contact du workspace
- N'expose JAMAIS : numéros de série, historique de réparations, notes internes

### 4.3 URLs d'intégration pour "animalcoat"

```text
Base URL : https://pnzovyrlqkxeajzuylgq.supabase.co/functions/v1/public-catalog

Paramètres :
- invite_code=77B7436B (ou workspace_id=3687cfb3-...)
- type=rental | sale | all (optionnel)
- category=microphone | light | etc (optionnel)
- limit=100 (optionnel)
- offset=0 (optionnel)

Exemple complet :
GET /public-catalog?invite_code=77B7436B&type=sale
```

### 4.4 Page Client `/catalog`

La page `ClientCatalog.tsx` fonctionne déjà sans authentification. Ajout du support pour le paramètre `invite_code` :
- `/catalog?workspace=ID` (actuel)
- `/catalog?invite_code=77B7436B` (nouveau)

---

## Fichiers à Créer/Modifier

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `src/hooks/useInvoiceStorage.ts` | Hook pour upload/gestion des factures PDF |
| Migration SQL | Bucket storage + table knowledge_entries + colonne invoice_url |

### Fichiers à modifier
| Fichier | Modifications |
|---------|---------------|
| `supabase/functions/public-catalog/index.ts` | Support invite_code, validation sécurité |
| `supabase/functions/ai-diagnostic/index.ts` | Inclure knowledge_entries dans le contexte |
| `src/pages/RentalSale.tsx` | Onglet "Vendu", upload facture |
| `src/pages/ClientCatalog.tsx` | Support invite_code |
| `src/pages/AIAssistant.tsx` | Formulaire d'ajout de connaissances |
| `src/components/ManualRepairEntry.tsx` | Upload facture vers Storage |

---

## Détails Techniques

### Migration SQL

```sql
-- 1. Bucket pour les factures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('repair-invoices', 'repair-invoices', false);

-- 2. Politiques RLS pour le bucket
CREATE POLICY "Members can upload invoices" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-invoices' AND
  EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND workspace_id::text = (storage.foldername(name))[1]
  )
);

-- 3. Table knowledge_entries
CREATE TABLE public.knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL,
  brand text,
  model text,
  problem_description text NOT NULL,
  solution_description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 4. Colonne invoice_url sur rental_transactions
ALTER TABLE rental_transactions 
ADD COLUMN IF NOT EXISTS invoice_url text;
```

### Sécurité

- Les factures sont stockées dans des dossiers par workspace : `{workspace_id}/{transaction_id}.pdf`
- L'accès aux factures requiert une authentification et une appartenance au workspace
- L'API publique ne retourne que des données explicitement publiques
- Le paramètre invite_code est résolu côté serveur, pas exposé aux clients

---

## Ordre d'Implémentation Recommandé

1. **Migration SQL** - Créer le bucket, la table et la colonne
2. **Hook useInvoiceStorage** - Logique d'upload/download
3. **Modification RentalSale.tsx** - Onglet "Vendu" + upload facture
4. **Modification ManualRepairEntry.tsx** - Upload facture réparations externes
5. **Modification public-catalog Edge Function** - Support invite_code
6. **Modification ClientCatalog.tsx** - Support invite_code
7. **Table knowledge_entries + modification ai-diagnostic** - Expertise partagée
8. **Modification AIAssistant.tsx** - Formulaire d'ajout de connaissances

