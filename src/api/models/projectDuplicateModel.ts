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
      project_duplicate_name AS projectDuplicateName,
      project_duplicate_key AS projectDuplicateKey,
      matched_project_id AS matchedProjectId,
      matched_project_key AS matchedProjectKey,
      matched_first_pass_project_id AS matchedFirstPassProjectId,
      matched_first_pass_project_name AS matchedFirstPassProjectName,
      project_duplicate_data AS projectDuplicateData,
      reason,
      identified_at AS identifiedAt,
      similarity_score AS similarityScore,
      status,
      resolved_at AS resolvedAt,
      resolved_by AS resolvedBy
      FROM project_duplicates
      LEFT JOIN projects AS matched_project ON project_duplicates.matched_project_id = matched_project.id
      LEFT JOIN project_first_passes AS matched_first_pass_project ON project_duplicates.matched_first_pass_project_id = matched_first_pass_project.id`
  );
  if (rows.length === 0) {
    throw new CustomError('No project duplicates found', 404);
  }
  return rows;
};

const getProjectDuplicate = async (id: number): Promise<ProjectDuplicate> => {
  const [rows] = await promisePool.query<GetProjectDuplicate[]>(
    `SELECT
      project_duplicates.id,
      project_duplicate_name AS projectDuplicateName,
      project_duplicate_key AS projectDuplicateKey,
      matched_project_id AS matchedProjectId,
      matched_project_key AS matchedProjectKey,
      matched_first_pass_project_id AS matchedFirstPassProjectId,
      matched_first_pass_project_name AS matchedFirstPassProjectName,
      project_duplicate_data AS projectDuplicateData,
      reason,
      identified_at AS identifiedAt,
      similarity_score AS similarityScore,
      status,
      resolved_at AS resolvedAt,
      resolved_by AS resolvedBy
      FROM project_duplicates
      LEFT JOIN projects AS matched_project ON project_duplicates.matched_project_id = matched_project.id
      LEFT JOIN project_first_passes AS matched_first_pass_project ON project_duplicates.matched_first_pass_project_id = matched_first_pass_project.id
      WHERE project_duplicates.id = ?`,
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
    (project_duplicate_name, project_duplicate_key, matched_project_id, matched_first_pass_project_id, project_duplicate_data, reason, identified_at, similarity_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectDuplicateData.projectDuplicateName,
      projectDuplicateData.projectDuplicateKey,
      projectDuplicateData.matchedProjectId || null,
      projectDuplicateData.matchedFirstPassProjectId || null,
      projectDuplicateData.projectDuplicateData,
      projectDuplicateData.reason || null,
      new Date(Date.now()),
      projectDuplicateData.similarityScore,
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
