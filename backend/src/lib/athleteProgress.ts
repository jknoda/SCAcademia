import { PoolClient } from 'pg';
import { pool } from './db';

const VALID_CATEGORIES = [
  'technical',
  'physical',
  'tactical',
  'competition',
  'psychological',
  'training',
] as const;

const DEFAULT_COMPARISON_METRICS = [
  { metricCode: 'overall_progress', metricName: 'Progresso Geral' },
  { metricCode: 'technical_score', metricName: 'Técnico' },
  { metricCode: 'physical_score', metricName: 'Físico' },
  { metricCode: 'behavior_score', metricName: 'Comportamental' },
  { metricCode: 'attendance_rate', metricName: 'Frequência' },
  { metricCode: 'competition_count', metricName: 'Competições' },
] as const;

export type AthleteMetricCategory = (typeof VALID_CATEGORIES)[number];
export type AthleteMetricValueType = 'score' | 'integer' | 'decimal' | 'structured';

export interface AthleteStructuredValue {
  primaryValue: number;
  secondaryValue?: number;
  textValue?: string;
  [key: string]: unknown;
}

export interface AthleteMetricInput {
  metricCode: string;
  metricName: string;
  category: AthleteMetricCategory;
  value: number;
  unit: string;
  groupCode?: string;
  description?: string;
  inputInstruction?: string;
  valueType?: AthleteMetricValueType;
  displayFormat?: string;
  allowPeriodAggregation?: boolean;
  displayOrder?: number;
  displayValue?: string;
  secondaryValue?: number;
  structuredValue?: AthleteStructuredValue;
}

export interface AthleteIndicatorDefinition {
  code: string;
  name: string;
  category: AthleteMetricCategory;
  unit: string;
  valueType: AthleteMetricValueType;
  displayFormat: string;
  description?: string;
  inputInstruction?: string;
  allowPeriodAggregation: boolean;
  isActive: boolean;
  displayOrder: number;
  groupCode: string;
}

export interface AthleteIndicatorGroup {
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  indicators: AthleteIndicatorDefinition[];
}

export interface AthleteIndicatorConfigurationInput {
  groups: AthleteIndicatorGroup[];
}

export interface CreateAthleteAssessmentInput {
  academyId: string;
  athleteId: string;
  recordedByUserId: string;
  assessmentDate: string;
  notes?: string;
  source?: 'manual' | 'system';
  metrics: AthleteMetricInput[];
}

export interface AthleteAssessmentRecord {
  assessmentId: string;
  athleteId: string;
  assessmentDate: string;
  notes?: string;
  source: 'manual' | 'system';
  recordedByUserId?: string;
  recordedByName?: string;
  createdAt: string;
  metrics: AthleteMetricInput[];
}

export interface AthleteComparisonChange {
  metricCode: string;
  metricName: string;
  currentValue: number | null;
  previousValue: number | null;
  delta: number | null;
  deltaPercent: number | null;
  trend: 'up' | 'down' | 'stable' | 'no-data';
}

export interface AthleteComparisonWindowSummary {
  from: string | null;
  to: string | null;
  assessmentCount: number;
}

export interface AthleteComparisonPeriod {
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  hasPartialData: boolean;
  current: AthleteComparisonWindowSummary;
  previous: AthleteComparisonWindowSummary;
  changes: AthleteComparisonChange[];
}

export interface AthleteProgressQueryOptions {
  period?: '7d' | '30d' | '90d' | 'all' | 'week' | 'month';
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  groupBy?: 'day' | 'week' | 'month';
}

export interface AthleteProgressGroupedPoint {
  label: string;
  date: string;
  assessmentCount: number;
  averageScore: number;
}

export interface AthleteProgressAlert {
  alertId: string;
  type: string;
  kind: 'alert' | 'insight';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  createdAt?: string;
  isActive?: boolean;
  context?: Record<string, unknown>;
}

export interface AthleteProgressHistoryPayload {
  athleteId: string;
  athleteName: string;
  summary: {
    totalSessions: number;
    totalAttendance: number;
    attendancePercentage: number;
    streakCurrent: number;
    streakLongest: number;
    totalAssessments: number;
    lastAssessmentDate: string | null;
    lastUpdatedAt?: string;
    latestMetrics?: Record<string, { value: number; unit: string; category: AthleteMetricCategory }>;
    trendStatus?: 'positive' | 'attention' | 'stable' | 'insufficient-data';
  };
  assessments: AthleteAssessmentRecord[];
  comparisons: Record<'30d' | '90d' | 'all', AthleteComparisonPeriod>;
  alerts: AthleteProgressAlert[];
  indicatorGroups: AthleteIndicatorGroup[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  groupedSeries?: AthleteProgressGroupedPoint[];
  range?: {
    from: string | null;
    to: string | null;
  };
}

let schemaEnsured = false;

const DEFAULT_INDICATOR_GROUPS: AthleteIndicatorGroup[] = [
  {
    code: 'training',
    name: 'Treinamento',
    description: 'Indicadores gerais de evolução e consistência.',
    displayOrder: 1,
    isActive: true,
    indicators: [
      {
        code: 'overall_progress',
        name: 'Progresso geral',
        category: 'training',
        unit: 'score',
        valueType: 'score',
        displayFormat: 'score',
        inputInstruction: 'Avalie a evolução global de 1 a 5.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 1,
        groupCode: 'training',
      },
      {
        code: 'attendance_rate',
        name: 'Frequência',
        category: 'training',
        unit: 'percent',
        valueType: 'integer',
        displayFormat: 'percent',
        inputInstruction: 'Informe a frequência em porcentagem no período.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 2,
        groupCode: 'training',
      },
    ],
  },
  {
    code: 'technical',
    name: 'Técnica',
    description: 'Qualidade de execução e domínio técnico.',
    displayOrder: 2,
    isActive: true,
    indicators: [
      {
        code: 'technical_score',
        name: 'Nota técnica',
        category: 'technical',
        unit: 'score',
        valueType: 'score',
        displayFormat: 'score',
        inputInstruction: 'Avalie a execução técnica de 1 a 5.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 1,
        groupCode: 'technical',
      },
    ],
  },
  {
    code: 'physical',
    name: 'Físico',
    description: 'Condição física e capacidade de manter o ritmo.',
    displayOrder: 3,
    isActive: true,
    indicators: [
      {
        code: 'physical_score',
        name: 'Nota física',
        category: 'physical',
        unit: 'score',
        valueType: 'score',
        displayFormat: 'score',
        inputInstruction: 'Avalie o desenvolvimento físico de 1 a 5.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 1,
        groupCode: 'physical',
      },
    ],
  },
  {
    code: 'behavior',
    name: 'Comportamento',
    description: 'Disciplina, foco e postura do atleta.',
    displayOrder: 4,
    isActive: true,
    indicators: [
      {
        code: 'behavior_score',
        name: 'Nota comportamental',
        category: 'psychological',
        unit: 'score',
        valueType: 'score',
        displayFormat: 'score',
        inputInstruction: 'Avalie disciplina e atitude de 1 a 5.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 1,
        groupCode: 'behavior',
      },
    ],
  },
  {
    code: 'competition',
    name: 'Competição',
    description: 'Volume competitivo e desempenho em lutas.',
    displayOrder: 5,
    isActive: true,
    indicators: [
      {
        code: 'competition_count',
        name: 'Número de competições',
        category: 'competition',
        unit: 'count',
        valueType: 'integer',
        displayFormat: 'count',
        inputInstruction: 'Informe quantas competições o atleta disputou no período.',
        allowPeriodAggregation: true,
        isActive: true,
        displayOrder: 1,
        groupCode: 'competition',
      },
      {
        code: 'competition_record',
        name: 'Saldo competitivo',
        category: 'competition',
        unit: 'ratio',
        valueType: 'structured',
        displayFormat: 'ratio',
        inputInstruction: 'Informe o saldo no formato vitórias:derrotas.',
        allowPeriodAggregation: false,
        isActive: true,
        displayOrder: 2,
        groupCode: 'competition',
      },
    ],
  },
];

const sanitizeMetricCode = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);

