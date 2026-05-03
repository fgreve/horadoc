-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE clinic_id AS ENUM (
  'indisa',
  'clc',
  'santa_maria',
  'alemana'
);

CREATE TYPE alert_channel AS ENUM (
  'email',
  'push',
  'webhook'
);

CREATE TYPE alert_status AS ENUM (
  'active',
  'paused',
  'triggered',
  'expired'
);

CREATE TYPE scrape_status AS ENUM (
  'pending',
  'running',
  'success',
  'error'
);

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE clinics (
  id clinic_id PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT NOT NULL,
  booking_url TEXT NOT NULL,
  sedes JSONB DEFAULT '[]'::jsonb,
  scraping_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id clinic_id NOT NULL REFERENCES clinics(id),
  external_id TEXT,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  specialty_raw TEXT,
  sede TEXT,
  accepts_isapre JSONB DEFAULT '[]'::jsonb,
  consultation_price INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, external_id)
);

CREATE TABLE available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id clinic_id NOT NULL REFERENCES clinics(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  sede TEXT,
  is_telemedicine BOOLEAN DEFAULT false,
  raw_data JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_available BOOLEAN DEFAULT true,
  UNIQUE(doctor_id, date, start_time)
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  rut TEXT,
  phone TEXT,
  preferred_clinics clinic_id[] DEFAULT '{}',
  notification_email TEXT,
  webhook_url TEXT,
  timezone TEXT DEFAULT 'America/Santiago',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  doctor_name_query TEXT,
  specialty_id UUID REFERENCES specialties(id),
  clinic_ids clinic_id[] DEFAULT '{}',
  date_from DATE,
  date_to DATE,
  time_from TIME,
  time_to TIME,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  sede TEXT,
  include_telemedicine BOOLEAN DEFAULT true,
  channel alert_channel DEFAULT 'email',
  status alert_status DEFAULT 'active',
  times_triggered INTEGER DEFAULT 0,
  max_triggers INTEGER DEFAULT 10,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  slot_id UUID REFERENCES available_slots(id),
  channel alert_channel NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT false,
  error TEXT
);

CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id clinic_id NOT NULL REFERENCES clinics(id),
  status scrape_status DEFAULT 'pending',
  slots_found INTEGER DEFAULT 0,
  slots_new INTEGER DEFAULT 0,
  slots_removed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_slots_doctor ON available_slots(doctor_id);
