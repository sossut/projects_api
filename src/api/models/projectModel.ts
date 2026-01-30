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

const getAllProjects = async (): Promise<Project[]> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.id, projects.name,
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postalCode', addresses.postcode,
      'location', JSON_OBJECT(
        'latitude', ST_Y(addresses.location),
        'longitude', ST_X(addresses.location)
      ),
      'city', JSON_OBJECT(
        'id', cities.id,
        'name', cities.name,
        'metroAreaId', cities.metro_area_id
      ),
      'country', JSON_OBJECT(
        'id', countries.id,
        'name', countries.name,
        'code', countries.code
      ),
      'metroArea', JSON_OBJECT(
        'id', metro_areas.id,
        'name', metro_areas.name,
        'countryId', metro_areas.country_id
      )
    ) AS address,
     building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    address_id AS addressId, expected_date_text AS expectedDateText,
    earliest_date_text AS earliestDateText, latest_date_text AS latestDateText, building_height_meters AS buildingHeightMeters,
    building_height_floors AS buildingHeightFloors, building_type_id AS buildingTypeId,
    budget_eur AS budgetEur, glass_facade AS glassFacade, facade_basis AS facadeBasis,
    status, last_verified_date AS lastVerifiedDate, confidence_score AS confidenceScore,
    is_active AS isActive, project_key AS projectKey,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_websites.id,
        'url', project_websites.url
      )
    ), ']') AS projectWebsites,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', developers.id,
      'name', developers.name
          )
        ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', architects.id,
      'name', architects.name
          )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', contractors.id,
      'name', contractors.name
          )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'mediaType', project_medias.media_type,
        'url', project_medias.url,
        'title', project_medias.title,
        'filename', project_medias.filename
      )
    ), ']') AS projectMedias,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', source_links.id,
        'url', source_links.url,
        'sourceType', source_links.source_type,
        'publisher', source_links.publisher,
        'accessedAt', source_links.accessed_at
      )
    ), ']') AS sourceLinks
    FROM projects
    LEFT JOIN project_websites ON projects.id = project_websites.project_id
    LEFT JOIN addresses ON projects.address_id = addresses.id
    LEFT JOIN cities ON addresses.city_id = cities.id
    LEFT JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    LEFT JOIN countries ON metro_areas.country_id = countries.id
    LEFT JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_developers ON projects.id = project_developers.project_id
    LEFT JOIN developers ON project_developers.developer_id = developers.id
    LEFT JOIN project_architects ON projects.id = project_architects.project_id
    LEFT JOIN architects ON project_architects.architect_id = architects.id
    LEFT JOIN project_contractors ON projects.id = project_contractors.project_id
    LEFT JOIN contractors ON project_contractors.contractor_id = contractors.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id
    GROUP BY projects.id`
  );
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return parseProjectRows(rows);
};
const getProject = async (id: number): Promise<Project> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.id, projects.name,
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postalCode', addresses.postcode,
      'location', JSON_OBJECT(
        'latitude', ST_Y(addresses.location),
        'longitude', ST_X(addresses.location)
      ),
      'city', JSON_OBJECT(
        'id', cities.id,
        'name', cities.name,
        'metroAreaId', cities.metro_area_id
      ),
      'country', JSON_OBJECT(
        'id', countries.id,
        'name', countries.name,
        'code', countries.code
      ),
      'metroArea', JSON_OBJECT(
        'id', metro_areas.id,
        'name', metro_areas.name,
        'countryId', metro_areas.country_id
      )
    ) AS address,
     building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    address_id AS addressId, expected_date_text AS expectedDateText,
    earliest_date_text AS earliestDateText, latest_date_text AS latestDateText, building_height_meters AS buildingHeightMeters,
    building_height_floors AS buildingHeightFloors, building_type_id AS buildingTypeId,
    budget_eur AS budgetEur, glass_facade AS glassFacade, facade_basis AS facadeBasis,
    status, last_verified_date AS lastVerifiedDate, confidence_score AS confidenceScore,
    is_active AS isActive, project_key AS projectKey,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_websites.id,
        'url', project_websites.url
      )
    ), ']') AS projectWebsites,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', developers.id,
      'name', developers.name,
      'contact', JSON_OBJECT(
        'website', developers.website,
        'email', developers.email,
        'phone', developers.phone
      )
    )
    ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', architects.id,
      'name', architects.name,
      'contact', JSON_OBJECT(
        'website', architects.website,
        'email', architects.email,
        'phone', architects.phone
          )
        )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', contractors.id,
      'name', contractors.name,
      'contact', JSON_OBJECT(
        'website', contractors.website,
        'email', contractors.email,
        'phone', contractors.phone
          )
        )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'mediaType', project_medias.media_type,
        'url', project_medias.url,
        'title', project_medias.title,
        'filename', project_medias.filename
      )
    ), ']') AS projectMedias,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', source_links.id,
        'url', source_links.url,
        'sourceType', source_links.source_type,
        'publisher', source_links.publisher,
        'accessedAt', source_links.accessed_at
      )
    ), ']') AS sourceLinks
    FROM projects
    LEFT JOIN project_websites ON projects.id = project_websites.project_id
    LEFT JOIN addresses ON projects.address_id = addresses.id
    LEFT JOIN cities ON addresses.city_id = cities.id
    LEFT JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    LEFT JOIN countries ON metro_areas.country_id = countries.id
    LEFT JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_developers ON projects.id = project_developers.project_id
    LEFT JOIN developers ON project_developers.developer_id = developers.id
    LEFT JOIN project_architects ON projects.id = project_architects.project_id
    LEFT JOIN architects ON project_architects.architect_id = architects.id
    LEFT JOIN project_contractors ON projects.id = project_contractors.project_id
    LEFT JOIN contractors ON project_contractors.contractor_id = contractors.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id
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
  const sql = promisePool.format(
    `INSERT INTO projects
    (name, address_id, expected_date_text, earliest_date_text, latest_date_text, building_height_meters,
    building_height_floors, building_type_id, budget_eur, glass_facade,
    facade_basis, status, last_verified_date, confidence_score, is_active, project_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectData.name,
      projectData.addressId,
      projectData.expectedDateText,
      projectData.earliestDateText,
      projectData.latestDateText,
      projectData.buildingHeightMeters,
      projectData.buildingHeightFloors,
      projectData.buildingTypeId,
      projectData.budgetEur,
      projectData.glassFacade,
      projectData.facadeBasis,
      projectData.status,
      projectData.lastVerifiedDate,
      projectData.confidenceScore,
      projectData.isActive,
      projectData.projectKey
    ]
  );
  console.log(sql);
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO projects
    (name, address_id, expected_date_text, earliest_date_text, latest_date_text, building_height_meters,
    building_height_floors, building_type_id, budget_eur, glass_facade,
    facade_basis, status, last_verified_date, confidence_score, is_active, project_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectData.name,
      projectData.addressId,
      projectData.expectedDateText ?? null,
      projectData.earliestDateText ?? null,
      projectData.latestDateText ?? null,
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
