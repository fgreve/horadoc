# CLAUDE.md — HoraDoc: Monitor de Horas Médicas Chile

## Identidad del Proyecto

**HoraDoc** es una plataforma de monitoreo de disponibilidad de horas médicas en clínicas privadas de Santiago de Chile. Permite a los usuarios buscar horas por especialidad o médico, configurar alertas y recibir notificaciones en tiempo real cuando se libera una hora con un doctor específico.

**Repo**: `horadoc`
**Stack**: Next.js 15 (App Router) + Supabase + Vercel
**Lenguaje**: TypeScript estricto en todo el proyecto
**Dominio de negocio**: Salud / HealthTech / Chile

---

## INSTRUCCIONES CRÍTICAS PARA CLAUDE CODE

### Uso obligatorio de herramientas CLI, API y MCP

Claude Code DEBE utilizar las siguientes herramientas para configurar la infraestructura completa del proyecto. NO simular, NO dejar como "TODO", NO pedir al usuario que lo haga manualmente. Ejecutar cada paso directamente.

#### 1. GitHub — Crear repositorio

```bash
# Usar GitHub CLI (gh) para crear el repo
gh repo create horadoc --public --description "Monitor de horas médicas - Clínicas Chile" --clone
cd horadoc
git init
```

Si `gh` no está instalado o autenticado:
```bash
# Instalar gh CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
gh auth login
```

#### 2. Supabase — Crear proyecto via MCP o CLI

**Opción A — MCP (preferida):**
Usar las herramientas MCP de Supabase disponibles en el entorno:
- `Supabase:create_project` — Crear proyecto con nombre "horadoc", región "sa-east-1" (São Paulo, más cercana a Chile), plan free
- `Supabase:apply_migration` — Aplicar todas las migraciones SQL definidas más abajo
- `Supabase:deploy_edge_function` — Deploy de funciones de scraping
- `Supabase:get_project_url` — Obtener URL del proyecto para configurar env vars
- `Supabase:get_publishable_keys` — Obtener anon key y service role key

**Opción B — Supabase CLI (fallback):**
```bash
npx supabase init
npx supabase login
npx supabase projects create horadoc --region sa-east-1 --org-id <org_id>
npx supabase link --project-ref <project_ref>
npx supabase db push
npx supabase functions deploy
```

#### 3. Vercel — Crear y deployar proyecto

**Opción A — MCP (preferida):**
Usar las herramientas MCP de Vercel:
- `Vercel:deploy_to_vercel` — Deploy inicial
- `Vercel:get_project` — Verificar estado del proyecto
- `Vercel:list_deployments` — Verificar deployments

**Opción B — Vercel CLI (fallback):**
```bash
npm i -g vercel
vercel login
vercel --yes  # Deploy inicial con defaults
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### 4. Configuración de Environment Variables

Después de crear Supabase y Vercel, configurar TODAS las env vars:

```env
# .env.local (desarrollo)
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel (producción) — configurar via CLI o MCP
# Mismas variables arriba + cualquier API key de notificaciones
```

### Verificación de completitud

Antes de considerar el MVP terminado, Claude Code DEBE verificar:

- [ ] Repo existe en GitHub con código pusheado
- [ ] Proyecto Supabase creado con tablas y RLS aplicados
- [ ] Edge Functions deployadas en Supabase
- [ ] Proyecto Vercel creado y linkeado al repo de GitHub
- [ ] Deploy exitoso en Vercel (URL funcional)
- [ ] Auth flow funcional (registro + login)
- [ ] Búsqueda de médicos funcional
- [ ] Creación de alertas funcional
- [ ] Cron de scraping ejecutándose
- [ ] Notificaciones enviándose

---

## Arquitectura del MVP

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│            Next.js 15 (App Router)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Búsqueda │ │ Alertas  │ │ Dashboard / Historial│ │
│  │ médicos  │ │ config   │ │ notificaciones       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
└──────────────────┬──────────────────────────────────┘
                   │ Supabase Client SDK
┌──────────────────▼──────────────────────────────────┐
│                   SUPABASE                           │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐       │
│  │   Auth   │ │ Database │ │ Edge Functions │       │
│  │  (PKCE)  │ │ (Postgres)│ │  (Scraper +   │       │
│  │          │ │          │ │   Notifier)    │       │
│  └──────────┘ └──────────┘ └────────────────┘       │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Realtime │ │  Cron    │                          │
│  │(alertas) │ │(pg_cron) │                          │
│  └──────────┘ └──────────┘                          │
└─────────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│            CLÍNICAS (scraping targets)                │
│  Indisa │ CLC │ Santa María │ Alemana               │
└─────────────────────────────────────────────────────┘
```

