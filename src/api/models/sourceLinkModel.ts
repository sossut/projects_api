import { promisePool } from '../../database/db';

import {
  SourceLink,
  GetSourceLink,
  PostSourceLink,
  PutSourceLink
} from '../../interfaces/SourceLink';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllSourceLinks = async (): Promise<SourceLink[]> => {
  const [rows] = await promisePool.query<GetSourceLink[]>(
    `SELECT
      id,
      project_id AS projectId,
      url,
      source_type AS sourceType,
      publisher,
      accessed_at AS accessedAt
      FROM source_links`
  );
  if (rows.length === 0) {
    throw new CustomError('No source links found', 404);
  }
  return rows;
};

const getSourceLink = async (id: number): Promise<SourceLink> => {
  const [rows] = await promisePool.query<GetSourceLink[]>(
    `SELECT
      id,
      project_id AS projectId,
      url,
      source_type AS sourceType,
      publisher,
      accessed_at AS accessedAt
      FROM source_links WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Source link with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkSourceLinkExistsByUrl = async (url: string): Promise<boolean> => {
  const [rows] = await promisePool.query<GetSourceLink[]>(
    'SELECT id FROM source_links WHERE url = ?',
    [url]
  );
  return rows.length > 0;
};

const postSourceLink = async (
  sourceLinkData: PostSourceLink
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    `INSERT INTO source_links
      (project_id, url, source_type, publisher, accessed_at)
      VALUES (?, ?, ?, ?, ?)`,
    [
      sourceLinkData.projectId,
      sourceLinkData.url,
      sourceLinkData.sourceType ?? null,
      sourceLinkData.publisher ?? null,
      sourceLinkData.accessedAt ?? null
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create source link', 500);
  }
  return headers.insertId;
};

const putSourceLink = async (
  sourceLinkData: PutSourceLink,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE source_links SET ? WHERE id = ?', [
    sourceLinkData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Source link with id ${id} not found`, 404);
  }
  return true;
};

const deleteSourceLink = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM source_links WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Source link with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllSourceLinks,
  getSourceLink,
  checkSourceLinkExistsByUrl,
  postSourceLink,
  putSourceLink,
  deleteSourceLink
};
