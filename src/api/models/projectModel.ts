import { promisePool } from '../../database/db';

import {
  Project,
  GetProject,
  PostProject,
  PutProject
} from '../../interfaces/Project';
import { RowDataPacket } from 'mysql2';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake, applyOrderAndFilters } from '../../utils/utilities';
import {
  projectsQueryString,
  simpleProjectsQueryString
} from '../../database/queryStrings';

const allowedProjectStatuses = new Set([
  'planned',
  'approved',
  'proposed',
  'on_hold',
  'under_construction',
  'completed',
  'cancelled',
  'pre_construction'
]);

const normalizeProjectStatus = (status: unknown): string => {
  if (typeof status !== 'string') {
    throw new CustomError('Invalid project status value', 400);
  }

  const normalized = status
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

  const aliases: Record<string, string> = {
    underconstruction: 'under_construction',
    preconstruction: 'pre_construction',
    onhold: 'on_hold'
  };

  const mapped = aliases[normalized] ?? normalized;

  if (!allowedProjectStatuses.has(mapped)) {
    throw new CustomError(
      `Invalid status '${status}'. Allowed values: ${Array.from(allowedProjectStatuses).join(', ')}`,
      400
    );
  }

  return mapped;
};

const parseProjectRows = (rows: GetProject[]): Project[] => {
  return rows.map((row) => ({
    ...row,
    address: JSON.parse(row.address as unknown as string),
    buildingUses: JSON.parse(row.buildingUses as unknown as string),
    projectWebsites: JSON.parse(row.projectWebsites as unknown as string),
    developers: JSON.parse(row.developers as unknown as string),
    architects: JSON.parse(row.architects as unknown as string),
    contractors: JSON.parse(row.contractors as unknown as string),
    consultants: JSON.parse(row.consultants as unknown as string),
    projectMedias: JSON.parse(row.projectMedias as unknown as string),
    sourceLinks: JSON.parse(row.sourceLinks as unknown as string),
    favoritedByUsers: JSON.parse(row.favoritedByUsers as unknown as string)
  }));
};
const queryBase = projectsQueryString;
const simpleQueryBase = simpleProjectsQueryString;
const getAllProjects = async (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number | string[] },
  limit?: number,
  offset?: number
): Promise<Project[]> => {
  // Whitelist allowed sort fields to prevent SQL injection

  const filtered = applyOrderAndFilters(sortBy, order, filters);

  limit = limit ?? 50; // Default limit to 50 if not provided
  offset = offset ?? 0;

  const [rows] = await promisePool.query<GetProject[]>(
    `${queryBase}
    ${filtered.whereClause}
    GROUP BY projects.id
    ORDER BY ${filtered.validSortBy} ${filtered.validOrder}
    LIMIT ? OFFSET ?`,
    [...filtered.params, limit, offset]
  );

  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return parseProjectRows(rows);
};

const getProjectsForBatchEnrichment = async (
  metroAreaIds: number[]
): Promise<Project[]> => {
  if (metroAreaIds.length === 0) {
    throw new CustomError('No metro area IDs provided', 400);
  }

  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.id, projects.name, projects.status
    FROM projects
    JOIN metro_areas ON projects.metro_area_id = metro_areas.id
    WHERE metro_areas.id IN (${metroAreaIds.map(() => '?').join(', ')})
    AND projects.status != 'completed'
    `,
    metroAreaIds
  );

  return parseProjectRows(rows);
};

const getProjectCount = async (filters?: {
  [key: string]: string | number | string[];
}): Promise<number> => {
  const filtered = applyOrderAndFilters('projects.id', 'ASC', filters);

  const sql = promisePool.format(
    `SELECT COUNT(DISTINCT projects.id) AS count FROM projects
    JOIN addresses ON projects.address_id = addresses.id
    JOIN cities ON addresses.city_id = cities.id
    JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    JOIN countries ON metro_areas.country_id = countries.id
    JOIN continents ON countries.continent_id = continents.id
    JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    ${filtered.whereClause}`,
    filtered.params
  );

  const [rows] = await promisePool.query<RowDataPacket[]>(sql);
  return rows[0].count as number;
};

const getProjectKeys = async (): Promise<Project[]> => {
  const [rows] = await promisePool.query<GetProject[]>(
    'SELECT id, project_key AS projectKey FROM projects'
  );
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return rows;
};

const getAllProjectsSimple = async (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number | string[] },
  limit?: number,
  offset?: number
): Promise<Project[]> => {
  limit = limit ?? 100; // Default limit to 100 if not provided
  offset = offset ?? 0;

  const filtered = applyOrderAndFilters(sortBy, order, filters);

  const sql = promisePool.format(
    `${simpleQueryBase}
    ${filtered.whereClause}
    GROUP BY projects.id
    ORDER BY ${filtered.validSortBy} ${filtered.validOrder}
    LIMIT ? OFFSET ?`,
    [...filtered.params, limit, offset]
  );
  console.log(sql);

  const [rows] = await promisePool.query<GetProject[]>(sql);
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  const projects = rows.map((row) => ({
    ...row,
    buildingUses: JSON.parse(row.buildingUses as unknown as string),
    media: JSON.parse(row.media as unknown as string),
    favoritedByUsers: JSON.parse(row.favoritedByUsers as unknown as string)
  }));
  return projects;
};

const getProjectSimple = async (id: number): Promise<Project> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `${simpleQueryBase}
    WHERE projects.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Project with id ${id} not found`, 404);
  }
  const projects = {
    ...rows[0],
    buildingUses: JSON.parse(rows[0].buildingUses as unknown as string),
    media: JSON.parse(rows[0].media as unknown as string),
    favoritedByUsers: JSON.parse(rows[0].favoritedByUsers as unknown as string)
  };
  return projects;
};

const getProjectsBySearchTerm = async (
  searchTerm: string
): Promise<Project[]> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `${simpleQueryBase}
    WHERE CONCAT_WS(' ', projects.name, building_uses.building_use, building_types.building_type, cities.name, metro_areas.name, countries.name) LIKE ?
    GROUP BY projects.id`,
    [`%${searchTerm}%`]
  );
  if (rows.length === 0) {
    throw new CustomError(`Project with name ${searchTerm} not found`, 404);
  }
  const projects = rows.map((row) => ({
    ...row,
    buildingUses: JSON.parse(row.buildingUses as unknown as string),
    media: JSON.parse(row.media as unknown as string),
    favoritedByUsers: JSON.parse(row.favoritedByUsers as unknown as string)
  }));
  return projects;
};

const getProject = async (id: number): Promise<Project> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `${queryBase}
    WHERE projects.id = ?
    GROUP BY projects.id`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Project with id ${id} not found`, 404);
  }
  return parseProjectRows(rows)[0];
};

