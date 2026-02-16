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

const findProjectIdByKey = async (key: string): Promise<number | null> => {
  const projects = await getProjectKeys();
  const fuse = new Fuse(projects, { keys: ['projectKey'], threshold: 0.3 });
  const result = fuse.search(key);
  console.log('result KEY:', result);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
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
    { keys: ['normalized'], threshold: 0.3 }
  );
  const normalizedInput = normalizeMetroAreaName(inputName);
  const result = fuse.search(normalizedInput);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findDeveloperIdByName = async (name: string): Promise<number | null> => {
  const developers = await getAllDevelopers(); // [{ id, name }]
  const fuse = new Fuse(developers, { keys: ['name'], threshold: 0.3 });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findContractorIdByName = async (name: string): Promise<number | null> => {
  const contractors = await getAllContractors(); // [{ id, name }]
  const fuse = new Fuse(contractors, { keys: ['name'], threshold: 0.3 });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findArchitectIdByName = async (name: string): Promise<number | null> => {
  const architects = await getAllArchitects(); // [{ id, name }]
  const fuse = new Fuse(architects, { keys: ['name'], threshold: 0.3 });
  const result = fuse.search(name);
  return result.length && result[0].item.id !== undefined
    ? result[0].item.id
    : null;
};

const findConsultantIdByName = async (name: string): Promise<number | null> => {
  const consultants = await getAllConsultants(); // [{ id, name }]
  const fuse = new Fuse(consultants, { keys: ['name'], threshold: 0.3 });
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
  } else {
    // Full date - validate it's valid
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
  }

  return null;
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
  parseToStandardDate
};
