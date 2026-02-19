import { promisePool } from '../../database/db';

import {
  ProjectDuplicate,
  GetProjectDuplicate,
  PostProjectDuplicate,
  PutProjectDuplicate
} from '../../interfaces/ProjectDuplicate';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectDuplicates = async (): Promise<ProjectDuplicate[]> => {
  const [rows] = await promisePool.query<GetProjectDuplicate[]>(
    `SELECT
      id,
      duplicate_project_name AS duplicateProjectName,
      duplicate_project_key AS duplicateProjectKey,
      matched_project_id AS matchedProjectId,
      matched_first_pass_project_id AS matchedFirstPassProjectId,
      new_project_data AS newProjectData,
      reason,
      identified_at AS identifiedAt,
      similarity_score AS similarityScore,
      status,
      resolved_at AS resolvedAt,
      resolved_by AS resolvedBy
      FROM project_duplicates`
  );
  if (rows.length === 0) {
    throw new CustomError('No project duplicates found', 404);
  }
  return rows;
};

const getProjectDuplicate = async (id: number): Promise<ProjectDuplicate> => {
  const [rows] = await promisePool.query<GetProjectDuplicate[]>(
    `SELECT
      id,
      duplicate_project_name AS duplicateProjectName,
      duplicate_project_key AS duplicateProjectKey,
      matched_project_id AS matchedProjectId,
      matched_first_pass_project_id AS matchedFirstPassProjectId,
      new_project_data AS newProjectData,
      reason,
      identified_at AS identifiedAt,
      similarity_score AS similarityScore,
      status,
      resolved_at AS resolvedAt,
      resolved_by AS resolvedBy
      FROM project_duplicates WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`ProjectDuplicate with id ${id} not found`, 404);
  }
  return rows[0];
};

const postProjectDuplicate = async (
  projectDuplicateData: PostProjectDuplicate
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_duplicates
    (duplicate_project_name, duplicate_project_key, matched_project_id, matched_first_pass_project_id, new_project_data, reason, identified_at, similarity_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectDuplicateData.duplicateProjectName,
      projectDuplicateData.duplicateProjectKey,
      projectDuplicateData.matchedProjectId || null,
      projectDuplicateData.matchedFirstPassProjectId || null,
      projectDuplicateData.newProjectData,
      projectDuplicateData.reason || null,
      new Date(Date.now()),
      projectDuplicateData.similarityScore || null,
      'pending'
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project duplicate', 500);
  }
  return headers.insertId;
};

const putProjectDuplicate = async (
  projectDuplicateData: PutProjectDuplicate,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format(
    'UPDATE project_duplicates SET ? WHERE id = ?',
    [projectDuplicateData, id]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectDuplicate with id ${id} not found`, 404);
  }
  return true;
};

const deleteProjectDuplicate = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_duplicates WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectDuplicate with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjectDuplicates,
  getProjectDuplicate,
  postProjectDuplicate,
  putProjectDuplicate,
  deleteProjectDuplicate
};