---

## Schema de Base de Datos

Aplicar via `Supabase:apply_migration` o `supabase db push`:

```sql
-- Migration: 001_initial_schema.sql

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

-- Clínicas soportadas
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

-- Especialidades médicas (normalizadas entre clínicas)
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT, -- emoji o lucide icon name
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Médicos
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id clinic_id NOT NULL REFERENCES clinics(id),
  external_id TEXT, -- ID del médico en el sistema de la clínica
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES specialties(id),
  specialty_raw TEXT, -- nombre original de la clínica
  sede TEXT,
  accepts_isapre JSONB DEFAULT '[]'::jsonb,
  consultation_price INTEGER, -- en CLP
  metadata JSONB DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, external_id)
);

-- Horas disponibles (slots)
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

-- Perfiles de usuario (extiende auth.users)
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

-- Alertas configuradas por usuarios
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Criterios de búsqueda
  doctor_id UUID REFERENCES doctors(id),
  doctor_name_query TEXT, -- búsqueda fuzzy por nombre
  specialty_id UUID REFERENCES specialties(id),
  clinic_ids clinic_id[] DEFAULT '{}',
  -- Filtros
  date_from DATE,
  date_to DATE,
  time_from TIME,
  time_to TIME,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=dom, 6=sab
  sede TEXT,
  include_telemedicine BOOLEAN DEFAULT true,
  -- Config notificación
  channel alert_channel DEFAULT 'email',
  -- Estado
  status alert_status DEFAULT 'active',
  times_triggered INTEGER DEFAULT 0,
  max_triggers INTEGER DEFAULT 10, -- auto-pausa después de N
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de notificaciones enviadas
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

-- Log de ejecuciones del scraper
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
CREATE INDEX idx_doctors_name_trgm ON doctors USING gin(name gin_trgm_ops);
CREATE INDEX idx_slots_doctor ON available_slots(doctor_id);
CREATE INDEX idx_slots_date ON available_slots(date);
CREATE INDEX idx_slots_available ON available_slots(is_available, date);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_doctor ON alerts(doctor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Habilitar extensión para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios solo ven/editan su perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Alerts: usuarios solo ven/editan sus alertas
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts"
  ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE USING (auth.uid() = user_id);

-- Notifications: usuarios solo ven sus notificaciones
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Tablas públicas (lectura)
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

-- Trigger para crear perfil al registrarse
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

-- Función para buscar médicos con fuzzy search
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

-- Función para matchear alertas con nuevos slots
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
```

---

## Estructura de Archivos

