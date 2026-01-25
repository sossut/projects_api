import { promisePool } from '../../database/db';

import {
  ProjectContractor,
  GetProjectContractor,
  PostProjectContractor,
  PutProjectContractor
} from '../../interfaces/ProjectContractor';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectContractors = async (): Promise<ProjectContractor[]> => {
  const [rows] = await promisePool.query<GetProjectContractor[]>(
    `SELECT
      project_id AS projectId,
      contractor_id AS contractorId 
     FROM project_contractors`
  );
  if (rows.length === 0) {
    throw new CustomError('No project contractors found', 404);
  }
  return rows;
};
const getProjectContractor = async (
  projectId: number,
  contractorId: number
): Promise<ProjectContractor> => {
  const [rows] = await promisePool.query<GetProjectContractor[]>(
    `SELECT
      project_id AS projectId,
      contractor_id AS contractorId
      FROM project_contractors WHERE project_id = ? AND contractor_id = ?`,
    [projectId, contractorId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `ProjectContractor with projectId ${projectId} and contractorId ${contractorId} not found`,
      404
    );
  }
  return rows[0];
};

const getProjectsContractors = async (
  projectId: number
): Promise<ProjectContractor[]> => {
  const [rows] = await promisePool.query<GetProjectContractor[]>(
    `SELECT
      project_id AS projectId,
      contractor_id AS contractorId
      FROM project_contractors WHERE project_id = ?`,
    [projectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `No contractors found for projectId ${projectId}`,
      404
    );
  }
  return rows;
};

const postProjectContractor = async (
  projectContractorData: PostProjectContractor
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_contractors
    (project_id, contractor_id)
    VALUES (?, ?)`,
    [projectContractorData.projectId, projectContractorData.contractorId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project contractor', 500);
  }
  return headers.insertId;
};

const putProjectContractor = async (
  projectContractorData: PutProjectContractor,
  projectId: number,
  contractorId: number
): Promise<boolean> => {
  const sql = promisePool.format(
    'UPDATE project_contractors SET ? WHERE project_id = ? AND contractor_id = ?',
    [projectContractorData, projectId, contractorId]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `ProjectContractor with projectId ${projectId} and contractorId ${contractorId} not found`,
      404
    );
  }
  return true;
};

const deleteProjectContractor = async (
  projectId: number,
  contractorId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_contractors WHERE project_id = ? AND contractor_id = ?',
    [projectId, contractorId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `ProjectContractor with projectId ${projectId} and contractorId ${contractorId} not found`,
      404
    );
  }
  return true;
};

export {
  getAllProjectContractors,
  getProjectContractor,
  getProjectsContractors,
  postProjectContractor,
  putProjectContractor,
  deleteProjectContractor
};
