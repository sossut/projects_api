import { promisePool } from '../../database/db';

import {
  ProjectWebsite,
  GetProjectWebsite,
  PostProjectWebsite,
  PutProjectWebsite
} from '../../interfaces/ProjectWebsite';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectWebsites = async (): Promise<ProjectWebsite[]> => {
  const [rows] = await promisePool.query<GetProjectWebsite[]>(
    `SELECT
     id, url, project_id AS projectId 
     FROM project_websites`
  );
  if (rows.length === 0) {
    throw new CustomError('No project websites found', 404);
  }
  return rows;
};

const getProjectWebsite = async (id: number): Promise<ProjectWebsite> => {
  const [rows] = await promisePool.query<GetProjectWebsite[]>(
    `SELECT
      id, url, project_id AS projectId
      FROM project_websites WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`ProjectWebsite with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkProjectWebsiteExistsByUrl = async (
  url: string
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetProjectWebsite[]>(
    'SELECT id FROM project_websites WHERE url = ?',
    [url]
  );
  return rows.length > 0;
};

const postProjectWebsite = async (
  projectWebsiteData: PostProjectWebsite
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_websites
    (url, project_id)
    VALUES (?, ?)`,
    [projectWebsiteData.url, projectWebsiteData.projectId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project website', 500);
  }
  return headers.insertId;
};

const putProjectWebsite = async (
  projectWebsiteData: PutProjectWebsite,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE project_websites SET ? WHERE id = ?', [
    projectWebsiteData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectWebsite with id ${id} not found`, 404);
  }
  return true;
};

const deleteProjectWebsite = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_websites WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectWebsite with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjectWebsites,
  getProjectWebsite,
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite,
  putProjectWebsite,
  deleteProjectWebsite
};
