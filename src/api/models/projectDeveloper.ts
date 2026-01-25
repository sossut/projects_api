import { promisePool } from '../../database/db';

import {
  ProjectDeveloper,
  GetProjectDeveloper,
  PostProjectDeveloper,
  PutProjectDeveloper
} from '../../interfaces/ProjectDeveloper';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectDevelopers = async (): Promise<ProjectDeveloper[]> => {
  const [rows] = await promisePool.query<GetProjectDeveloper[]>(
    `SELECT
      project_id AS projectId,
      developer_id AS developerId 
     FROM project_developers`
  );
  if (rows.length === 0) {
    throw new CustomError('No project developers found', 404);
  }
  return rows;
};

const getProjectDeveloper = async (
  projectId: number,
  developerId: number
): Promise<ProjectDeveloper> => {
  const [rows] = await promisePool.query<GetProjectDeveloper[]>(
    `SELECT
      project_id AS projectId,
      developer_id AS developerId
      FROM project_developers WHERE project_id = ? AND developer_id = ?`,
    [projectId, developerId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `ProjectDeveloper with projectId ${projectId} and developerId ${developerId} not found`,
      404
    );
  }
  return rows[0];
};

const getProjectsDevelopers = async (
  projectId: number
): Promise<ProjectDeveloper[]> => {
  const [rows] = await promisePool.query<GetProjectDeveloper[]>(
    `SELECT
      project_id AS projectId,
      developer_id AS developerId
      FROM project_developers WHERE project_id = ?`,
    [projectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `No developers found for projectId ${projectId}`,
      404
    );
  }
  return rows;
};
const postProjectDeveloper = async (
  projectDeveloperData: PostProjectDeveloper
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_developers
    (project_id, developer_id)
    VALUES (?, ?)`,
    [projectDeveloperData.projectId, projectDeveloperData.developerId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project developer', 500);
  }
  return headers.insertId;
};

const putProjectDeveloper = async (
  projectDeveloperData: PutProjectDeveloper,
  projectId: number,
  developerId: number
): Promise<boolean> => {
  const sql = promisePool.format(
    'UPDATE project_developers SET ? WHERE project_id = ? AND developer_id = ?',
    [projectDeveloperData, projectId, developerId]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `ProjectDeveloper with projectId ${projectId} and developerId ${developerId} not found`,
      404
    );
  }
  return true;
};

export {
  getAllProjectDevelopers,
  getProjectDeveloper,
  getProjectsDevelopers,
  postProjectDeveloper,
  putProjectDeveloper
};
