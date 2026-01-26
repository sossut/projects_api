import { promisePool } from '../../database/db';

import {
  Developer,
  GetDeveloper,
  PostDeveloper,
  PutDeveloper
} from '../../interfaces/Developer';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllDevelopers = async (): Promise<Developer[]> => {
  const [rows] = await promisePool.query<GetDeveloper[]>(
    'SELECT id, name, website, country_id AS countryId, phone, email FROM developers'
  );
  if (rows.length === 0) {
    throw new CustomError('No developers found', 404);
  }
  return rows;
};

const getDeveloper = async (id: number): Promise<Developer> => {
  const [rows] = await promisePool.query<GetDeveloper[]>(
    'SELECT id, name, website, country_id AS countryId, phone, email FROM developers WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Developer with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkDeveloperExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetDeveloper[]>(
    'SELECT id FROM developers WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postDeveloper = async (developerData: PostDeveloper): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO developers (name, country_id, website, phone, email) VALUES (?, ?, ?, ?, ?)',
    [
      developerData.name,
      developerData.countryId,
      developerData.website,
      developerData.phone,
      developerData.email
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create developer', 500);
  }
  return headers.insertId;
};

const putDeveloper = async (
  developerData: PutDeveloper,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE developers SET ? WHERE id = ?', [
    developerData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Developer with id ${id} not found`, 404);
  }
  return true;
};

const deleteDeveloper = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM developers WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Developer with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllDevelopers,
  getDeveloper,
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper,
  deleteDeveloper
};
