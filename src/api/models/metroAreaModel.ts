import { promisePool } from '../../database/db';
import {
  MetroArea,
  GetMetroArea,
  PutMetroArea,
  PostMetroArea
} from '../../interfaces/MetroArea';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllMetroAreas = async (): Promise<MetroArea[]> => {
  const [rows] = await promisePool.query<GetMetroArea[]>(
    `SELECT metro_areas.id, metro_areas.name, metro_areas.last_searched_at,
      countries.id AS country_id, countries.name AS country_name,
      continents.id AS continent_id, continents.name AS continent_name
    FROM metro_areas
      JOIN countries ON metro_areas.country_id = countries.id
      JOIN continents ON countries.continent_id = continents.id`
  );
  if (rows.length === 0) {
    throw new CustomError('No metro areas found', 404);
  }
  return rows;
};

const getMetroArea = async (id: number): Promise<MetroArea> => {
  const [rows] = await promisePool.query<GetMetroArea[]>(
    `SELECT metro_areas.id, metro_areas.name, metro_areas.last_searched_at,
      countries.id AS country_id, countries.name AS country_name,
      continents.id AS continent_id, continents.name AS continent_name
    FROM metro_areas
      JOIN countries ON metro_areas.country_id = countries.id
      JOIN continents ON countries.continent_id = continents.id
    WHERE metro_areas.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Metro area with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkMetroAreaExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetMetroArea[]>(
    'SELECT id FROM metro_areas WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postMetroArea = async (metroAreaData: PostMetroArea): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO metro_areas (name, country_id, last_searched_at) VALUES (?, ?, ?)',
    [metroAreaData.name, metroAreaData.countryId, metroAreaData.lastSearchedAt]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create metro area', 500);
  }
  return headers.insertId;
};

const putMetroArea = async (
  metroAreaData: PutMetroArea,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE metro_areas SET ? WHERE id = ?', [
    toSnake(metroAreaData),
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Metro area with id ${id} not found`, 404);
  }
  return true;
};

const deleteMetroArea = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM metro_areas WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Metro area with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllMetroAreas,
  getMetroArea,
  postMetroArea,
  putMetroArea,
  deleteMetroArea,
  checkMetroAreaExistsByName
};
