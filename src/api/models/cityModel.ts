import { promisePool } from '../../database/db';

import { City, GetCity, PostCity, PutCity } from '../../interfaces/City';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllCities = async (): Promise<City[]> => {
  const [rows] = await promisePool.query<GetCity[]>(
    'SELECT id, name, search_area_id AS searchAreaId FROM cities'
  );
  if (rows.length === 0) {
    throw new CustomError('No cities found', 404);
  }
  return rows;
};

const getCity = async (id: number): Promise<City> => {
  const [rows] = await promisePool.query<GetCity[]>(
    'SELECT id, name, search_area_id AS searchAreaId FROM cities WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`City with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkCityExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetCity[]>(
    'SELECT id FROM cities WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postCity = async (cityData: PostCity): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO cities (name, search_area_id) VALUES (?, ?)',
    [cityData.name, cityData.searchAreaId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create city', 500);
  }
  return headers.insertId;
};

const putCity = async (cityData: PutCity, id: number): Promise<boolean> => {
  const sql = promisePool.format('UPDATE cities SET ? WHERE id = ?', [
    cityData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`City with id ${id} not found`, 404);
  }
  return true;
};

const deleteCity = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM cities WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`City with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllCities,
  getCity,
  checkCityExistsByName,
  postCity,
  putCity,
  deleteCity
};
