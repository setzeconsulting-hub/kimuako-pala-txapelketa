-- Table des demandes de report (changement de créneau)
CREATE TABLE IF NOT EXISTS demandes_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partie_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  nouveau_jour TEXT,
  nouveau_heure TEXT,
  email_demandeur TEXT NOT NULL,
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS : public peut INSÉRER (pour soumettre), admin gère tout
ALTER TABLE demandes_report ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_demandes" ON demandes_report;
CREATE POLICY "public_insert_demandes" ON demandes_report
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_demandes" ON demandes_report;
CREATE POLICY "auth_all_demandes" ON demandes_report
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
