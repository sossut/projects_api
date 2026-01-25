import { promisePool } from '../../database/db';

import {
  ProjectArchitect,
  GetProjectArchitect,
  PostProjectArchitect,
  PutProjectArchitect
} from '../../interfaces/ProjectArchitect';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectArchitects = async (): Promise<ProjectArchitect[]> => {
  const [rows] = await promisePool.query<GetProjectArchitect[]>(
    `SELECT
      project_id AS projectId,
      architect_id AS architectId 
     FROM project_architects`
  );
  if (rows.length === 0) {
    throw new CustomError('No project architects found', 404);
  }
  return rows;
};

const getProjectArchitect = async (
  projectId: number,
  architectId: number
): Promise<ProjectArchitect> => {
  const [rows] = await promisePool.query<GetProjectArchitect[]>(
    `SELECT
      project_id AS projectId,
      architect_id AS architectId
      FROM project_architects WHERE project_id = ? AND architect_id = ?`,
    [projectId, architectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `ProjectArchitect with projectId ${projectId} and architectId ${architectId} not found`,
      404
    );
  }
  return rows[0];
};

const getProjectsArchitects = async (
  projectId: number
): Promise<ProjectArchitect[]> => {
  const [rows] = await promisePool.query<GetProjectArchitect[]>(
    `SELECT
      project_id AS projectId,
      architect_id AS architectId
      FROM project_architects WHERE project_id = ?`,
    [projectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `No architects found for projectId ${projectId}`,
      404
    );
  }
  return rows;
};

const postProjectArchitect = async (
  projectArchitectData: PostProjectArchitect
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_architects
    (project_id, architect_id)
    VALUES (?, ?)`,
    [projectArchitectData.projectId, projectArchitectData.architectId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project architect', 500);
  }
  return headers.insertId;
};

const putProjectArchitect = async (
  projectArchitectData: PutProjectArchitect,
  projectId: number,
  architectId: number
): Promise<boolean> => {
  const sql = promisePool.format(
    'UPDATE project_architects SET ? WHERE project_id = ? AND architect_id = ?',
    [projectArchitectData, projectId, architectId]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `ProjectArchitect with projectId ${projectId} and architectId ${architectId} not found`,
      404
    );
  }
  return true;
};

const deleteProjectArchitect = async (
  projectId: number,
  architectId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_architects WHERE project_id = ? AND architect_id = ?',
    [projectId, architectId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `ProjectArchitect with projectId ${projectId} and architectId ${architectId} not found`,
      404
    );
  }
  return true;
};

export {
  getAllProjectArchitects,
  getProjectArchitect,
  getProjectsArchitects,
  postProjectArchitect,
  putProjectArchitect,
  deleteProjectArchitect
};
