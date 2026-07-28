-- Lead conversion outcomes after remedies explained + indexes for metrics rollups
BEGIN;

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS conversion_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS conversion_reason_code VARCHAR(40),
  ADD COLUMN IF NOT EXISTS conversion_reason_note TEXT,
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(40),
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS not_converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS conversion_recorded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS conversion_recorded_by_name VARCHAR(200);

ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_conversion_status_check;
ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_conversion_status_check
  CHECK (conversion_status IS NULL OR conversion_status IN ('converted', 'not_converted'));

ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_conversion_converted_check;
ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_conversion_converted_check
  CHECK (
    conversion_status IS DISTINCT FROM 'converted'
    OR (order_id IS NOT NULL AND order_number IS NOT NULL)
  );

ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_conversion_not_converted_check;
ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_conversion_not_converted_check
  CHECK (
    conversion_status IS DISTINCT FROM 'not_converted'
    OR conversion_reason_code IS NOT NULL
  );

-- One lead per order when converted
CREATE UNIQUE INDEX IF NOT EXISTS idx_enquiries_order_id_unique
  ON enquiries (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_conversion_closed
  ON enquiries (conversion_status, closed_at DESC)
  WHERE conversion_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_conversion
  ON enquiries (assigned_to, conversion_status, closed_at DESC)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_astrologer_conversion
  ON enquiries (astrologer_id, conversion_status, closed_at DESC)
  WHERE astrologer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_converted_at
  ON enquiries (converted_at DESC)
  WHERE conversion_status = 'converted';

CREATE INDEX IF NOT EXISTS idx_enquiries_not_converted_at
  ON enquiries (not_converted_at DESC)
  WHERE conversion_status = 'not_converted';

CREATE INDEX IF NOT EXISTS idx_enquiries_conversion_reason
  ON enquiries (conversion_reason_code)
  WHERE conversion_status = 'not_converted';

-- Aggregates for /admin/leads/metrics — never pull full lead rows into the app
CREATE OR REPLACE FUNCTION lead_conversion_metrics(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL,
  p_astrologer_id UUID DEFAULT NULL,
  p_enquiry_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  WITH base AS (
    SELECT
      e.assigned_to,
      e.astrologer_id,
      e.astrologer_name,
      e.pipeline_stage,
      e.conversion_status,
      e.conversion_reason_code,
      e.closed_at,
      e.converted_at,
      e.not_converted_at,
      COALESCE(e.converted_at, e.not_converted_at, e.closed_at, e.updated_at) AS outcome_at
    FROM enquiries e
    WHERE
      (p_assigned_to IS NULL OR e.assigned_to = p_assigned_to)
      AND (p_astrologer_id IS NULL OR e.astrologer_id = p_astrologer_id)
      AND (
        p_enquiry_type IS NULL
        OR p_enquiry_type = ''
        OR (
          p_enquiry_type IN ('remedies', 'Remedies Recommendation')
          AND (
            e.source = 'homepage_recommendation'
            OR e.enquiry_type ILIKE '%Remedies%'
            OR e.enquiry_type ILIKE '%Gemstone%'
            OR e.subject ILIKE '%Gemstone%'
            OR e.subject ILIKE '%Remed%'
          )
          AND COALESCE(e.enquiry_type, '') NOT ILIKE '%Consultation%'
        )
        OR (
          p_enquiry_type IN ('consultation', 'Consultation')
          AND (
            e.enquiry_type ILIKE '%Consultation%'
            OR e.subject ILIKE '%Consultation%'
            OR e.consultation_id IS NOT NULL
          )
        )
        OR (
          p_enquiry_type NOT IN ('remedies', 'Remedies Recommendation', 'consultation', 'Consultation')
          AND e.enquiry_type ILIKE ('%' || p_enquiry_type || '%')
        )
      )
      AND (
        -- pending explained (no outcome yet): filter by updated/created window via closed null
        (
          e.pipeline_stage = 'conversion'
          AND e.conversion_status IS NULL
          AND (p_date_from IS NULL OR e.updated_at >= p_date_from)
          AND (p_date_to IS NULL OR e.updated_at <= p_date_to)
        )
        OR (
          e.pipeline_stage = 'remedies_explained'
          AND e.conversion_status IS NULL
          AND (p_date_from IS NULL OR e.updated_at >= p_date_from)
          AND (p_date_to IS NULL OR e.updated_at <= p_date_to)
        )
        OR (
          e.conversion_status = 'converted'
          AND (p_date_from IS NULL OR e.converted_at >= p_date_from)
          AND (p_date_to IS NULL OR e.converted_at <= p_date_to)
        )
        OR (
          e.conversion_status = 'not_converted'
          AND (p_date_from IS NULL OR e.not_converted_at >= p_date_from)
          AND (p_date_to IS NULL OR e.not_converted_at <= p_date_to)
        )
      )
  ),
  summary AS (
    SELECT jsonb_build_object(
      'pending_outcome', COUNT(*) FILTER (
        WHERE conversion_status IS NULL
        AND pipeline_stage IN ('conversion', 'remedies_explained')
      ),
      'converted', COUNT(*) FILTER (WHERE conversion_status = 'converted'),
      'not_converted', COUNT(*) FILTER (WHERE conversion_status = 'not_converted'),
      'explained_total', COUNT(*)
    ) AS j
    FROM base
  ),
  by_telecaller AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', x.assigned_to,
          'converted', x.converted,
          'not_converted', x.not_converted,
          'pending', x.pending,
          'total', x.total
        )
        ORDER BY x.converted DESC, x.total DESC
      ),
      '[]'::jsonb
    ) AS j
    FROM (
      SELECT
        assigned_to,
        COUNT(*) FILTER (WHERE conversion_status = 'converted')::int AS converted,
        COUNT(*) FILTER (WHERE conversion_status = 'not_converted')::int AS not_converted,
        COUNT(*) FILTER (
          WHERE conversion_status IS NULL
          AND pipeline_stage IN ('conversion', 'remedies_explained')
        )::int AS pending,
        COUNT(*)::int AS total
      FROM base
      WHERE assigned_to IS NOT NULL
      GROUP BY assigned_to
    ) x
  ),
  by_astrologer AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', x.astrologer_id,
          'name', x.astrologer_name,
          'converted', x.converted,
          'not_converted', x.not_converted,
          'pending', x.pending,
          'total', x.total
        )
        ORDER BY x.converted DESC, x.total DESC
      ),
      '[]'::jsonb
    ) AS j
    FROM (
      SELECT
        astrologer_id,
        MAX(astrologer_name) AS astrologer_name,
        COUNT(*) FILTER (WHERE conversion_status = 'converted')::int AS converted,
        COUNT(*) FILTER (WHERE conversion_status = 'not_converted')::int AS not_converted,
        COUNT(*) FILTER (
          WHERE conversion_status IS NULL
          AND pipeline_stage IN ('conversion', 'remedies_explained')
        )::int AS pending,
        COUNT(*)::int AS total
      FROM base
      WHERE astrologer_id IS NOT NULL
      GROUP BY astrologer_id
    ) x
  ),
  reasons AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object('code', x.conversion_reason_code, 'count', x.cnt)
        ORDER BY x.cnt DESC
      ),
      '[]'::jsonb
    ) AS j
    FROM (
      SELECT conversion_reason_code, COUNT(*)::int AS cnt
      FROM base
      WHERE conversion_status = 'not_converted' AND conversion_reason_code IS NOT NULL
      GROUP BY conversion_reason_code
    ) x
  ),
  trend AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'month', x.month,
          'converted', x.converted,
          'not_converted', x.not_converted
        )
        ORDER BY x.month
      ),
      '[]'::jsonb
    ) AS j
    FROM (
      SELECT
        to_char(date_trunc('month', COALESCE(converted_at, not_converted_at, closed_at)), 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE conversion_status = 'converted')::int AS converted,
        COUNT(*) FILTER (WHERE conversion_status = 'not_converted')::int AS not_converted
      FROM base
      WHERE conversion_status IS NOT NULL
      GROUP BY 1
    ) x
  )
  SELECT jsonb_build_object(
    'summary', (SELECT j FROM summary),
    'by_telecaller', (SELECT j FROM by_telecaller),
    'by_astrologer', (SELECT j FROM by_astrologer),
    'not_converted_reasons', (SELECT j FROM reasons),
    'trend', (SELECT j FROM trend)
  );
$$;

GRANT EXECUTE ON FUNCTION lead_conversion_metrics(TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, TEXT) TO service_role;

COMMIT;