CREATE INDEX idx_slots_date ON available_slots(date);
CREATE INDEX idx_slots_available ON available_slots(is_available, date);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_doctor ON alerts(doctor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_doctors_name_trgm ON doctors USING gin(name gin_trgm_ops);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts"
  ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read clinics" ON clinics FOR SELECT USING (true);
CREATE POLICY "Public read specialties" ON specialties FOR SELECT USING (true);
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public read slots" ON available_slots FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, notification_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION search_doctors(
  search_query TEXT DEFAULT NULL,
  filter_clinic clinic_id DEFAULT NULL,
  filter_specialty UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  clinic_id clinic_id,
  clinic_name TEXT,
  specialty TEXT,
  sede TEXT,
  next_available_date DATE,
  available_slots_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.clinic_id,
    c.name AS clinic_name,
    COALESCE(s.name, d.specialty_raw) AS specialty,
    d.sede,
    MIN(sl.date) AS next_available_date,
    COUNT(sl.id) FILTER (WHERE sl.is_available AND sl.date >= CURRENT_DATE) AS available_slots_count
  FROM doctors d
  JOIN clinics c ON c.id = d.clinic_id
  LEFT JOIN specialties s ON s.id = d.specialty_id
  LEFT JOIN available_slots sl ON sl.doctor_id = d.id AND sl.is_available AND sl.date >= CURRENT_DATE
  WHERE
    (search_query IS NULL OR d.name ILIKE '%' || search_query || '%')
    AND (filter_clinic IS NULL OR d.clinic_id = filter_clinic)
    AND (filter_specialty IS NULL OR d.specialty_id = filter_specialty)
  GROUP BY d.id, d.name, d.clinic_id, c.name, s.name, d.specialty_raw, d.sede
  ORDER BY available_slots_count DESC NULLS LAST, d.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION match_alerts_for_slot(slot_id UUID)
RETURNS TABLE (alert_id UUID, user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id AS alert_id, a.user_id
  FROM alerts a
  JOIN available_slots sl ON sl.id = slot_id
  JOIN doctors d ON d.id = sl.doctor_id
  WHERE
    a.status = 'active'
    AND a.times_triggered < a.max_triggers
    AND (a.doctor_id IS NULL OR a.doctor_id = sl.doctor_id)
    AND (a.doctor_name_query IS NULL OR d.name ILIKE '%' || a.doctor_name_query || '%')
    AND (a.specialty_id IS NULL OR d.specialty_id = a.specialty_id)
    AND (a.clinic_ids = '{}' OR sl.clinic_id = ANY(a.clinic_ids))
    AND (a.date_from IS NULL OR sl.date >= a.date_from)
    AND (a.date_to IS NULL OR sl.date <= a.date_to)
    AND (a.time_from IS NULL OR sl.start_time >= a.time_from)
    AND (a.time_to IS NULL OR sl.start_time <= a.time_to)
    AND (a.include_telemedicine OR NOT sl.is_telemedicine)
    AND (a.days_of_week = '{}' OR EXTRACT(DOW FROM sl.date)::INTEGER = ANY(a.days_of_week));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO clinics (id, name, short_name, website_url, booking_url, sedes) VALUES
  ('indisa', 'Clínica INDISA', 'Indisa', 'https://www.indisa.cl', 'https://www.indisa.cl/agenda',
    '[{"name":"Providencia","address":"Av. Santa María 1810"},{"name":"Maipú","address":"Av. Santa Elena 901"},{"name":"Los Conquistadores","address":"Los Conquistadores 1926"},{"name":"Los Españoles","address":"Los Españoles 1855"}]'::jsonb),
  ('clc', 'Clínica Las Condes', 'CLC', 'https://www.clinicalascondes.cl', 'https://www.clinicalascondes.cl/INFORMACION-AL-PACIENTE/reserva-de-hora',
    '[{"name":"Estoril","address":"Estoril 450, Las Condes"},{"name":"Chicureo","address":"Av. Chicureo, Piedra Roja"},{"name":"Peñalolén","address":"Los Presidentes 8950"}]'::jsonb),
  ('santa_maria', 'Clínica Santa María', 'Santa María', 'https://www.clinicasantamaria.cl', 'https://www.clinicasantamaria.cl/reserva-de-horas',
    '[{"name":"Providencia","address":"Av. Santa María 0500"},{"name":"La Dehesa","address":"Av. La Dehesa 1445"},{"name":"La Reina","address":"Av. Ossa 345"}]'::jsonb),
  ('alemana', 'Clínica Alemana', 'Alemana', 'https://www.clinicaalemana.cl', 'https://agenda.clinicaalemana.cl/',
    '[{"name":"Vitacura","address":"Av. Vitacura 5951"},{"name":"La Dehesa","address":"Av. José Alcalde Délano 12205"}]'::jsonb);

INSERT INTO specialties (name, slug, icon) VALUES
  ('Cardiología', 'cardiologia', 'heart-pulse'),
  ('Dermatología', 'dermatologia', 'scan-face'),
  ('Gastroenterología', 'gastroenterologia', 'stethoscope'),
  ('Ginecología', 'ginecologia', 'baby'),
  ('Medicina Interna', 'medicina-interna', 'activity'),
  ('Neurología', 'neurologia', 'brain'),
  ('Nutrición', 'nutricion', 'apple'),
  ('Oftalmología', 'oftalmologia', 'eye'),
  ('Otorrinolaringología', 'otorrino', 'ear'),
  ('Pediatría', 'pediatria', 'smile'),
  ('Psiquiatría', 'psiquiatria', 'brain-cog'),
  ('Traumatología', 'traumatologia', 'bone'),
  ('Urología', 'urologia', 'stethoscope'),
  ('Cirugía General', 'cirugia-general', 'scissors'),
  ('Medicina General', 'medicina-general', 'clipboard-plus'),
  ('Odontología', 'odontologia', 'smile-plus'),
  ('Kinesiología', 'kinesiologia', 'move');