const inferGroupCodeForMetric = (metric: Partial<AthleteMetricInput>): string => {
  if (metric.groupCode?.trim()) {
    return sanitizeMetricCode(metric.groupCode);
  }

  switch (metric.metricCode) {
    case 'technical_score':
      return 'technical';
    case 'physical_score':
      return 'physical';
    case 'behavior_score':
      return 'behavior';
    case 'competition_count':
    case 'competition_record':
      return 'competition';
    default:
      return sanitizeMetricCode(metric.category ?? 'training') || 'training';
  }
};

const inferMetricValueType = (metric: Partial<AthleteMetricInput>): AthleteMetricValueType => {
  if (metric.valueType) {
    return metric.valueType;
  }

  if (metric.secondaryValue !== undefined || metric.structuredValue || metric.displayFormat === 'ratio') {
    return 'structured';
  }

  if (metric.unit === 'score') {
    return 'score';
  }

  if (metric.unit === 'count' || metric.unit === 'percent') {
    return 'integer';
  }

  return 'decimal';
};

const buildMetricDisplayValue = (metric: Partial<AthleteMetricInput>): string | undefined => {
  if (metric.displayValue?.trim()) {
    return metric.displayValue.trim();
  }

  if (metric.secondaryValue !== undefined) {
    return `${Number(metric.value ?? 0)}:${Number(metric.secondaryValue)}`;
  }

  if (metric.value === undefined || metric.value === null || Number.isNaN(Number(metric.value))) {
    return undefined;
  }

  return String(metric.value);
};