const getProjectNamesByMetroAreaAndBuildingType = async (
  metroAreaId: number,
  buildingTypeId: number
): Promise<string[]> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.name
    FROM projects
    JOIN addresses ON projects.address_id = addresses.id
    JOIN cities ON addresses.city_id = cities.id
    JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    JOIN building_types ON projects.building_type_id = building_types.id
    WHERE metro_areas.id = ?
    AND building_types.id = ?`,
    [metroAreaId, buildingTypeId]
  );
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row) => row.name);
};

const getStatuses = async (): Promise<string[]> => {
  const [rows] = await promisePool.query<RowDataPacket[]>(
    'SELECT DISTINCT status FROM projects'
  );
  return (rows as { status: string }[]).map((row) => row.status);
};

const checkIfProjectExistsByKey = async (
  projectKey: string
): Promise<number> => {
  const [rows] = await promisePool.query<GetProject[]>(
    'SELECT id FROM projects WHERE project_key = ?',
    [projectKey]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postProject = async (projectData: PostProject): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO projects
    (name, address_id, expected_date_text, earliest_date_text, latest_date_text, expected_date, building_height_meters,
    building_height_floors, building_type_id, budget_eur, glass_facade,
    facade_basis, status, last_verified_date, confidence_score, is_active, project_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectData.name,
      projectData.addressId,
      projectData.expectedDateText ?? null,
      projectData.earliestDateText ?? null,
      projectData.latestDateText ?? null,
      projectData.expectedDate ?? null,
      projectData.buildingHeightMeters ?? null,
      projectData.buildingHeightFloors ?? null,
      projectData.buildingTypeId ?? null,
      projectData.budgetEur ?? null,
      projectData.glassFacade ?? null,
      projectData.facadeBasis ?? null,
      projectData.status ?? null,
      projectData.lastVerifiedDate ?? null,
      projectData.confidenceScore ?? null,
      projectData.isActive ?? null,
      projectData.projectKey ?? null
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project', 500);
  }
  return headers.insertId;
};
const putProject = async (
  projectData: PutProject,
  id: number
): Promise<boolean> => {
  const updateData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(projectData)) {
    if (value === undefined) {
      continue;
    }
    updateData[key] = value;
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
    const incomingStatus = updateData.status;
    if (
      incomingStatus === null ||
      incomingStatus === undefined ||
      incomingStatus === ''
    ) {
      updateData.status = null;
    } else {
      updateData.status = normalizeProjectStatus(incomingStatus);
    }
  }

  const sql = promisePool.format('UPDATE projects SET ? WHERE id = ?', [
    toSnake(updateData),
    id
  ]);

  let headers: ResultSetHeader;
  try {
    const [result] = await promisePool.query<ResultSetHeader>(sql);
    headers = result;
  } catch (error: any) {
    if (
      error?.code === 'WARN_DATA_TRUNCATED' ||
      error?.errno === 1265 ||
      error?.message?.includes("Data truncated for column 'status'")
    ) {
      throw new CustomError('Invalid value for project status', 400);
    }
    throw error;
  }

  if (headers.affectedRows === 0) {
    throw new CustomError(`Project with id ${id} not found`, 404);
  }
  return true;
};

const deleteProject = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM projects WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Project with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjects,
  getProjectKeys,
  getProjectsForBatchEnrichment,
  getProjectCount,
  getAllProjectsSimple,
  getProjectSimple,
  getProjectsBySearchTerm,
  getProject,
  getStatuses,
  getProjectNamesByMetroAreaAndBuildingType,
  checkIfProjectExistsByKey,
  postProject,
  putProject,
  deleteProject
};