```
horadoc/
├── CLAUDE.md                          # Este archivo
├── .env.local                         # Variables de entorno (git-ignored)
├── .env.example                       # Template de env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── scrape-clinic/
│       │   └── index.ts               # Edge function: scraper
│       └── process-alerts/
│           └── index.ts               # Edge function: matcher + notifier
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout con providers
│   │   ├── page.tsx                   # Landing / búsqueda principal
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Layout autenticado
│   │   │   ├── dashboard/page.tsx     # Resumen del usuario
│   │   │   ├── alerts/
│   │   │   │   ├── page.tsx           # Lista de alertas
│   │   │   │   └── new/page.tsx       # Crear nueva alerta
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx           # Historial de notificaciones
│   │   │   └── settings/
│   │   │       └── page.tsx           # Configuración de perfil
│   │   ├── search/
│   │   │   └── page.tsx               # Resultados de búsqueda
│   │   ├── doctor/
│   │   │   └── [id]/page.tsx          # Perfil de médico + slots
│   │   └── api/
│   │       ├── scrape/route.ts        # API route: trigger scraping
│   │       ├── cron/route.ts          # Vercel Cron handler
│   │       └── webhooks/
│   │           └── notify/route.ts    # Webhook saliente
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── search/
│   │   │   ├── SearchBar.tsx          # Barra de búsqueda principal
│   │   │   ├── SearchFilters.tsx      # Filtros (clínica, sede, fecha)
│   │   │   ├── DoctorCard.tsx         # Card de médico en resultados
│   │   │   └── SlotPicker.tsx         # Selector de horas disponibles
│   │   ├── alerts/
│   │   │   ├── AlertForm.tsx          # Formulario crear/editar alerta
│   │   │   ├── AlertCard.tsx          # Card de alerta en lista
│   │   │   └── AlertStatusBadge.tsx
│   │   ├── notifications/
│   │   │   └── NotificationItem.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │       ├── ClinicLogo.tsx
│   │       ├── SpecialtyIcon.tsx
│   │       └── LoadingStates.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client (RSC)
│   │   │   ├── middleware.ts          # Auth middleware helper
│   │   │   └── types.ts              # Generated DB types
│   │   ├── scrapers/
│   │   │   ├── base.ts               # Scraper base class
│   │   │   ├── clc.ts                # CLC scraper
│   │   │   ├── alemana.ts            # Alemana scraper
│   │   │   ├── indisa.ts             # Indisa scraper
│   │   │   └── santa-maria.ts        # Santa María scraper
│   │   ├── notifications/
│   │   │   ├── email.ts              # Email sender (Resend o Supabase)
│   │   │   └── webhook.ts            # Webhook dispatcher
│   │   └── utils/
│   │       ├── rut.ts                 # Validación RUT chileno
│   │       └── dates.ts              # Helpers fecha Chile (TZ)
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useAlerts.ts
│   │   ├── useRealtimeSlots.ts        # Supabase Realtime subscription
│   │   └── useNotifications.ts
│   └── middleware.ts                  # Next.js middleware (auth guard)
├── public/
│   ├── clinics/                       # Logos de clínicas
│   └── og-image.png
└── vercel.json                        # Cron config
```

---

## Diseño UI/UX — Estética de Salud Moderna

### Directivas de diseño

El diseño debe transmitir **confianza médica** con un approach **moderno y limpio**. NO usar estética genérica de SaaS. Inspirarse en apps de salud como Doctolib, Zocdoc, One Medical.

#### Paleta de colores

```css
:root {
  /* Primario: Verde azulado médico */
  --primary-50: #f0fdfa;
  --primary-100: #ccfbf1;
  --primary-200: #99f6e4;
  --primary-300: #5eead4;
  --primary-400: #2dd4bf;
  --primary-500: #14b8a6;  /* Teal principal */
  --primary-600: #0d9488;
  --primary-700: #0f766e;
  --primary-800: #115e59;
  --primary-900: #134e4a;

  /* Acento: Coral suave para CTAs y alertas */
  --accent-400: #fb7185;
  --accent-500: #f43f5e;
  --accent-600: #e11d48;

  /* Neutros cálidos */
  --neutral-50: #fafaf9;
  --neutral-100: #f5f5f4;
  --neutral-200: #e7e5e4;
  --neutral-800: #292524;
  --neutral-900: #1c1917;

  /* Semánticos */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

#### Tipografía

- **Headlines**: `DM Sans` (bold, modern, médico sin ser frío)
- **Body**: `Inter` solo como fallback, preferir DM Sans regular
- **Monospace** (datos): `JetBrains Mono`
- Importar de Google Fonts en `layout.tsx`

#### Componentes clave

**SearchBar (hero del home)**:
- Input grande, centrado, con ícono de búsqueda
- Placeholder animado: "Buscar médico, especialidad..."
- Autocomplete dropdown con resultados agrupados: Médicos | Especialidades
- Debounce de 300ms en la búsqueda

**DoctorCard**:
- Layout horizontal en desktop, vertical en mobile
- Nombre del doctor en bold, especialidad en gris
- Chip de clínica con logo pequeño
- Badge verde "X horas disponibles" o gris "Sin disponibilidad"
- Botón "Crear alerta" si no hay horas
- Mini-calendario inline de próximos 7 días con dots indicando disponibilidad

**AlertCard**:
- Visual tipo "tarjeta de notificación"
- Estado con color: verde=activa, amarillo=pausada, gris=expirada
- Criterios mostrados como chips/tags
- Toggle on/off inline
- Contador "Disparada X veces"

**SlotPicker**:
- Grilla visual de horarios tipo calendario
- Colores por disponibilidad: verde=disponible, gris=ocupado
- Click abre link directo al portal de la clínica para reservar

**Dashboard**:
- Cards de resumen: alertas activas, notificaciones recientes, próximas horas
- Timeline de actividad reciente
- Stats de disponibilidad por clínica (sparklines)

#### Responsive

- Mobile-first
- Breakpoints: sm(640) md(768) lg(1024) xl(1280)
- Bottom navigation en mobile para Dashboard/Buscar/Alertas/Perfil
- Sheet/drawer para filtros en mobile

#### Animaciones

- Page transitions suaves con `framer-motion` o CSS transitions
- Skeleton loaders en búsqueda y listas
- Micro-interacciones en toggles y botones
- Notificación toast al crear/editar alerta

---

## Scraping Strategy

### Approach para el MVP

Para el MVP, los scrapers corren como **Vercel Cron Jobs** (o Supabase Edge Functions con pg_cron). Usan `fetch` para APIs directas cuando es posible, y para clínicas que requieren browser rendering, se usa un servicio externo (Browserless, o scraping en el VPS con Playwright como backup).

### Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### Scraper Implementation Notes

```typescript
// src/lib/scrapers/base.ts
// Cada scraper implementa esta interfaz:

