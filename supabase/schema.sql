-- ============================================
-- SCHEMA SQL - Kimuako Pala Txapelketa
-- À exécuter dans Supabase > SQL Editor
-- ============================================

-- Table des équipes inscrites
CREATE TABLE equipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  garcon TEXT NOT NULL,
  fille TEXT NOT NULL,
  email TEXT NOT NULL,
  serie TEXT NOT NULL CHECK (serie IN ('1ere', '2eme')),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
  paye BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des poules
CREATE TABLE poules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  serie TEXT NOT NULL CHECK (serie IN ('1ere', '2eme')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison équipes <-> poules
CREATE TABLE equipes_poules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  poule_id UUID NOT NULL REFERENCES poules(id) ON DELETE CASCADE,
  UNIQUE(equipe_id, poule_id)
);

-- Table des parties (matchs)
CREATE TABLE parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poule_id UUID NOT NULL REFERENCES poules(id) ON DELETE CASCADE,
  equipe1_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  equipe2_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  score1 INTEGER,
  score2 INTEGER,
  heure TEXT,
  terrain TEXT,
  jouee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poules ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_poules ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour toutes les tables
CREATE POLICY "Lecture publique equipes" ON equipes FOR SELECT USING (true);
CREATE POLICY "Lecture publique poules" ON poules FOR SELECT USING (true);
CREATE POLICY "Lecture publique equipes_poules" ON equipes_poules FOR SELECT USING (true);
CREATE POLICY "Lecture publique parties" ON parties FOR SELECT USING (true);

-- Insertion publique pour les inscriptions (tout le monde peut s'inscrire)
CREATE POLICY "Inscription publique" ON equipes FOR INSERT WITH CHECK (true);

-- Modifications admin uniquement (utilisateurs authentifiés)
CREATE POLICY "Admin update equipes" ON equipes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete equipes" ON equipes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert poules" ON poules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update poules" ON poules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete poules" ON poules FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert equipes_poules" ON equipes_poules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update equipes_poules" ON equipes_poules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete equipes_poules" ON equipes_poules FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert parties" ON parties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin update parties" ON parties FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin delete parties" ON parties FOR DELETE USING (auth.role() = 'authenticated');
