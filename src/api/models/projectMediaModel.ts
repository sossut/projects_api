import { promisePool } from '../../database/db';

import {
  ProjectMedia,
  GetProjectMedia,
  PostProjectMedia,
  PutProjectMedia
} from '../../interfaces/ProjectMedia';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllProjectMedias = async (): Promise<ProjectMedia[]> => {
  const [rows] = await promisePool.query<GetProjectMedia[]>(
    `SELECT
      id,
      project_id AS projectId,
      media_type AS mediaType,
      url,
      title,
      filename,
      source_page AS sourcePage,
      media_date AS mediaDate
      FROM project_medias`
  );
  if (rows.length === 0) {
    throw new CustomError('No project medias found', 404);
  }
  return rows;
};

const getProjectMedia = async (id: number): Promise<ProjectMedia> => {
  const [rows] = await promisePool.query<GetProjectMedia[]>(
    `SELECT
      id,
      project_id AS projectId,
      media_type AS mediaType,
      url,
      title,
      filename,
      source_page AS sourcePage,
      media_date AS mediaDate
      FROM project_medias WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`ProjectMedia with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkProjectMediaExistsByUrl = async (url: string): Promise<number> => {
  const [rows] = await promisePool.query<GetProjectMedia[]>(
    'SELECT id FROM project_medias WHERE url = ?',
    [url]
  );
  if (rows.length === 0) {
    return 0; // No media found with the given URL
  }
  return rows[0].id as number; // Return the ID of the existing media
};

const postProjectMedia = async (
  projectMediaData: PostProjectMedia
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO project_medias
    (project_id, media_type, url, title, source_page, media_date)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      projectMediaData.projectId,
      projectMediaData.mediaType,
      projectMediaData.url,
      projectMediaData.title,
      projectMediaData.sourcePage || null,
      projectMediaData.mediaDate || null
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create project media', 500);
  }
  return headers.insertId;
};

const putProjectMedia = async (
  projectMediaData: PutProjectMedia,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE project_medias SET ? WHERE id = ?', [
    projectMediaData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectMedia with id ${id} not found`, 404);
  }
  return true;
};

const deleteProjectMedia = async (id: number): Promise<boolean> => {
  const sql = promisePool.format('DELETE FROM project_medias WHERE id = ?', [
    id
  ]);
  console.log(sql);
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_medias WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectMedia with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjectMedias,
  getProjectMedia,
  checkProjectMediaExistsByUrl,
  postProjectMedia,
  putProjectMedia,
  deleteProjectMedia
};
