export type JewelryDesignRecord = {
  name: string;
  setting_type: string;
  image_url: string | null;
  description: string | null;
  making_charges: Record<string, number>;
  estimated_metal_weight: Record<string, number> | null;
  diamond_charges: Record<string, number>;
  product_scope: 'gemstone' | 'rudraksha';
  rudraksha_category: string | null;
  metal_flags?: Record<string, string>;
  sort_order: number;
  is_active: boolean;
};

function jsonSql(value: Record<string, number> | null | undefined): string {
  if (!value || Object.keys(value).length === 0) return 'NULL';
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function jsonFlagsSql(value: Record<string, string> | null | undefined): string {
  if (!value || Object.keys(value).length === 0) return "'{}'::jsonb";
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

export function formatJewelryDesignUpsert(record: JewelryDesignRecord): string[] {
  const making = jsonSql(record.making_charges) === 'NULL' ? "'{}'::jsonb" : jsonSql(record.making_charges);
  const weights = jsonSql(record.estimated_metal_weight);
  const diamonds = jsonSql(record.diamond_charges) === 'NULL' ? "'{}'::jsonb" : jsonSql(record.diamond_charges);
  const metalFlags = jsonFlagsSql(record.metal_flags);
  const description = record.description ? sqlString(record.description) : 'NULL';
  const imageUrl = record.image_url ? sqlString(record.image_url) : 'NULL';
  const name = sqlString(record.name);
  const settingType = sqlString(record.setting_type);
  const productScope = sqlString(record.product_scope);
  const rudrakshaCategory = record.rudraksha_category
    ? sqlString(record.rudraksha_category)
    : 'NULL';
  const where = `name = ${name} AND setting_type = ${settingType}`;

  return [
    `UPDATE jewelry_designs SET`,
    `  image_url = ${imageUrl},`,
    `  description = ${description},`,
    `  making_charges = ${making},`,
    `  estimated_metal_weight = ${weights},`,
    `  diamond_charges = ${diamonds},`,
    `  product_scope = ${productScope},`,
    `  rudraksha_category = ${rudrakshaCategory},`,
    `  metal_flags = ${metalFlags},`,
    `  sort_order = ${record.sort_order},`,
    `  is_active = ${record.is_active}`,
    `WHERE ${where};`,
    '',
    `INSERT INTO jewelry_designs (name, setting_type, image_url, description, making_charges, estimated_metal_weight, diamond_charges, product_scope, rudraksha_category, metal_flags, sort_order, is_active)`,
    `SELECT ${name}, ${settingType}, ${imageUrl}, ${description}, ${making}, ${weights}, ${diamonds}, ${productScope}, ${rudrakshaCategory}, ${metalFlags}, ${record.sort_order}, ${record.is_active}`,
    `WHERE NOT EXISTS (SELECT 1 FROM jewelry_designs WHERE ${where});`,
    '',
  ];
}

export function formatDeactivateMissingDesigns(args: {
  records: JewelryDesignRecord[];
  settingType?: string;
  namePattern?: string;
  nameLike?: string;
}): string {
  const names = args.records.map((record) => sqlString(record.name)).join(', ');
  const lines = [
    '-- Deactivate migrated designs removed from the source sheet (preserves FK history)',
    'UPDATE jewelry_designs SET is_active = false',
    'WHERE is_active = true',
  ];

  if (args.settingType) {
    lines.push(`  AND setting_type = ${sqlString(args.settingType)}`);
  }
  if (args.namePattern) {
    lines.push(`  AND name ~ ${sqlString(args.namePattern)}`);
  }
  if (args.nameLike) {
    lines.push(`  AND name LIKE ${sqlString(args.nameLike)}`);
  }
  lines.push(`  AND name NOT IN (${names});`, '');

  return lines.join('\n');
}

export function generateJewelrySqlSeed(args: {
  headerLines: string[];
  records: JewelryDesignRecord[];
  deactivate?: {
    settingType?: string;
    namePattern?: string;
    nameLike?: string;
  };
}): string {
  const lines = [
    ...args.headerLines,
    '',
    '-- Upsert by (name, setting_type) so existing product_configurations.design_id rows stay valid.',
    '',
  ];

  for (const record of args.records) {
    lines.push(...formatJewelryDesignUpsert(record));
  }

  if (args.deactivate) {
    lines.push(formatDeactivateMissingDesigns({
      records: args.records,
      ...args.deactivate,
    }));
  }

  return lines.join('\n');
}
