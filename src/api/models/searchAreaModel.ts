import { promisePool } from '../../database/db';
import {
  SearchArea,
  GetSearchArea,
  PutSearchArea,
  PostSearchArea
} from '../../interfaces/SearchArea';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllSearchAreas = async (): Promise<SearchArea[]> => {
  const [rows] = await promisePool.query<GetSearchArea[]>(
    `SELECT search_areas.id, search_areas.name, search_areas.last_searched_at,
      countries.id AS country_id, countries.name AS country_name,
      continents.id AS continent_id, continents.name AS continent_name
    FROM search_areas
      JOIN countries ON search_areas.country_id = countries.id
      JOIN continents ON countries.continent_id = continents.id`
  );
  if (rows.length === 0) {
    throw new CustomError('No search areas found', 404);
  }
  return rows;
};

const getSearchArea = async (id: number): Promise<SearchArea> => {
  const [rows] = await promisePool.query<GetSearchArea[]>(
    `SELECT search_areas.id, search_areas.name, search_areas.last_searched_at,
      countries.id AS country_id, countries.name AS country_name,
      continents.id AS continent_id, continents.name AS continent_name
    FROM search_areas
      JOIN countries ON search_areas.country_id = countries.id
      JOIN continents ON countries.continent_id = continents.id
    WHERE search_areas.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Search area with id ${id} not found`, 404);
  }
  return rows[0];
};

const postSearchArea = async (
  searchAreaData: PostSearchArea
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO search_areas (name, country_id, last_searched_at) VALUES (?, ?, ?)',
    [
      searchAreaData.name,
      searchAreaData.countryId,
      searchAreaData.lastSearchedAt
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create search area', 500);
  }
  return headers.insertId;
};

const putSearchArea = async (
  searchAreaData: PutSearchArea,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE search_areas SET ? WHERE id = ?', [
    toSnake(searchAreaData),
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Search area with id ${id} not found`, 404);
  }
  return true;
};

const deleteSearchArea = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM search_areas WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Search area with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllSearchAreas,
  getSearchArea,
  postSearchArea,
  putSearchArea,
  deleteSearchArea
};
