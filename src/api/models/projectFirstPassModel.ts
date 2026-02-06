import { promisePool } from '../../database/db';

import {
  ProjectFirstPass,
  GetProjectFirstPass,
  PostProjectFirstPass,
  PutProjectFirstPass
} from '../../interfaces/ProjectFirstPass';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

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

const postProjectFirstPass = async (
  projectFirstPassData: PostProjectFirstPass
): Promise<number> => {
  console.log(JSON.stringify(projectFirstPassData.sources));
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
  console.log(sql);
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
  const sql = promisePool.format(
    'UPDATE project_first_passes SET ? WHERE id = ?',
    [projectFirstPassData, id]
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
  postProjectFirstPass,
  putProjectFirstPass,
  deleteProjectFirstPass
};
