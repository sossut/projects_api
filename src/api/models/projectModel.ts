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
    projectMedias: JSON.parse(row.projectMedias as unknown as string),
    sourceLinks: JSON.parse(row.sourceLinks as unknown as string)
  }));
};
const queryBase = projectsQueryString;
const getAllProjects = async (
  sortBy: string = 'id',
  order: 'ASC' | 'DESC' = 'ASC',
  filters?: { [key: string]: string | number }
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

  if (filters) {
    const conditions: string[] = [];

    if (filters.status) {
      conditions.push('projects.status = ?');
      params.push(filters.status);
    }
    if (filters.city) {
      conditions.push('cities.name = ?');
      params.push(filters.city);
    }
    if (filters.metroArea) {
      conditions.push('search_areas.name = ?');
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
      conditions.push('projects.building_type = ?');
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

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
  }

  const [rows] = await promisePool.query<GetProject[]>(
    `${queryBase}
    ${whereClause}
    GROUP BY projects.id
    ORDER BY ${validSortBy} ${validOrder}`,
    params
  );
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return parseProjectRows(rows);
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
  getProject,
  checkIfProjectExistsByKey,
  postProject,
  putProject,
  deleteProject
};
