import { promisePool } from '../../database/db';

import {
  Project,
  GetProject,
  PostProject,
  PutProject
} from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';
import { projectsQueryString } from '../../database/queryStrings';

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
    sourceLinks: JSON.parse(row.sourceLinks as unknown as string)
  }));
};
const queryBase = projectsQueryString;
const getAllProjects = async (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number },
  limit?: number,
  offset?: number
): Promise<Project[]> => {
  // Whitelist allowed sort fields to prevent SQL injection
  console.log(order);
  const allowedFields = [
    'id',
    'expected_date',
    'name',
    'budget_eur',
    'status',
    'confidence_score',
    'last_verified_date'
  ];
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'id';
  const validOrder = order === 'DESC' ? 'DESC' : 'ASC';

  let whereClause = '';
  const params: any[] = [];

  const conditions: string[] = [];
  if (filters) {
    if (filters.status) {
      conditions.push('projects.status = ?');
      params.push(filters.status);
    }
    if (filters.city) {
      conditions.push('cities.name = ?');
      params.push(filters.city);
    }
    if (filters.metroArea) {
      conditions.push('metro_areas.name = ?');
      params.push(filters.metroArea);
    }
    if (filters.country) {
      conditions.push('countries.name = ?');
      params.push(filters.country);
    }
    if (filters.continent) {
      conditions.push('continents.name = ?');
      params.push(filters.continent);
    }
    if (filters.buildingType) {
      conditions.push('building_types.building_type = ?');
      params.push(filters.buildingType);
    }
    if (filters.minBudget) {
      conditions.push('projects.budget_eur >= ?');
      params.push(filters.minBudget);
    }
    if (filters.maxBudget) {
      conditions.push('projects.budget_eur <= ?');
      params.push(filters.maxBudget);
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
      conditions.push('building_uses.building_use = ?');
      params.push(filters.buildingUse);
    }
  }
  // Always exclude completed projects
  conditions.push("projects.status != 'completed'");
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }
  limit = limit ?? 50; // Default limit to 50 if not provided
  offset = offset ?? 0;

  const [rows] = await promisePool.query<GetProject[]>(
    `${queryBase}
    ${whereClause}
    GROUP BY projects.id
    ORDER BY ${validSortBy} ${validOrder}
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return parseProjectRows(rows);
};

const getAllProjectsSimple = async (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number },
  limit?: number,
  offset?: number
): Promise<Project[]> => {
  // Whitelist allowed sort fields to prevent SQL injection
  const allowedFields = [
    'id',
    'expected_date',
    'name',
    'budget_eur',
    'status',
    'confidence_score',
    'last_verified_date'
  ];
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'id';
  const validOrder = order === 'DESC' ? 'DESC' : 'ASC';
  let whereClause = '';
  const params: any[] = [];
  const conditions: string[] = [];
  if (filters) {
    if (filters.status) {
      conditions.push('projects.status = ?');
      params.push(filters.status);
    }
    if (filters.city) {
      conditions.push('cities.name = ?');
      params.push(filters.city);
    }
    if (filters.metroArea) {
      conditions.push('metro_areas.name = ?');
      params.push(filters.metroArea);
    }
    if (filters.country) {
      conditions.push('countries.name = ?');
      params.push(filters.country);
    }
    if (filters.continent) {
      conditions.push('continents.name = ?');
      params.push(filters.continent);
    }
    if (filters.buildingType) {
      conditions.push('building_types.building_type = ?');
      params.push(filters.buildingType);
    }
    if (filters.minBudget) {
      conditions.push('projects.budget_eur >= ?');
      params.push(filters.minBudget);
    }
    if (filters.maxBudget) {
      conditions.push('projects.budget_eur <= ?');
      params.push(filters.maxBudget);
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
      conditions.push('building_uses.building_use = ?');
      params.push(filters.buildingUse);
    }
  }
  // Always exclude completed projects
  conditions.push("projects.status != 'completed'");
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT
    projects.id, projects.name, projects.status,
    projects.expected_date_text AS expectedDateText,
    projects.expected_date AS expectedDate, projects.expected_date_text AS expectedDateText,
    projects.building_height_meters AS buildingHeightMeters,
    projects.building_height_floors AS buildingHeightFloors,
    projects.budget_eur AS budgetEur, projects.glass_facade AS glassFacade,
    projects.facade_basis AS facadeBasis, projects.confidence_score AS confidenceScore,
    projects.last_verified_date AS lastVerifiedDate, projects.is_active AS isActive,
    cities.name AS city, countries.name AS country, metro_areas.name AS metroArea,
    addresses.address AS address,
    building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'url', project_medias.url
      ) ), ']') AS projectMedias
    FROM projects
    JOIN addresses ON projects.address_id = addresses.id
    JOIN cities ON addresses.city_id = cities.id
    JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    JOIN countries ON metro_areas.country_id = countries.id
    JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    ${whereClause}
    GROUP BY projects.id
    ORDER BY ${validSortBy} ${validOrder}`,
    [...params, limit, offset]
  );
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  const projects = rows.map((row) => ({
    ...row,
    buildingUses: JSON.parse(row.buildingUses as unknown as string),
    projectMedias: JSON.parse(row.projectMedias as unknown as string)
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

const checkIfProjectExistsByKey = async (
  projectKey: string
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetProject[]>(
    'SELECT id FROM projects WHERE project_key = ?',
    [projectKey]
  );
  return true ? rows.length > 0 : false;
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
  const sql = promisePool.format('UPDATE projects SET ? WHERE id = ?', [
    toSnake(projectData),
    id
  ]);
  console.log(sql);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
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
  getAllProjectsSimple,
  getProject,
  getProjectNamesByMetroAreaAndBuildingType,
  checkIfProjectExistsByKey,
  postProject,
  putProject,
  deleteProject
};
