/**
 * AICTE VerifyAI — Safe Data Normalization Utilities
 * Section 6: Comparison Rules & Data Normalization
 */

export interface NormalizedValue {
  raw: string;
  normalized: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'PROGRAMME' | 'ADDRESS';
}

/**
 * Standardize whitespace and punctuation without losing semantic meaning
 */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/[“”"]/g, '"')
    .replace(/[‘’']/g, "'");
}

/**
 * Safe casing and whitespace normalization for identity matching
 */
export function normalizeKey(value: string | null | undefined): string {
  if (!value) return '';
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim();
}

/**
 * Standardize dates into ISO YYYY-MM-DD strings
 */
export function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = normalizeText(value);

  // Common Indian formats: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const dmyMatch = cleaned.match(/\b(0?[1-9]|[12][0-9]|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|19\d{2})\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // ISO formats: YYYY-MM-DD, YYYY/MM/DD
  const ymdMatch = cleaned.match(/\b(20\d{2}|19\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12][0-9]|3[01])\b/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return cleaned.toUpperCase();
}

/**
 * Standardize numerical figures (e.g. seat counts, land area)
 */
export function normalizeNumber(value: string | null | undefined): { number: number | null; unit: string | null } {
  if (!value) return { number: null, unit: null };
  const cleaned = normalizeText(value).replace(/,/g, '');
  const match = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z\s]*)$/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2].trim().toUpperCase() || null;
    return { number: isNaN(num) ? null : num, unit };
  }
  return { number: null, unit: null };
}

/**
 * Programme canonical mappings for AICTE standard technical courses
 */
const PROGRAMME_CANONICAL_MAP: Record<string, string> = {
  'COMPUTER SCIENCE & ENGINEERING': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'COMPUTER SCIENCE AND ENGINEERING': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'CSE': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'COMPUTER SCIENCE': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'B.TECH CSE': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'B.TECH. CSE': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'B.TECH COMPUTER SCIENCE & ENGINEERING': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'B.TECH. COMPUTER SCIENCE AND ENGINEERING': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',
  'B.E. COMPUTER SCIENCE & ENGINEERING': 'B.TECH - COMPUTER SCIENCE & ENGINEERING',

  'ARTIFICIAL INTELLIGENCE & DATA SCIENCE': 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
  'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE': 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
  'AI & DS': 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
  'AI AND DS': 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
  'B.TECH AI & DS': 'B.TECH - ARTIFICIAL INTELLIGENCE & DATA SCIENCE',

  'MECHANICAL ENGINEERING': 'B.TECH - MECHANICAL ENGINEERING',
  'B.TECH MECHANICAL ENGINEERING': 'B.TECH - MECHANICAL ENGINEERING',
  'B.TECH. MECHANICAL ENGINEERING': 'B.TECH - MECHANICAL ENGINEERING',
  'B.E. MECHANICAL ENGINEERING': 'B.TECH - MECHANICAL ENGINEERING',

  'CIVIL ENGINEERING': 'B.TECH - CIVIL ENGINEERING',
  'B.TECH CIVIL ENGINEERING': 'B.TECH - CIVIL ENGINEERING',
  'B.E. CIVIL ENGINEERING': 'B.TECH - CIVIL ENGINEERING',

  'ELECTRONICS & COMMUNICATION ENGINEERING': 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',
  'ELECTRONICS AND COMMUNICATION ENGINEERING': 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',
  'ECE': 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',
  'B.TECH ECE': 'B.TECH - ELECTRONICS & COMMUNICATION ENGINEERING',

  'ELECTRICAL & ELECTRONICS ENGINEERING': 'B.TECH - ELECTRICAL & ELECTRONICS ENGINEERING',
  'ELECTRICAL AND ELECTRONICS ENGINEERING': 'B.TECH - ELECTRICAL & ELECTRONICS ENGINEERING',
  'EEE': 'B.TECH - ELECTRICAL & ELECTRONICS ENGINEERING',

  'INFORMATION TECHNOLOGY': 'B.TECH - INFORMATION TECHNOLOGY',
  'B.TECH INFORMATION TECHNOLOGY': 'B.TECH - INFORMATION TECHNOLOGY',
  'IT': 'B.TECH - INFORMATION TECHNOLOGY',

  'MASTER OF BUSINESS ADMINISTRATION': 'MBA - MASTER OF BUSINESS ADMINISTRATION',
  'MBA': 'MBA - MASTER OF BUSINESS ADMINISTRATION',
  'POST GRADUATE DIPLOMA IN MANAGEMENT': 'PGDM - MANAGEMENT',
  'PGDM': 'PGDM - MANAGEMENT',

  'MASTER OF COMPUTER APPLICATIONS': 'MCA - MASTER OF COMPUTER APPLICATIONS',
  'MCA': 'MCA - MASTER OF COMPUTER APPLICATIONS',
};

/**
 * Standardize technical course and programme titles
 */
export function normalizeProgrammeName(name: string | null | undefined): string {
  if (!name) return '';
  const cleaned = normalizeText(name)
    .toUpperCase()
    .replace(/B\.TECH\./g, 'B.TECH')
    .replace(/B\.E\./g, 'B.E')
    .replace(/M\.TECH\./g, 'M.TECH')
    .replace(/\s+/g, ' ')
    .trim();

  // Check direct map
  if (PROGRAMME_CANONICAL_MAP[cleaned]) {
    return PROGRAMME_CANONICAL_MAP[cleaned];
  }

  // Strip prefixes like "UG - ", "1st Shift - "
  const stripped = cleaned
    .replace(/^(UG|PG|DIPLOMA|UNDER GRADUATE|POST GRADUATE)\s*[-:]?\s*/i, '')
    .trim();

  if (PROGRAMME_CANONICAL_MAP[stripped]) {
    return PROGRAMME_CANONICAL_MAP[stripped];
  }

  return cleaned;
}

/**
 * Standardize address for comparison
 */
export function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  return normalizeText(addr)
    .toUpperCase()
    .replace(/\bPLOT\s+NO\.?\s*/g, 'PLOT ')
    .replace(/\bSECTOR\s+NO\.?\s*/g, 'SECTOR ')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bMAHARASHTRA\b/g, 'MH')
    .replace(/\bKARNATAKA\b/g, 'KA')
    .replace(/\bTAMIL\s+NADU\b/g, 'TN')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
