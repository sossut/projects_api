import { promisePool } from '../../database/db';

import {
  ProjectBuildingUse,
  GetProjectBuildingUse,
  PostProjectBuildingUse,
  PutProjectBuildingUse
} from '../../interfaces/ProjectBuildingUse';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectBuildingUses = async (): Promise<ProjectBuildingUse[]> => {
  const [rows] = await promisePool.query<GetProjectBuildingUse[]>(
    'SELECT project_id AS projectId, building_use_id AS buildingUseId FROM project_building_uses'
  );
  if (rows.length === 0) {
    throw new CustomError('No project building uses found', 404);
  }
  return rows;
};

const getProjectBuildingUse = async (
  id: number
): Promise<ProjectBuildingUse> => {
  const [rows] = await promisePool.query<GetProjectBuildingUse[]>(
    'SELECT project_id AS projectId, building_use_id AS buildingUseId FROM project_building_uses WHERE project_id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Project building use with project id ${id} not found`,
      404
    );
  }
  return rows[0];
};

const postProjectBuildingUse = async (
  projectBuildingUseData: PostProjectBuildingUse
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO project_building_uses (project_id, building_use_id) VALUES (?, ?)',
    [projectBuildingUseData.projectId, projectBuildingUseData.buildingUseId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project building use', 500);
  }
  return headers.insertId;
};
const putProjectBuildingUse = async (
  projectBuildingUseData: PutProjectBuildingUse,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format(
    'UPDATE project_building_uses SET ? WHERE project_id = ?',
    [projectBuildingUseData, id]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `Project building use with project id ${id} not found`,
      404
    );
  }
  return true;
};

const deleteProjectBuildingUse = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_building_uses WHERE project_id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `Project building use with project id ${id} not found`,
      404
    );
  }
  return true;
};

export {
  getAllProjectBuildingUses,
  getProjectBuildingUse,
  postProjectBuildingUse,
  putProjectBuildingUse,
  deleteProjectBuildingUse
};
