import { promisePool } from '../../database/db';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import {
  Country,
  GetCountry,
  PostCountry,
  PutCountry
} from '../../interfaces/Country';

const getAllCountries = async (): Promise<Country[]> => {
  const [rows] = await promisePool.query<GetCountry[]>(
    'SELECT id, name, code FROM countries'
  );
  if (rows.length === 0) {
    throw new CustomError('No countries found', 404);
  }
  return rows;
};

const getCountry = async (id: number): Promise<Country> => {
  const [rows] = await promisePool.query<GetCountry[]>(
    'SELECT id, name, code FROM countries WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Country with id ${id} not found`, 404);
  }
  return rows[0];
};
const checkCountryExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetCountry[]>(
    'SELECT id FROM countries WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? rows[0].id : 0;
};
const postCountry = async (countryData: PostCountry): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO countries (name, code, continent_id) VALUES (?, ?, ?)',
    [countryData.name, countryData.code, countryData.continentId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create country', 500);
  }
  return headers.insertId;
};

const putCountry = async (
  countryData: PutCountry,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE countries SET ? WHERE id = ?', [
    countryData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Country with id ${id} not found`, 404);
  }
  return true;
};

const deleteCountry = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM countries WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Country with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllCountries,
  getCountry,
  checkCountryExistsByName,
  postCountry,
  putCountry,
  deleteCountry
};