export const ensureAthleteProgressSchema = async (): Promise<void> => {
  if (schemaEnsured) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_progress_profiles (
      profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      last_assessment_at DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT uq_athlete_progress_profiles UNIQUE (athlete_id, academy_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_progress_metric_definitions (
      metric_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      metric_code VARCHAR(100) NOT NULL,
      metric_name VARCHAR(255) NOT NULL,
      metric_category VARCHAR(50) NOT NULL,
      unit VARCHAR(30) NOT NULL DEFAULT 'score',
      source VARCHAR(30) NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT uq_athlete_progress_metric_code UNIQUE (academy_id, metric_code),
      CONSTRAINT chk_athlete_progress_metric_category CHECK (
        metric_category IN ('technical', 'physical', 'tactical', 'competition', 'psychological', 'training')
      )
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_assessments (
      assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      recorded_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
      assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT,
      source VARCHAR(30) NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT chk_athlete_assessment_source CHECK (source IN ('manual', 'system'))
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_metric_values (
      metric_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assessment_id UUID NOT NULL REFERENCES athlete_assessments(assessment_id) ON DELETE CASCADE,
      metric_definition_id UUID REFERENCES athlete_progress_metric_definitions(metric_definition_id) ON DELETE SET NULL,
      athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      metric_code VARCHAR(100) NOT NULL,
      metric_category VARCHAR(50) NOT NULL,
      metric_value NUMERIC(10,2) NOT NULL,
      metric_unit VARCHAR(30) NOT NULL DEFAULT 'score',
      recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT chk_athlete_metric_value_category CHECK (
        metric_category IN ('technical', 'physical', 'tactical', 'competition', 'psychological', 'training')
      )
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_progress_snapshots (
      snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      assessment_id UUID REFERENCES athlete_assessments(assessment_id) ON DELETE SET NULL,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
      summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_progress_alerts (
      alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      athlete_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      alert_type VARCHAR(80) NOT NULL,
      alert_kind VARCHAR(20) NOT NULL DEFAULT 'alert',
      severity VARCHAR(20) NOT NULL DEFAULT 'medium',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT chk_athlete_progress_alert_kind CHECK (alert_kind IN ('alert', 'insight')),
      CONSTRAINT chk_athlete_progress_alert_severity CHECK (severity IN ('high', 'medium', 'low'))
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS athlete_progress_indicator_groups (
      group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      group_code VARCHAR(100) NOT NULL,
      group_name VARCHAR(255) NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      CONSTRAINT uq_athlete_progress_indicator_group UNIQUE (academy_id, group_code)
    )
  `);

  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES athlete_progress_indicator_groups(group_id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS group_code VARCHAR(100)`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS description TEXT`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS input_instruction TEXT`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS value_type VARCHAR(30) NOT NULL DEFAULT 'score'`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS display_format VARCHAR(50) NOT NULL DEFAULT 'score'`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS allow_period_aggregation BOOLEAN NOT NULL DEFAULT true`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE athlete_progress_metric_definitions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`);

  await pool.query(`ALTER TABLE athlete_metric_values ADD COLUMN IF NOT EXISTS metric_display_value TEXT`);
  await pool.query(`ALTER TABLE athlete_metric_values ADD COLUMN IF NOT EXISTS secondary_value NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE athlete_metric_values ADD COLUMN IF NOT EXISTS structured_value_json JSONB NOT NULL DEFAULT '{}'::jsonb`);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_progress_profiles_academy ON athlete_progress_profiles(academy_id, athlete_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_indicator_groups_lookup ON athlete_progress_indicator_groups(academy_id, group_code)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_assessments_athlete_date ON athlete_assessments(academy_id, athlete_id, assessment_date DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_metric_values_lookup ON athlete_metric_values(academy_id, athlete_id, recorded_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_progress_snapshots_lookup ON athlete_progress_snapshots(academy_id, athlete_id, snapshot_date DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_athlete_progress_alerts_lookup ON athlete_progress_alerts(academy_id, athlete_id, is_active, updated_at DESC)');

  schemaEnsured = true;
};

const getAthleteScope = async (academyId: string, athleteId: string): Promise<{ athleteId: string; athleteName: string } | null> => {
  await ensureAthleteProgressSchema();

  const res = await pool.query(
    `SELECT user_id, full_name
     FROM users
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Aluno'
       AND deleted_at IS NULL
     LIMIT 1`,
    [athleteId, academyId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return {
    athleteId: String(res.rows[0].user_id),
    athleteName: String(res.rows[0].full_name),
  };
};

export const ensureDefaultIndicatorConfiguration = async (
  academyId: string,
  client?: PoolClient
): Promise<void> => {
  await ensureAthleteProgressSchema();

  const runner = client ?? pool;

  for (const group of DEFAULT_INDICATOR_GROUPS) {
    const groupRes = await runner.query(
      `INSERT INTO athlete_progress_indicator_groups (
         academy_id,
         group_code,
         group_name,
         description,
         display_order,
         is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (academy_id, group_code)
       DO UPDATE SET
         group_name = EXCLUDED.group_name,
         description = COALESCE(athlete_progress_indicator_groups.description, EXCLUDED.description),
         display_order = EXCLUDED.display_order,
         is_active = true,
         updated_at = NOW(),
         deleted_at = NULL
       RETURNING group_id`,
      [academyId, group.code, group.name, group.description ?? null, group.displayOrder, group.isActive]
    );

    const groupId = String(groupRes.rows[0].group_id);

    for (const indicator of group.indicators) {
      await runner.query(
        `INSERT INTO athlete_progress_metric_definitions (
           academy_id,
           metric_code,
           metric_name,
           metric_category,
           unit,
           source,
           group_id,
           group_code,
           description,
           input_instruction,
           value_type,
           display_format,
           allow_period_aggregation,
           display_order,
           is_active
         )
         VALUES ($1, $2, $3, $4, $5, 'manual', $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (academy_id, metric_code)
         DO UPDATE SET
           metric_name = EXCLUDED.metric_name,
           metric_category = EXCLUDED.metric_category,
           unit = EXCLUDED.unit,
           group_id = EXCLUDED.group_id,
           group_code = EXCLUDED.group_code,
           description = COALESCE(athlete_progress_metric_definitions.description, EXCLUDED.description),
           input_instruction = COALESCE(athlete_progress_metric_definitions.input_instruction, EXCLUDED.input_instruction),
           value_type = COALESCE(athlete_progress_metric_definitions.value_type, EXCLUDED.value_type),
           display_format = COALESCE(athlete_progress_metric_definitions.display_format, EXCLUDED.display_format),
           allow_period_aggregation = COALESCE(athlete_progress_metric_definitions.allow_period_aggregation, EXCLUDED.allow_period_aggregation),
           display_order = COALESCE(athlete_progress_metric_definitions.display_order, EXCLUDED.display_order),
           is_active = true,
           updated_at = NOW(),
           deleted_at = NULL`,
        [
          academyId,
          indicator.code,
          indicator.name,
          indicator.category,
          indicator.unit,
          groupId,
          group.code,
          indicator.description ?? null,
          indicator.inputInstruction ?? null,
          indicator.valueType,
          indicator.displayFormat,
          indicator.allowPeriodAggregation,
          indicator.displayOrder,
          indicator.isActive,
        ]
      );
    }
  }
};

export const listAthleteIndicatorConfiguration = async (
  academyId: string,
  client?: PoolClient
): Promise<AthleteIndicatorGroup[]> => {
  await ensureAthleteProgressSchema();
  await ensureDefaultIndicatorConfiguration(academyId, client);

  const runner = client ?? pool;
  const res = await runner.query(
    `SELECT
       grp.group_code,
       grp.group_name,
       grp.description AS group_description,
       grp.display_order AS group_display_order,
       grp.is_active AS group_is_active,
       md.metric_code,
       md.metric_name,
       md.metric_category,
       md.unit,
       md.description,
       md.input_instruction,
       md.value_type,
       md.display_format,
       md.allow_period_aggregation,
       md.display_order,
       md.is_active
     FROM athlete_progress_indicator_groups grp
     LEFT JOIN athlete_progress_metric_definitions md
       ON md.group_id = grp.group_id
      AND md.academy_id = grp.academy_id
      AND md.deleted_at IS NULL
     WHERE grp.academy_id = $1
       AND grp.deleted_at IS NULL
     ORDER BY grp.display_order ASC, md.display_order ASC, md.metric_name ASC`,
    [academyId]
  );

  const groups = new Map<string, AthleteIndicatorGroup>();

  for (const row of res.rows) {
    const groupCode = String(row.group_code);
    if (!groups.has(groupCode)) {
      groups.set(groupCode, {
        code: groupCode,
        name: String(row.group_name),
        description: row.group_description ? String(row.group_description) : undefined,
        displayOrder: Number(row.group_display_order ?? 0),
        isActive: Boolean(row.group_is_active),
        indicators: [],
      });
    }

    if (row.metric_code) {
      groups.get(groupCode)?.indicators.push({
        code: String(row.metric_code),
        name: String(row.metric_name),
        category: String(row.metric_category) as AthleteMetricCategory,
        unit: String(row.unit ?? 'score'),
        description: row.description ? String(row.description) : undefined,
        inputInstruction: row.input_instruction ? String(row.input_instruction) : undefined,
        valueType: String(row.value_type ?? 'score') as AthleteMetricValueType,
        displayFormat: String(row.display_format ?? 'score'),
        allowPeriodAggregation: Boolean(row.allow_period_aggregation),
        isActive: Boolean(row.is_active),
        displayOrder: Number(row.display_order ?? 0),
        groupCode,
      });
    }
  }

  return Array.from(groups.values());
};

export const upsertAthleteIndicatorConfiguration = async (
  academyId: string,
  input: AthleteIndicatorConfigurationInput,
  client?: PoolClient
): Promise<AthleteIndicatorGroup[]> => {
  await ensureAthleteProgressSchema();

  const runner = client ?? pool;

  if (!input.groups?.length) {
    return listAthleteIndicatorConfiguration(academyId, client);
  }

  for (const rawGroup of input.groups) {
    const groupCode = sanitizeMetricCode(rawGroup.code || rawGroup.name || 'group');
    const groupRes = await runner.query(
      `INSERT INTO athlete_progress_indicator_groups (
         academy_id,
         group_code,
         group_name,
         description,
         display_order,
         is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (academy_id, group_code)
       DO UPDATE SET
         group_name = EXCLUDED.group_name,
         description = EXCLUDED.description,
         display_order = EXCLUDED.display_order,
         is_active = EXCLUDED.is_active,
         updated_at = NOW(),
         deleted_at = NULL
       RETURNING group_id`,
      [
        academyId,
        groupCode,
        rawGroup.name,
        rawGroup.description ?? null,
        rawGroup.displayOrder ?? 0,
        rawGroup.isActive !== false,
      ]
    );

    const groupId = String(groupRes.rows[0].group_id);

    for (const rawIndicator of rawGroup.indicators ?? []) {
      const metricCode = sanitizeMetricCode(rawIndicator.code || rawIndicator.name || 'metric');
      await runner.query(
        `INSERT INTO athlete_progress_metric_definitions (
           academy_id,
           metric_code,
           metric_name,
           metric_category,
           unit,
           source,
           group_id,
           group_code,
           description,
           input_instruction,
           value_type,
           display_format,
           allow_period_aggregation,
           display_order,
           is_active
         )
         VALUES ($1, $2, $3, $4, $5, 'manual', $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (academy_id, metric_code)
         DO UPDATE SET
           metric_name = EXCLUDED.metric_name,
           metric_category = EXCLUDED.metric_category,
           unit = EXCLUDED.unit,
           group_id = EXCLUDED.group_id,
           group_code = EXCLUDED.group_code,
           description = EXCLUDED.description,
           input_instruction = EXCLUDED.input_instruction,
           value_type = EXCLUDED.value_type,
           display_format = EXCLUDED.display_format,
           allow_period_aggregation = EXCLUDED.allow_period_aggregation,
           display_order = EXCLUDED.display_order,
           is_active = EXCLUDED.is_active,
           updated_at = NOW(),
           deleted_at = NULL`,
        [
          academyId,
          metricCode,
          rawIndicator.name,
          rawIndicator.category,
          rawIndicator.unit ?? 'score',
          groupId,
          groupCode,
          rawIndicator.description ?? null,
          rawIndicator.inputInstruction ?? null,
          rawIndicator.valueType ?? inferMetricValueType(rawIndicator),
          rawIndicator.displayFormat ?? 'score',
          rawIndicator.allowPeriodAggregation !== false,
          rawIndicator.displayOrder ?? 0,
          rawIndicator.isActive !== false,
        ]
      );
    }
  }

  return listAthleteIndicatorConfiguration(academyId, client);
};

const getRangeSummary = (assessments: AthleteAssessmentRecord[]): AthleteComparisonWindowSummary => {
  if (!assessments.length) {
    return {
      from: null,
      to: null,
      assessmentCount: 0,
    };
  }

  const ordered = [...assessments].sort(
    (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
  );

  return {
    from: ordered[0].assessmentDate,
    to: ordered[ordered.length - 1].assessmentDate,
    assessmentCount: ordered.length,
  };
};

const averageMetricValue = (
  assessments: AthleteAssessmentRecord[],
  metricCode: string
): number | null => {
  const values = assessments
    .flatMap((assessment) => assessment.metrics)
    .filter((metric) => metric.metricCode === metricCode && metric.allowPeriodAggregation !== false)
    .map((metric) => Number(metric.value))
    .filter((value) => !Number.isNaN(value));

  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

const buildComparisonPeriod = (
  currentAssessments: AthleteAssessmentRecord[],
  previousAssessments: AthleteAssessmentRecord[],
  currentPeriodLabel: string,
  previousPeriodLabel: string
): AthleteComparisonPeriod => {
  const catalog = new Map<string, string>();

  for (const metric of DEFAULT_COMPARISON_METRICS) {
    catalog.set(metric.metricCode, metric.metricName);
  }

  for (const assessment of [...currentAssessments, ...previousAssessments]) {
    for (const metric of assessment.metrics) {
      if (metric.allowPeriodAggregation === false) {
        continue;
      }

      if (!catalog.has(metric.metricCode)) {
        catalog.set(metric.metricCode, metric.metricName);
      }
    }
  }

  const changes = Array.from(catalog.entries()).map(([metricCode, metricName]) => {
    const currentValue = averageMetricValue(currentAssessments, metricCode);
    const previousValue = averageMetricValue(previousAssessments, metricCode);

    if (currentValue === null || previousValue === null) {
      return {
        metricCode,
        metricName,
        currentValue,
        previousValue,
        delta: null,
        deltaPercent: null,
        trend: 'no-data' as const,
      };
    }

    const delta = Number((currentValue - previousValue).toFixed(2));
    const deltaPercent = previousValue === 0
      ? null
      : Number((((currentValue - previousValue) / Math.abs(previousValue)) * 100).toFixed(1));

    let trend: AthleteComparisonChange['trend'] = 'stable';
    if (delta > 0.1) {
      trend = 'up';
    } else if (delta < -0.1) {
      trend = 'down';
    }

    return {
      metricCode,
      metricName,
      currentValue,
      previousValue,
      delta,
      deltaPercent,
      trend,
    };
  });

  return {
    currentPeriodLabel,
    previousPeriodLabel,
    hasPartialData: changes.some((change) => change.currentValue === null || change.previousValue === null),
    current: getRangeSummary(currentAssessments),
    previous: getRangeSummary(previousAssessments),
    changes,
  };
};

const buildRollingComparison = (
  assessments: AthleteAssessmentRecord[],
  days: number,
  currentLabel: string,
  previousLabel: string
): AthleteComparisonPeriod => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - (days - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - (days - 1));

  const currentAssessments = assessments.filter((assessment) => {
    const date = new Date(assessment.assessmentDate);
    return date >= currentStart && date <= today;
  });

  const previousAssessments = assessments.filter((assessment) => {
    const date = new Date(assessment.assessmentDate);
    return date >= previousStart && date <= previousEnd;
  });

  return buildComparisonPeriod(currentAssessments, previousAssessments, currentLabel, previousLabel);
};

const buildHistoricalComparison = (assessments: AthleteAssessmentRecord[]): AthleteComparisonPeriod => {
  const ordered = [...assessments].sort(
    (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
  );

  const splitIndex = Math.max(1, Math.ceil(ordered.length / 2));
  const currentAssessments = ordered.slice(Math.max(ordered.length - splitIndex, 0));
  const previousAssessments = ordered.slice(0, Math.max(ordered.length - splitIndex, 0));

  return buildComparisonPeriod(
    currentAssessments,
    previousAssessments,
    'Período recente',
    'Período anterior'
  );
};

const getComparisonMetric = (
  comparison: AthleteComparisonPeriod,
  metricCode: string
): AthleteComparisonChange | null => comparison.changes.find((change) => change.metricCode === metricCode) || null;

const getDaysSince = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const target = new Date(value);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const normalizePeriod = (
  period?: AthleteProgressQueryOptions['period']
): '7d' | '30d' | '90d' | 'all' => {
  switch (period) {
    case 'week':
      return '7d';
    case 'month':
      return '30d';
    case '7d':
    case '30d':
    case '90d':
    case 'all':
      return period;
    default:
      return 'all';
  }
};

const resolveDateRange = (
  options?: AthleteProgressQueryOptions
): { from: string | null; to: string | null } => {
  if (options?.from || options?.to) {
    return {
      from: options?.from || null,
      to: options?.to || null,
    };
  }

  const normalizedPeriod = normalizePeriod(options?.period);
  if (normalizedPeriod === 'all') {
    return { from: null, to: null };
  }

  const days = normalizedPeriod === '7d' ? 7 : normalizedPeriod === '30d' ? 30 : 90;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  return {
    from: toIsoDate(start),
    to: toIsoDate(today),
  };
};

const filterAssessmentsByOptions = (
  assessments: AthleteAssessmentRecord[],
  options?: AthleteProgressQueryOptions
): { filtered: AthleteAssessmentRecord[]; range: { from: string | null; to: string | null } } => {
  const range = resolveDateRange(options);

  const filtered = assessments.filter((assessment) => {
    const assessmentDate = assessment.assessmentDate;

    if (range.from && assessmentDate < range.from) {
      return false;
    }

    if (range.to && assessmentDate > range.to) {
      return false;
    }

    return true;
  });

  return { filtered, range };
};

const buildLatestMetrics = (
  assessment?: AthleteAssessmentRecord | null
): Record<string, { value: number; unit: string; category: AthleteMetricCategory }> => {
  const latestMetrics: Record<string, { value: number; unit: string; category: AthleteMetricCategory }> = {};

  for (const metric of assessment?.metrics || []) {
    latestMetrics[metric.metricCode] = {
      value: Number(metric.value),
      unit: metric.unit,
      category: metric.category,
    };
  }

  return latestMetrics;
};

const resolveTrendStatus = (
  comparisons: Record<'30d' | '90d' | 'all', AthleteComparisonPeriod>
): 'positive' | 'attention' | 'stable' | 'insufficient-data' => {
  const focus = getComparisonMetric(comparisons['30d'], 'overall_progress')
    || getComparisonMetric(comparisons['90d'], 'overall_progress');

  if (!focus || focus.delta === null) {
    return 'insufficient-data';
  }

  if (focus.delta > 0.25) {
    return 'positive';
  }

  if (focus.delta < -0.25) {
    return 'attention';
  }

  return 'stable';
};

const buildGroupedSeries = (
  assessments: AthleteAssessmentRecord[],
  groupBy: 'day' | 'week' | 'month' = 'month'
): AthleteProgressGroupedPoint[] => {
  const buckets = new Map<string, { date: string; label: string; values: number[] }>();

  for (const assessment of assessments) {
    const baseDate = new Date(`${assessment.assessmentDate}T00:00:00Z`);
    let bucketDate = assessment.assessmentDate;
    let label = assessment.assessmentDate;

    if (groupBy === 'month') {
      bucketDate = `${assessment.assessmentDate.slice(0, 7)}-01`;
      label = assessment.assessmentDate.slice(0, 7);
    } else if (groupBy === 'week') {
      const day = baseDate.getUTCDay();
      const diff = (day + 6) % 7;
      baseDate.setUTCDate(baseDate.getUTCDate() - diff);
      bucketDate = toIsoDate(baseDate);
      label = `Semana de ${bucketDate}`;
    }

    const avgScore = assessment.metrics.length
      ? assessment.metrics.reduce((sum, item) => sum + Number(item.value || 0), 0) / assessment.metrics.length
      : 0;

    if (!buckets.has(label)) {
      buckets.set(label, { date: bucketDate, label, values: [] });
    }

    buckets.get(label)?.values.push(avgScore);
  }

  return Array.from(buckets.values())
    .map((entry) => ({
      label: entry.label,
      date: entry.date,
      assessmentCount: entry.values.length,
      averageScore: Number((entry.values.reduce((sum, value) => sum + value, 0) / Math.max(entry.values.length, 1)).toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const buildAthleteProgressAlerts = (
  summary: AthleteProgressHistoryPayload['summary'],
  comparisons: AthleteProgressHistoryPayload['comparisons']
): Omit<AthleteProgressAlert, 'alertId' | 'createdAt'>[] => {
  const alerts: Array<Omit<AthleteProgressAlert, 'alertId' | 'createdAt'>> = [];
  const overall30d = getComparisonMetric(comparisons['30d'], 'overall_progress');
  const technical30d = getComparisonMetric(comparisons['30d'], 'technical_score');
  const physical30d = getComparisonMetric(comparisons['30d'], 'physical_score');
  const overall90d = getComparisonMetric(comparisons['90d'], 'overall_progress');

  if (summary.totalSessions >= 4 && summary.attendancePercentage > 0 && summary.attendancePercentage < 75) {
    alerts.push({
      type: 'low-attendance',
      kind: 'alert',
      severity: 'high',
      title: 'Frequência baixa',
      message: `O atleta está com ${summary.attendancePercentage}% de frequência no período monitorado.`,
      isActive: true,
      context: { attendancePercentage: summary.attendancePercentage },
    });
  }

  if (technical30d?.delta !== null && technical30d && technical30d.delta <= -0.5) {
    alerts.push({
      type: 'technical-regression',
      kind: 'alert',
      severity: 'high',
      title: 'Queda técnica recente',
      message: `A métrica técnica caiu ${Math.abs(technical30d.delta)} ponto(s) em relação ao período anterior.`,
      isActive: true,
      context: { delta: technical30d.delta, metric: technical30d.metricCode },
    });
  }

  if (physical30d?.delta !== null && physical30d && physical30d.delta <= -0.5) {
    alerts.push({
      type: 'physical-regression',
      kind: 'alert',
      severity: 'medium',
      title: 'Oscilação física observada',
      message: `O indicador físico apresentou queda de ${Math.abs(physical30d.delta)} ponto(s).`,
      isActive: true,
      context: { delta: physical30d.delta, metric: physical30d.metricCode },
    });
  }

  const daysSinceAssessment = getDaysSince(summary.lastAssessmentDate);
  if (summary.totalAssessments === 0) {
    alerts.push({
      type: 'stale-assessment',
      kind: 'alert',
      severity: 'medium',
      title: 'Sem avaliações registradas',
      message: 'Ainda não há avaliações formais para gerar um acompanhamento mais confiável.',
      isActive: true,
      context: { totalAssessments: 0 },
    });
  } else if (daysSinceAssessment !== null && daysSinceAssessment > 45) {
    alerts.push({
      type: 'stale-assessment',
      kind: 'alert',
      severity: 'medium',
      title: 'Avaliação desatualizada',
      message: `A última avaliação registrada ocorreu há ${daysSinceAssessment} dia(s).`,
      isActive: true,
      context: { daysSinceAssessment },
    });
  }

  if (
    overall90d?.delta !== null
    && overall90d
    && Math.abs(overall90d.delta) < 0.25
    && comparisons['90d'].current.assessmentCount > 0
    && comparisons['90d'].previous.assessmentCount > 0
  ) {
    alerts.push({
      type: 'stagnation',
      kind: 'insight',
      severity: 'low',
      title: 'Progresso estável',
      message: 'O atleta está mantendo desempenho parecido entre os últimos ciclos; vale revisar novos estímulos.',
      isActive: true,
      context: { delta: overall90d.delta },
    });
  }

  if (overall30d?.delta !== null && overall30d && overall30d.delta >= 0.5 && summary.attendancePercentage >= 80) {
    alerts.push({
      type: 'positive-trend',
      kind: 'insight',
      severity: 'low',
      title: 'Boa evolução recente',
      message: 'Há sinal de melhora consistente no período recente, com boa aderência aos treinos.',
      isActive: true,
      context: { delta: overall30d.delta, attendancePercentage: summary.attendancePercentage },
    });
  }

  return Array.from(new Map(alerts.map((alert) => [alert.type, alert])).values());
};

const syncAthleteProgressAlerts = async (
  academyId: string,
  athleteId: string,
  alerts: Array<Omit<AthleteProgressAlert, 'alertId' | 'createdAt'>>
): Promise<AthleteProgressAlert[]> => {
  await pool.query(
    `DELETE FROM athlete_progress_alerts
     WHERE academy_id = $1
       AND athlete_id = $2`,
    [academyId, athleteId]
  );

  if (!alerts.length) {
    return [];
  }

  const persistedAlerts: AthleteProgressAlert[] = [];

  for (const alert of alerts) {
    const insertRes = await pool.query(
      `INSERT INTO athlete_progress_alerts (
         alert_id,
         athlete_id,
         academy_id,
         alert_type,
         alert_kind,
         severity,
         title,
         message,
         context_json,
         is_active,
         created_at,
         updated_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8::jsonb,
         $9,
         NOW(),
         NOW()
       )
       RETURNING alert_id, alert_type, alert_kind, severity, title, message, context_json, is_active, created_at`,
      [
        athleteId,
        academyId,
        alert.type,
        alert.kind,
        alert.severity,
        alert.title,
        alert.message,
        JSON.stringify(alert.context || {}),
        alert.isActive ?? true,
      ]
    );

    const row = insertRes.rows[0];
    persistedAlerts.push({
      alertId: String(row.alert_id),
      type: String(row.alert_type),
      kind: String(row.alert_kind) as AthleteProgressAlert['kind'],
      severity: String(row.severity) as AthleteProgressAlert['severity'],
      title: String(row.title),
      message: String(row.message),
      createdAt: new Date(row.created_at).toISOString(),
      isActive: Boolean(row.is_active),
      context: (row.context_json || {}) as Record<string, unknown>,
    });
  }

  return persistedAlerts;
};

const persistAssessmentMetrics = async (
  client: PoolClient,
  input: CreateAthleteAssessmentInput,
  assessmentId: string
): Promise<{
  metrics: AthleteAssessmentRecord['metrics'];
  summary: Record<string, { value: number; unit: string; category: AthleteMetricCategory }>;
}> => {
  await ensureDefaultIndicatorConfiguration(input.academyId, client);

  const metrics = [] as AthleteAssessmentRecord['metrics'];
  const summary: Record<string, { value: number; unit: string; category: AthleteMetricCategory }> = {};

  for (const metric of input.metrics) {
    const metricCode = sanitizeMetricCode(metric.metricCode || metric.metricName);
    const groupCode = inferGroupCodeForMetric(metric);
    const valueType = inferMetricValueType(metric);
    const displayValue = buildMetricDisplayValue(metric);
    const secondaryValue = metric.secondaryValue !== undefined ? Number(metric.secondaryValue) : null;
    const structuredValue: AthleteStructuredValue | undefined = metric.structuredValue ?? (
      metric.secondaryValue !== undefined
        ? {
            primaryValue: Number(metric.value),
            secondaryValue: Number(metric.secondaryValue),
          }
        : undefined
    );

    const groupRes = await client.query(
      `INSERT INTO athlete_progress_indicator_groups (
         academy_id,
         group_code,
         group_name,
         description,
         display_order,
         is_active
       ) VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (academy_id, group_code)
       DO UPDATE SET
         group_name = EXCLUDED.group_name,
         description = COALESCE(athlete_progress_indicator_groups.description, EXCLUDED.description),
         updated_at = NOW(),
         deleted_at = NULL
       RETURNING group_id`,
      [input.academyId, groupCode, metric.groupCode ?? groupCode, null, metric.displayOrder ?? 0]
    );

    const groupId = String(groupRes.rows[0].group_id);

    const definitionRes = await client.query(
      `INSERT INTO athlete_progress_metric_definitions (
         metric_definition_id,
         academy_id,
         metric_code,
         metric_name,
         metric_category,
         unit,
         source,
         group_id,
         group_code,
         description,
         input_instruction,
         value_type,
         display_format,
         allow_period_aggregation,
         display_order,
         is_active,
         created_at,
         updated_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5,
         'manual',
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12,
         $13,
         true,
         NOW(),
         NOW()
       )
       ON CONFLICT (academy_id, metric_code)
       DO UPDATE SET
         metric_name = EXCLUDED.metric_name,
         metric_category = EXCLUDED.metric_category,
         unit = EXCLUDED.unit,
         group_id = EXCLUDED.group_id,
         group_code = EXCLUDED.group_code,
         description = COALESCE(EXCLUDED.description, athlete_progress_metric_definitions.description),
         input_instruction = COALESCE(EXCLUDED.input_instruction, athlete_progress_metric_definitions.input_instruction),
         value_type = EXCLUDED.value_type,
         display_format = EXCLUDED.display_format,
         allow_period_aggregation = EXCLUDED.allow_period_aggregation,
         display_order = EXCLUDED.display_order,
         is_active = true,
         updated_at = NOW(),
         deleted_at = NULL
       RETURNING metric_definition_id, metric_name, metric_category, unit, group_code, description, input_instruction, value_type, display_format, allow_period_aggregation, display_order`,
      [
        input.academyId,
        metricCode,
        metric.metricName,
        metric.category,
        metric.unit,
        groupId,
        groupCode,
        metric.description ?? null,
        metric.inputInstruction ?? null,
        valueType,
        metric.displayFormat ?? (valueType === 'structured' ? 'ratio' : metric.unit),
        metric.allowPeriodAggregation !== false,
        metric.displayOrder ?? 0,
      ]
    );

    const definition = definitionRes.rows[0];

    await client.query(
      `INSERT INTO athlete_metric_values (
         metric_value_id,
         assessment_id,
         metric_definition_id,
         athlete_id,
         academy_id,
         metric_code,
         metric_category,
         metric_value,
         metric_unit,
         metric_display_value,
         secondary_value,
         structured_value_json,
         recorded_at,
         created_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12,
         NOW()
       )`,
      [
        assessmentId,
        definition.metric_definition_id,
        input.athleteId,
        input.academyId,
        metricCode,
        metric.category,
        metric.value,
        metric.unit,
        displayValue ?? null,
        secondaryValue,
        structuredValue ?? {},
        input.assessmentDate,
      ]
    );

    const normalizedMetric: AthleteMetricInput = {
      metricCode,
      metricName: String(definition.metric_name),
      category: String(definition.metric_category) as AthleteMetricCategory,
      value: Number(metric.value),
      unit: String(definition.unit),
      groupCode: definition.group_code ? String(definition.group_code) : groupCode,
      description: definition.description ? String(definition.description) : metric.description,
      inputInstruction: definition.input_instruction ? String(definition.input_instruction) : metric.inputInstruction,
      valueType: String(definition.value_type ?? valueType) as AthleteMetricValueType,
      displayFormat: String(definition.display_format ?? metric.displayFormat ?? metric.unit),
      allowPeriodAggregation: Boolean(definition.allow_period_aggregation),
      displayOrder: Number(definition.display_order ?? metric.displayOrder ?? 0),
      displayValue: displayValue,
      secondaryValue: secondaryValue === null ? undefined : secondaryValue,
      structuredValue,
    };

    metrics.push(normalizedMetric);
    summary[metricCode] = {
      value: normalizedMetric.value,
      unit: normalizedMetric.unit,
      category: normalizedMetric.category,
    };
  }

  return { metrics, summary };
};

export const createAthleteAssessment = async (
  input: CreateAthleteAssessmentInput
): Promise<AthleteAssessmentRecord | null> => {
  await ensureAthleteProgressSchema();

  const athleteScope = await getAthleteScope(input.academyId, input.athleteId);
  if (!athleteScope) {
    return null;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO athlete_progress_profiles (profile_id, athlete_id, academy_id, last_assessment_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       ON CONFLICT (athlete_id, academy_id)
       DO UPDATE SET last_assessment_at = EXCLUDED.last_assessment_at, updated_at = NOW()`,
      [input.athleteId, input.academyId, input.assessmentDate]
    );

    await client.query(
      `INSERT INTO student_progress (progress_id, student_id, academy_id, last_updated_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT (student_id, academy_id)
       DO UPDATE SET last_updated_at = NOW()`,
      [input.athleteId, input.academyId]
    );

    const assessmentRes = await client.query(
      `INSERT INTO athlete_assessments (
         assessment_id,
         athlete_id,
         academy_id,
         recorded_by_user_id,
         assessment_date,
         notes,
         source,
         created_at,
         updated_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         NOW(),
         NOW()
       ) RETURNING assessment_id, created_at`,
      [
        input.athleteId,
        input.academyId,
        input.recordedByUserId,
        input.assessmentDate,
        input.notes || null,
        input.source || 'manual',
      ]
    );

    const assessmentId = String(assessmentRes.rows[0].assessment_id);
    const createdAt = new Date(assessmentRes.rows[0].created_at).toISOString();

    const { metrics, summary } = await persistAssessmentMetrics(client, input, assessmentId);

    await client.query(
      `INSERT INTO athlete_progress_snapshots (
         snapshot_id,
         athlete_id,
         assessment_id,
         academy_id,
         snapshot_date,
         summary_json,
         created_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5::jsonb,
         NOW()
       )`,
      [input.athleteId, assessmentId, input.academyId, input.assessmentDate, JSON.stringify(summary)]
    );

    await client.query('COMMIT');

    return {
      assessmentId,
      athleteId: input.athleteId,
      assessmentDate: input.assessmentDate,
      notes: input.notes || undefined,
      source: input.source || 'manual',
      recordedByUserId: input.recordedByUserId,
      createdAt,
      metrics,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateAthleteAssessment = async (
  assessmentId: string,
  input: CreateAthleteAssessmentInput
): Promise<AthleteAssessmentRecord | null> => {
  await ensureAthleteProgressSchema();

  const athleteScope = await getAthleteScope(input.academyId, input.athleteId);
  if (!athleteScope) {
    return null;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingRes = await client.query(
      `SELECT assessment_id, created_at
       FROM athlete_assessments
       WHERE assessment_id = $1
         AND athlete_id = $2
         AND academy_id = $3
         AND deleted_at IS NULL
       LIMIT 1`,
      [assessmentId, input.athleteId, input.academyId]
    );

    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE athlete_progress_profiles
       SET last_assessment_at = $3,
           updated_at = NOW()
       WHERE athlete_id = $1
         AND academy_id = $2`,
      [input.athleteId, input.academyId, input.assessmentDate]
    );

    await client.query(
      `UPDATE athlete_assessments
       SET assessment_date = $4,
           notes = $5,
           recorded_by_user_id = $6,
           updated_at = NOW()
       WHERE assessment_id = $1
         AND athlete_id = $2
         AND academy_id = $3`,
      [assessmentId, input.athleteId, input.academyId, input.assessmentDate, input.notes || null, input.recordedByUserId]
    );

    await client.query(
      `DELETE FROM athlete_metric_values
       WHERE assessment_id = $1
         AND academy_id = $2`,
      [assessmentId, input.academyId]
    );

    const { metrics, summary } = await persistAssessmentMetrics(client, input, assessmentId);

    await client.query(
      `DELETE FROM athlete_progress_snapshots
       WHERE assessment_id = $1
         AND academy_id = $2`,
      [assessmentId, input.academyId]
    );

    await client.query(
      `INSERT INTO athlete_progress_snapshots (
         snapshot_id,
         athlete_id,
         assessment_id,
         academy_id,
         snapshot_date,
         summary_json,
         created_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         $3,
         $4,
         $5::jsonb,
         NOW()
       )`,
      [input.athleteId, assessmentId, input.academyId, input.assessmentDate, JSON.stringify(summary)]
    );

    await client.query('COMMIT');

    return {
      assessmentId,
      athleteId: input.athleteId,
      assessmentDate: input.assessmentDate,
      notes: input.notes || undefined,
      source: input.source || 'manual',
      recordedByUserId: input.recordedByUserId,
      createdAt: new Date(existingRes.rows[0].created_at).toISOString(),
      metrics,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAthleteProgressHistory = async (
  academyId: string,
  athleteId: string,
  options?: AthleteProgressQueryOptions
): Promise<AthleteProgressHistoryPayload | null> => {
  await ensureAthleteProgressSchema();

  const athleteScope = await getAthleteScope(academyId, athleteId);
  if (!athleteScope) {
    return null;
  }

  const [summaryRes, assessmentRes, indicatorGroups] = await Promise.all([
    pool.query(
      `SELECT total_sessions, total_attendance, total_attendance_percentage, streak_current, streak_longest, last_updated_at
       FROM student_progress
       WHERE academy_id = $1
         AND student_id = $2
       LIMIT 1`,
      [academyId, athleteId]
    ),
    pool.query(
      `SELECT
         a.assessment_id,
         a.assessment_date,
         a.notes,
         a.source,
         a.recorded_by_user_id,
         a.created_at,
         recorder.full_name AS recorded_by_name,
         mv.metric_code,
         COALESCE(md.metric_name, mv.metric_code) AS metric_name,
         COALESCE(mv.metric_category, md.metric_category) AS metric_category,
         mv.metric_value,
         COALESCE(mv.metric_unit, md.unit, 'score') AS metric_unit,
         md.group_code,
         md.description,
         md.input_instruction,
         md.value_type,
         md.display_format,
         md.allow_period_aggregation,
         md.display_order,
         mv.metric_display_value,
         mv.secondary_value,
         mv.structured_value_json
       FROM athlete_assessments a
       LEFT JOIN users recorder
         ON recorder.user_id = a.recorded_by_user_id
        AND recorder.academy_id = a.academy_id
       LEFT JOIN athlete_metric_values mv
         ON mv.assessment_id = a.assessment_id
        AND mv.deleted_at IS NULL
       LEFT JOIN athlete_progress_metric_definitions md
         ON md.metric_definition_id = mv.metric_definition_id
        AND md.deleted_at IS NULL
       WHERE a.academy_id = $1
         AND a.athlete_id = $2
         AND a.deleted_at IS NULL
       ORDER BY a.assessment_date DESC, a.created_at DESC`,
      [academyId, athleteId]
    ),
    listAthleteIndicatorConfiguration(academyId),
  ]);

  const assessmentMap = new Map<string, AthleteAssessmentRecord>();

  for (const row of assessmentRes.rows) {
    const assessmentId = String(row.assessment_id);
    if (!assessmentMap.has(assessmentId)) {
      assessmentMap.set(assessmentId, {
        assessmentId,
        athleteId,
        assessmentDate: new Date(row.assessment_date).toISOString().slice(0, 10),
        notes: row.notes ? String(row.notes) : undefined,
        source: String(row.source || 'manual') as 'manual' | 'system',
        recordedByUserId: row.recorded_by_user_id ? String(row.recorded_by_user_id) : undefined,
        recordedByName: row.recorded_by_name ? String(row.recorded_by_name) : undefined,
        createdAt: new Date(row.created_at).toISOString(),
        metrics: [],
      });
    }

    if (row.metric_code) {
      const structuredValue = row.structured_value_json && Object.keys(row.structured_value_json).length
        ? (row.structured_value_json as AthleteStructuredValue)
        : undefined;

      assessmentMap.get(assessmentId)?.metrics.push({
        metricCode: String(row.metric_code),
        metricName: String(row.metric_name || row.metric_code),
        category: String(row.metric_category || 'training') as AthleteMetricCategory,
        value: Number(row.metric_value || 0),
        unit: String(row.metric_unit || 'score'),
        groupCode: row.group_code ? String(row.group_code) : inferGroupCodeForMetric({
          metricCode: String(row.metric_code),
          category: String(row.metric_category || 'training') as AthleteMetricCategory,
        }),
        description: row.description ? String(row.description) : undefined,
        inputInstruction: row.input_instruction ? String(row.input_instruction) : undefined,
        valueType: String(row.value_type || inferMetricValueType({ unit: String(row.metric_unit || 'score') })) as AthleteMetricValueType,
        displayFormat: String(row.display_format || row.metric_unit || 'score'),
        allowPeriodAggregation: row.allow_period_aggregation === null || row.allow_period_aggregation === undefined
          ? true
          : Boolean(row.allow_period_aggregation),
        displayOrder: Number(row.display_order || 0),
        displayValue: row.metric_display_value ? String(row.metric_display_value) : buildMetricDisplayValue({
          value: Number(row.metric_value || 0),
          secondaryValue: row.secondary_value !== null && row.secondary_value !== undefined
            ? Number(row.secondary_value)
            : undefined,
        }),
        secondaryValue: row.secondary_value !== null && row.secondary_value !== undefined
          ? Number(row.secondary_value)
          : undefined,
        structuredValue,
      });
    }
  }

  const summaryRow = summaryRes.rows[0] || {};
  const assessments = Array.from(assessmentMap.values());
  const chronologicalAssessments = [...assessments].sort(
    (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
  );
  const { filtered: filteredAssessments, range } = filterAssessmentsByOptions(assessments, options);

  const normalizedLimit = typeof options?.limit === 'number'
    ? Math.max(1, Math.min(100, options.limit))
    : filteredAssessments.length;
  const normalizedOffset = typeof options?.offset === 'number'
    ? Math.max(0, options.offset)
    : 0;

  const paginatedAssessments = typeof options?.limit === 'number'
    ? filteredAssessments.slice(normalizedOffset, normalizedOffset + normalizedLimit)
    : filteredAssessments;

  const comparisons = {
    '30d': buildRollingComparison(chronologicalAssessments, 30, 'Últimos 30 dias', '30 dias anteriores'),
    '90d': buildRollingComparison(chronologicalAssessments, 90, 'Últimos 90 dias', '90 dias anteriores'),
    all: buildHistoricalComparison(chronologicalAssessments),
  };

  const latestAssessment = filteredAssessments[0] || assessments[0] || null;
  const summary = {
    totalSessions: Number(summaryRow.total_sessions || 0),
    totalAttendance: Number(summaryRow.total_attendance || 0),
    attendancePercentage: Number(summaryRow.total_attendance_percentage || 0),
    streakCurrent: Number(summaryRow.streak_current || 0),
    streakLongest: Number(summaryRow.streak_longest || 0),
    totalAssessments: filteredAssessments.length,
    lastAssessmentDate: latestAssessment?.assessmentDate || null,
    lastUpdatedAt: summaryRow.last_updated_at
      ? new Date(summaryRow.last_updated_at).toISOString()
      : undefined,
    latestMetrics: buildLatestMetrics(latestAssessment),
    trendStatus: resolveTrendStatus(comparisons),
  };

  const alerts = await syncAthleteProgressAlerts(
    academyId,
    athleteId,
    buildAthleteProgressAlerts(summary, comparisons)
  );

  return {
    athleteId,
    athleteName: athleteScope.athleteName,
    summary,
    assessments: paginatedAssessments,
    comparisons,
    alerts,
    indicatorGroups,
    pagination: {
      total: filteredAssessments.length,
      limit: normalizedLimit,
      offset: normalizedOffset,
      hasMore: normalizedOffset + paginatedAssessments.length < filteredAssessments.length,
    },
    groupedSeries: buildGroupedSeries(filteredAssessments, options?.groupBy || 'month'),
    range,
  };
};
