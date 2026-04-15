import { promisePool } from '../../database/db';

import {
  ProjectFirstPass,
  GetProjectFirstPass,
  PostProjectFirstPass,
  PutProjectFirstPass
} from '../../interfaces/ProjectFirstPass';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllProjectFirstPasses = async (): Promise<ProjectFirstPass[]> => {
  const [rows] = await promisePool.query<GetProjectFirstPass[]>(
    `SELECT
      *
      FROM project_first_passes`
  );
  if (rows.length === 0) {
    throw new CustomError('No project first passes found', 404);
  }
  return rows;
};

const getProjectFirstPass = async (id: number): Promise<ProjectFirstPass> => {
  const [rows] = await promisePool.query<GetProjectFirstPass[]>(
    `SELECT
      *
      FROM project_first_passes WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`ProjectFirstPass with id ${id} not found`, 404);
  }
  return rows[0];
};

const getProjectFirstPassNamesByMetroAreaAndBuildingType = async (
  metroArea: string,
  buildingType: string
): Promise<string[]> => {
  let buildingTypeName;
  if (buildingType === 'A') {
    buildingTypeName = 'Skyscraper';
  } else if (buildingType === 'B') {
    buildingTypeName = 'High-rise';
  } else if (buildingType === 'C') {
    buildingTypeName = 'Major civic or commercial building';
  } else if (buildingType === 'D') {
    buildingTypeName = 'Industrial building';
  }
  const [rows] = await promisePool.query<GetProjectFirstPass[]>(
    `SELECT project_first_passes.name
    FROM project_first_passes
    WHERE project_first_passes.metro_area = ?
    AND project_first_passes.building_type = ?`,
    [metroArea, buildingTypeName]
  );
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row) => row.name);
};

const postProjectFirstPass = async (
  projectFirstPassData: PostProjectFirstPass
): Promise<number> => {
  const sql = promisePool.format(
    `INSERT INTO project_first_passes (
      name, address, metro_area, city, country, continent, building_height_meters,
      building_type, building_use, status, expected_date_text, last_verified_date,
      sources
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectFirstPassData.name,
      projectFirstPassData.address,
      projectFirstPassData.metroArea,
      projectFirstPassData.city,
      projectFirstPassData.country,
      projectFirstPassData.continent,
      projectFirstPassData.buildingHeightMeters,
      projectFirstPassData.buildingType,
      JSON.stringify(projectFirstPassData.buildingUse),
      projectFirstPassData.status,
      projectFirstPassData.expectedDateText,
      new Date(),
      JSON.stringify(projectFirstPassData.sources || [])
    ]
  );

  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_first_passes (
      name, address, metro_area, city, country, continent, building_height_meters, 
      building_type, building_use, status, expected_date_text, last_verified_date,
      sources
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectFirstPassData.name,
      projectFirstPassData.address,
      projectFirstPassData.metroArea,
      projectFirstPassData.city,
      projectFirstPassData.country,
      projectFirstPassData.continent,
      projectFirstPassData.buildingHeightMeters,
      projectFirstPassData.buildingType,
      JSON.stringify(projectFirstPassData.buildingUse),
      projectFirstPassData.status,
      projectFirstPassData.expectedDateText,
      new Date(),
      JSON.stringify(projectFirstPassData.sources || [])
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project first pass', 500);
  }
  return headers.insertId;
};

const putProjectFirstPass = async (
  projectFirstPassData: PutProjectFirstPass,
  id: number
): Promise<boolean> => {
  const snakeData = toSnake(projectFirstPassData);
  const sql = promisePool.format(
    'UPDATE project_first_passes SET ? WHERE id = ?',
    [snakeData, id]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectFirstPass with id ${id} not found`, 404);
  }
  return true;
};

const deleteProjectFirstPass = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_first_passes WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectFirstPass with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjectFirstPasses,
  getProjectFirstPass,
  getProjectFirstPassNamesByMetroAreaAndBuildingType,
  postProjectFirstPass,
  putProjectFirstPass,
  deleteProjectFirstPass
};
