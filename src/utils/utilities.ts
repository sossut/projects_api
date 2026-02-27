import Fuse from 'fuse.js';
import { getAllMetroAreas } from '../api/models/metroAreaModel';

/**
 * Find metro area ID by fuzzy matching normalized name.
 * Returns metro area ID or null if not found.
 */
import CustomError from '../classes/CustomError';
import { getAllDevelopers } from '../api/models/developerModel';
import { getAllConsultants } from '../api/models/consultantModel';
import { getAllArchitects } from '../api/models/architectModel';
import { getAllContractors } from '../api/models/contractorModel';
import { getProjectKeys } from '../api/models/projectModel';
/**
 * Normalize metro area names for robust matching.
 * Removes common suffixes/prefixes and lowercases/trims.
 * Example: "Greater Toronto Area (GTA)" → "toronto"
 */
const normalizeMetroAreaName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/(metropolitan area|region|greater|area|\(.*\))/gi, '')
    .replace(/[.,]/g, '')
    .trim();
};

interface ProjectKeyMatch {
  id: number;
  score: number;
}

const findProjectIdByKey = async (
  key: string
): Promise<ProjectKeyMatch | null> => {
  const projects = await getProjectKeys();
  const fuse = new Fuse(projects, {
    keys: ['projectKey'],
    threshold: 0.3,
    includeScore: true
  });
  const result = fuse.search(key);
  result.forEach((r) => {
    console.log('score:', r.score, 'projectKey:', r.item.projectKey);
  });
  console.log('result KEY:', result);
  console.log('KEY: ', key);
  if (result.length && result[0].item.id !== undefined) {
    return {
      id: result[0].item.id,
      score: result[0].score ?? 0
    };
  }
  return null;
};