interface ClinicScraper {
  clinicId: ClinicId;
  scrapeSpecialties(): Promise<RawSpecialty[]>;
  scrapeDoctors(specialtyId: string): Promise<RawDoctor[]>;
  scrapeSlots(doctorId: string, dateRange: DateRange): Promise<RawSlot[]>;
}

// Para CLC y Alemana: intentar API directa primero (sin browser)
// Para Indisa y Santa María: puede requerir proxy o Playwright remoto
```

### Flujo del Cron

1. Cron trigger → `/api/cron` route
2. Para cada clínica habilitada:
   a. Obtener lista de médicos monitoreados (que tienen alertas activas)
   b. Scrape slots para esos médicos
   c. Upsert en `available_slots` (marcar nuevos, marcar desaparecidos)
   d. Para cada slot NUEVO: ejecutar `match_alerts_for_slot()`
   e. Para cada alerta matcheada: enviar notificación
3. Registrar run en `scrape_runs`

---

## Auth Flow

Usar **Supabase Auth con PKCE** (flujo más seguro para SPAs):

- Email + password (signup con confirmación)
- Magic link como alternativa
- Middleware de Next.js para proteger rutas `/dashboard/*`
- Server Components usan `createServerClient` de `@supabase/ssr`
- Client Components usan `createBrowserClient`

---

## Dependencias Principales

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "tailwindcss": "^4",
    "lucide-react": "latest",
    "date-fns": "^4",
    "date-fns-tz": "^3",
    "zod": "^3",
    "sonner": "^1"
  },
  "devDependencies": {
    "typescript": "^5",
    "supabase": "latest",
    "@types/react": "^19",
    "@types/node": "^22"
  }
}
```

---

## Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev                    # Next.js dev server
npx supabase start            # Supabase local (Docker)
npx supabase db diff           # Ver cambios de schema
npx supabase gen types ts      # Generar tipos TypeScript

# Deploy
git push origin main           # Auto-deploy en Vercel via GitHub integration
npx supabase db push           # Push migraciones a producción
npx supabase functions deploy  # Deploy edge functions
```

---

## Definición de "Done" para el MVP

El MVP está TERMINADO cuando un usuario puede:

1. ✅ Llegar al landing page y ver una barra de búsqueda
2. ✅ Buscar "oftalmología" y ver resultados de las 4 clínicas
3. ✅ Buscar "Dr. Pérez" y ver médicos que matcheen
4. ✅ Ver el perfil de un médico con sus horas disponibles
5. ✅ Registrarse con email
6. ✅ Crear una alerta: "Avisarme cuando Dr. X tenga hora disponible entre lunes y viernes, 9:00-13:00"
7. ✅ Recibir un email cuando se detecte una hora nueva que matchee su alerta
8. ✅ Ver historial de notificaciones recibidas
9. ✅ Pausar/reactivar/eliminar alertas
10. ✅ Todo desplegado en Vercel con dominio funcional

### Lo que NO incluye el MVP

- Reserva directa desde la plataforma (solo link al portal de la clínica)
- App móvil nativa
- Push notifications (solo email en MVP)
- Pago / suscripción
- Scraping de las 4 clínicas completo (MVP puede empezar con 1-2)
