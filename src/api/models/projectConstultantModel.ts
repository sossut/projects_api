import { promisePool } from '../../database/db';

import {
  ProjectConsultant,
  GetProjectConsultant,
  PostProjectConsultant,
  PutProjectConsultant
} from '../../interfaces/ProjectConsultant';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllProjectConsultants = async (): Promise<ProjectConsultant[]> => {
  const [rows] = await promisePool.query<GetProjectConsultant[]>(
    `SELECT
      project_id AS projectId,
      consultant_id AS consultantId,
      source
      FROM project_consultants`
  );
  if (rows.length === 0) {
    throw new CustomError('No project consultants found', 404);
  }
  return rows;
};

const getProjectConsultant = async (
  projectId: number,
  consultantId: number
): Promise<ProjectConsultant> => {
  const [rows] = await promisePool.query<GetProjectConsultant[]>(
    `SELECT
      project_id AS projectId,
      consultant_id AS consultantId,
      source
      FROM project_consultants WHERE project_id = ? AND consultant_id = ?`,
    [projectId, consultantId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Project consultant with projectId ${projectId} and consultantId ${consultantId} not found`,
      404
    );
  }
  return rows[0];
};

const checkProjectConsultantExists = async (
  projectId: number,
  consultantId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetProjectConsultant[]>(
    'SELECT project_id, consultant_id FROM project_consultants WHERE project_id = ? AND consultant_id = ?',
    [projectId, consultantId]
  );
  return rows.length > 0;
};

const postProjectConsultant = async (
  projectConsultantData: PostProjectConsultant
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO project_consultants (project_id, consultant_id, source) VALUES (?, ?, ?)',
    [
      projectConsultantData.projectId,
      projectConsultantData.consultantId,
      projectConsultantData.source
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project consultant', 500);
  }
  return headers.insertId;
};

const putProjectConsultant = async (
  projectConsultantData: PutProjectConsultant,
  projectId: number,
  consultantId: number
): Promise<boolean> => {
  const snakeCaseData = toSnake(projectConsultantData) as any;
  const sql = promisePool.format(
    'UPDATE project_consultants SET ? WHERE project_id = ? AND consultant_id = ?',
    [snakeCaseData, projectId, consultantId]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to update project consultant', 500);
  }
  return headers.affectedRows > 0;
};

const deleteProjectConsultant = async (
  projectId: number,
  consultantId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_consultants WHERE project_id = ? AND consultant_id = ?',
    [projectId, consultantId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `Project consultant with projectId ${projectId} and consultantId ${consultantId} not found`,
      404
    );
  }
  return true;
};

export {
  getAllProjectConsultants,
  getProjectConsultant,
  checkProjectConsultantExists,
  postProjectConsultant,
  putProjectConsultant,
  deleteProjectConsultant
};