const findMetroAreaIdByName = async (
  inputName: string
): Promise<number | null> => {
  const metroAreas = await getAllMetroAreas(); // [{ id, name }]
  const fuse = new Fuse(
    metroAreas.map((ma) => ({
      ...ma,
      normalized: normalizeMetroAreaName(ma.name)
    })),
    { keys: ['normalized'], threshold: 0.3, includeScore: true }
  );
  const normalizedInput = normalizeMetroAreaName(inputName);
  const result = fuse.search(normalizedInput);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findDeveloperIdByName = async (name: string): Promise<number | null> => {
  const developers = await getAllDevelopers(); // [{ id, name }]
  const fuse = new Fuse(developers, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findContractorIdByName = async (name: string): Promise<number | null> => {
  const contractors = await getAllContractors(); // [{ id, name }]
  const fuse = new Fuse(contractors, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findArchitectIdByName = async (name: string): Promise<number | null> => {
  const architects = await getAllArchitects(); // [{ id, name }]
  const fuse = new Fuse(architects, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findConsultantIdByName = async (name: string): Promise<number | null> => {
  const consultants = await getAllConsultants(); // [{ id, name }]
  const fuse = new Fuse(consultants, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const toSnake = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const snake = k.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
};

const toCamel = (obj: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const camel = k.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
    out[camel] = v;
  }
  return out;
};

const throwIfValidationErrors = (errors: any) => {
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map(
        (error: any) =>
          `${error.path}: ${error.msg}${error.value !== undefined ? ` (received: ${JSON.stringify(error.value)})` : ''}`
      )
      .filter((msg: any) => msg !== undefined)
      .join('; ');

    throw new CustomError(messages, 400);
  }
};

const parseToStandardDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;

  // Just a year (2026)
  if (dateStr.match(/^\d{4}$/)) {
    return `${dateStr}-01-01`;
  } else if (dateStr.match(/^(\d{4}\s?-?Q[1-4]|Q[1-4]\s?-?\d{4})$/i)) {
    // Year with quarter (2026 Q4, 2026-Q4, Q4 2027, Q4-2027)
    const yearMatch = dateStr.match(/\d{4}/);
    const quarterMatch = dateStr.match(/Q[1-4]/i);
    const year = yearMatch?.[0];
    const quarter = quarterMatch?.[0].toUpperCase();
    const quarterMap: { [key: string]: string } = {
      Q1: '01-01',
      Q2: '04-01',
      Q3: '07-01',
      Q4: '10-01'
    };
    return `${year}-${quarterMap[quarter!]}`;
  } else if (dateStr.match(/^\d{4}\s?H[1-2]$/i)) {
    // Year with half (2026 H1, 2026H2)
    const yearMatch = dateStr.match(/\d{4}/);
    const halfMatch = dateStr.match(/H[1-2]/i);
    const year = yearMatch?.[0];
    const half = halfMatch?.[0].toUpperCase();
    const halfMap: { [key: string]: string } = {
      H1: '01-01',
      H2: '07-01'
    };
    return `${year}-${halfMap[half!]}`;
  } else if (dateStr.match(/^[A-Za-z]{3,9}\s+\d{4}$/)) {
    // Month name and year (September 2025, Sep 2025)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
  } else if (dateStr.match(/^\d{4}-\d{2}$/)) {
    // Year-month (2026-04)
    return `${dateStr}-01`;
  } else if (dateStr.match(/^\d{2}-\d{4}$/)) {
    // Month-year (09-2027)
    const [month, year] = dateStr.split('-');
    return `${year}-${month}-01`;
  } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
    // European date format DD-MM-YYYY (01-02-2024)
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    // European date format DD/MM/YYYY (01/02/2024)
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  } else if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    // European date format DD.MM.YYYY (01.02.2024)
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
  } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
    // European date format DD/MM/YY (01/02/24)
    const [day, month, year] = dateStr.split('/');
    const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    return `${fullYear}-${month}-${day}`;
  } else if (dateStr.match(/^\d{2}\.\d{2}\.\d{2}$/)) {
    // European date format DD.MM.YY (01.02.24)
    const [day, month, year] = dateStr.split('.');
    const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    return `${fullYear}-${month}-${day}`;
  } else if (dateStr.match(/^\d{2}\/\d{4}$/)) {
    // Month/Year format (09/2027)
    const [month, year] = dateStr.split('/');
    return `${year}-${month}-01`;
  } else if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
    // ISO-style with slashes YYYY/MM/DD (2024/02/01)
    const [year, month, day] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  } else if (dateStr.match(/^[A-Za-z]{3,9}\/\d{4}$/)) {
    // Month name with slash (Sep/2025, September/2025)
    const [monthName, year] = dateStr.split('/');
    const date = new Date(`${monthName} ${year}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } else if (dateStr.match(/^\d{4}$/)) {
    // Just a year (2025)
    return `${dateStr}-01-01`;
  } else if (dateStr.match(/^\d{4}[-\/]\d{4}$/)) {
    // Handle year range (2026-2027 or 2026/2027)

    // Extract the latest year
    const years = dateStr.split(/[-\/]?/);
    const latestYear = years[1];
    return `${latestYear}-01-01`;
  } else {
    // Full date - validate it's valid
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
  }

  return null;
};

const applyFitersSortingAndOrdering = (query: string, filters: any) => {
  if (filters.sortBy) {
    const sortBy = filters.sortBy;
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
  }
  return query;
};

const applyOrderAndFilters = (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number | string[] }
) => {
  // Whitelist allowed sort fields to prevent SQL injection
  const allowedFields = [
    'id',
    'expected_date',
    'name',
    'budget_eur',
    'status',
    'confidence_score',
    'last_verified_date',
    'building_height_meters',
    'building_height_floors'
  ];
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'id';
  const validOrder = order === 'DESC' ? 'DESC' : 'ASC';
  let whereClause = '';
  const params: any[] = [];
  const conditions: string[] = [];
  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(', ');
        conditions.push(`projects.status IN (${placeholders})`);
        params.push(...filters.status);
      } else {
        conditions.push('projects.status = ?');
        params.push(filters.status);
      }
    }
    if (filters.city) {
      if (Array.isArray(filters.city)) {
        const placeholders = filters.city.map(() => '?').join(', ');
        conditions.push(`cities.name IN (${placeholders})`);
        params.push(...filters.city);
      } else {
        conditions.push('cities.name = ?');
        params.push(filters.city);
      }
    }
    if (filters.metroArea) {
      if (Array.isArray(filters.metroArea)) {
        const placeholders = filters.metroArea.map(() => '?').join(', ');
        conditions.push(`metro_areas.name IN (${placeholders})`);
        params.push(...filters.metroArea);
      } else {
        conditions.push('metro_areas.name = ?');
        params.push(filters.metroArea);
      }
    }
    if (filters.country) {
      if (Array.isArray(filters.country)) {
        const placeholders = filters.country.map(() => '?').join(', ');
        conditions.push(`countries.name IN (${placeholders})`);
        params.push(...filters.country);
      } else {
        conditions.push('countries.name = ?');
        params.push(filters.country);
      }
    }
    if (filters.continent) {
      conditions.push('continents.name = ?');
      params.push(filters.continent);
    }
    if (filters.buildingType) {
      if (Array.isArray(filters.buildingType)) {
        const placeholders = filters.buildingType.map(() => '?').join(', ');
        conditions.push(`building_types.building_type IN (${placeholders})`);
        params.push(...filters.buildingType);
      } else {
        conditions.push('building_types.building_type = ?');
        params.push(filters.buildingType);
      }
    }
    if (filters.minBudget) {
      conditions.push('projects.budget_eur >= ?');
      params.push(filters.minBudget);
    }
    if (filters.maxBudget) {
      conditions.push('projects.budget_eur <= ?');
      params.push(filters.maxBudget);
    }

    if (filters.maxHeightMeters) {
      conditions.push('projects.building_height_meters <= ?');
      params.push(filters.maxHeightMeters);
    }

    if (filters.minHeightMeters) {
      conditions.push('projects.building_height_meters >= ?');
      params.push(filters.minHeightMeters);
    }

    if (filters.confidenceScore) {
      conditions.push('projects.confidence_score = ?');
      params.push(filters.confidenceScore);
    }
    if (filters.isActive !== undefined) {
      conditions.push('projects.is_active = ?');
      params.push(filters.isActive);
    }
    if (filters.buildingUse) {
      if (Array.isArray(filters.buildingUse)) {
        const placeholders = filters.buildingUse.map(() => '?').join(', ');
        conditions.push(`building_uses.building_use IN (${placeholders})`);
        params.push(...filters.buildingUse);
      } else {
        conditions.push('building_uses.building_use = ?');
        params.push(filters.buildingUse);
      }
    }
  }
  // Always exclude completed projects
  conditions.push("projects.status != 'completed'");
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  return {
    whereClause,
    validOrder,
    validSortBy,
    params,
    orderBy: `ORDER BY ${validSortBy} ${validOrder}`
  };
};

export {
  normalizeMetroAreaName,
  findProjectIdByKey,
  findMetroAreaIdByName,
  findDeveloperIdByName,
  findContractorIdByName,
  findArchitectIdByName,
  findConsultantIdByName,
  toSnake,
  toCamel,
  throwIfValidationErrors,
  parseToStandardDate,
  applyFitersSortingAndOrdering,
  applyOrderAndFilters
};
