import { promisePool } from '../../database/db';

import {
  Project,
  GetProject,
  PostProject,
  PutProject
} from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjects = async (): Promise<Project[]> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.id, name,
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postalCode', addresses.postal_code,
      JSON_OBJECT(
        'id', cities.id,
        'name', cities.name,
        'searchAreaId', cities.search_area_id
      ) AS city,
       JSON_OBJECT(
        'id', countries.id,
        'name', countries.name,
        'code', countries.code
      ) AS country,
      JSON_OBJECT(
        'id', search_areas.id,
        'name', search_areas.name,
        'countryId', search_areas.country_id
      ) AS searchArea
    ) AS address,
     building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    address_id AS addressId, expected_date_text AS expectedDateText,
    earliest_date AS earliestDate, latest_date AS latestDate, building_height_meters AS buildingHeightMeters,
    building_height_floors AS buildingHeightFloors, building_type_id AS buildingTypeId,
    budget_eur AS budgetEur, glass_facade AS glassFacade, facade_basis AS facadeBasis,
    status, last_verified_date AS lastVerifiedDate, confidence_score AS confidenceScore,
    is_active AS isActive, project_key AS projectKey,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', project_websites.id,
        'url', project_websites.url
      )
    ), ']') AS projectWebsites,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_developers.id,
      'name', developers.name
          )
        ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_architects.id,
      'name', architects.name
          )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_contractors.id,
      'name', contractors.name
          )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', project_media.id,
        'mediaType', project_media.media_type,
        'url', project_media.url,
        'title', project_media.title,
        'filename', project_media.filename
      )
    ), ']') AS projectMedias,
    CONCAT('[', GROUP_CONCAT(
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
    LEFT JOIN countries ON cities.country_id = countries.id
    LEFT JOIN search_areas ON cities.search_area_id = search_areas.id
    LEFT JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_developers ON projects.id = project_developers.project_id
    LEFT JOIN developers ON project_developers.developer_id = developers.id
    LEFT JOIN project_architects ON projects.id = project_architects.project_id
    LEFT JOIN architects ON project_architects.architect_id = architects.id
    LEFT JOIN project_contractors ON projects.id = project_contractors.project_id
    LEFT JOIN contractors ON project_contractors.contractor_id = contractors.id
    LEFT JOIN project_media ON projects.id = project_media.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id
    GROUP BY projects.id`
  );
  if (rows.length === 0) {
    throw new CustomError('No projects found', 404);
  }
  return rows;
};
const getProject = async (id: number): Promise<Project> => {
  const [rows] = await promisePool.query<GetProject[]>(
    `SELECT projects.id, name,
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postalCode', addresses.postal_code,
      JSON_OBJECT(
        'id', cities.id,
        'name', cities.name,
        'searchAreaId', cities.search_area_id
      ) AS city,
       JSON_OBJECT(
        'id', countries.id,
        'name', countries.name,
        'code', countries.code
      ) AS country,
      JSON_OBJECT(
        'id', search_areas.id,
        'name', search_areas.name,
        'countryId', search_areas.country_id
      ) AS searchArea
    ) AS address,
     building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    address_id AS addressId, expected_date_text AS expectedDateText,
    earliest_date AS earliestDate, latest_date AS latestDate, building_height_meters AS buildingHeightMeters,
    building_height_floors AS buildingHeightFloors, building_type_id AS buildingTypeId,
    budget_eur AS budgetEur, glass_facade AS glassFacade, facade_basis AS facadeBasis,
    status, last_verified_date AS lastVerifiedDate, confidence_score AS confidenceScore,
    is_active AS isActive, project_key AS projectKey,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', project_websites.id,
        'url', project_websites.url
      )
    ), ']') AS projectWebsites,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_developers.id,
      'name', developers.name
          )
        ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_architects.id,
      'name', architects.name
          )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'id', project_contractors.id,
      'name', contractors.name
          )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(
      JSON_OBJECT(
        'id', project_media.id,
        'mediaType', project_media.media_type,
        'url', project_media.url,
        'title', project_media.title,
        'filename', project_media.filename
      )
    ), ']') AS projectMedias,
    CONCAT('[', GROUP_CONCAT(
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
    LEFT JOIN countries ON cities.country_id = countries.id
    LEFT JOIN search_areas ON cities.search_area_id = search_areas.id
    LEFT JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_developers ON projects.id = project_developers.project_id
    LEFT JOIN developers ON project_developers.developer_id = developers.id
    LEFT JOIN project_architects ON projects.id = project_architects.project_id
    LEFT JOIN architects ON project_architects.architect_id = architects.id
    LEFT JOIN project_contractors ON projects.id = project_contractors.project_id
    LEFT JOIN contractors ON project_contractors.contractor_id = contractors.id
    LEFT JOIN project_media ON projects.id = project_media.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id
    WHERE projects.id = ?
    GROUP BY projects.id`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Project with id ${id} not found`, 404);
  }
  return rows[0];
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
    (name, address_id, expected_date_text, earliest_date, latest_date, building_height_meters,
    building_height_floors, building_type_id, budget_eur, glass_facade,
    facade_basis, status, last_verified_date, confidence_score, is_active, project_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectData.name,
      projectData.addressId,
      projectData.expectedDateText,
      projectData.earliestDate,
      projectData.latestDate,
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
    projectData,
    id
  ]);
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
