import { promisePool } from '../../database/db';

import {
  Search,
  GetSearch,
  PostSearch,
  PutSearch
} from '../../interfaces/Search';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllSearches = async (): Promise<Search[]> => {
  const [rows] = await promisePool.query<GetSearch[]>(
    `SELECT 
      id, 
      search_area_id AS metroAreaId, 
      type_param AS typeParam,
      started_at AS startedAt, 
      finished_at AS finishedAt, 
      status, 
      error_text AS errorText FROM searches`
  );
  if (rows.length === 0) {
    throw new CustomError('No searches found', 404);
  }
  return rows;
};

const getSearch = async (id: number): Promise<Search> => {
  const [rows] = await promisePool.query<GetSearch[]>(
    `SELECT 
      id,
      search_area_id AS metroAreaId, 
      type_param AS typeParam,
      started_at AS startedAt,
      finished_at AS finishedAt, 
      status, 
      error_text AS errorText FROM searches WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Search with id ${id} not found`, 404);
  }
  return rows[0];
};

const postSearch = async (searchData: PostSearch): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO searches (search_area_id, type_param, started_at, status) VALUES (?, ?, ?, ?)',
    [
      searchData.metroAreaId,
      searchData.typeParam,
      searchData.startedAt,
      'running'
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create search', 500);
  }
  return headers.insertId;
};

const putSearch = async (
  searchData: PutSearch,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE searches SET ? WHERE id = ?', [
    searchData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Search with id ${id} not found`, 404);
  }
  return true;
};

const deleteSearch = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM searches WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Search with id ${id} not found`, 404);
  }
  return true;
};

export { getAllSearches, getSearch, postSearch, putSearch, deleteSearch };
