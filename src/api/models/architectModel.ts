import { promisePool } from '../../database/db';

import {
  Architect,
  GetArchitect,
  PostArchitect,
  PutArchitect
} from '../../interfaces/Architect';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllArchitects = async (): Promise<Architect[]> => {
  const [rows] = await promisePool.query<GetArchitect[]>(
    'SELECT id, name, website, phone, email, country_id AS countryId FROM architects'
  );
  if (rows.length === 0) {
    throw new CustomError('No architects found', 404);
  }
  return rows;
};

const getArchitect = async (id: number): Promise<Architect> => {
  const [rows] = await promisePool.query<GetArchitect[]>(
    'SELECT id, name, website, phone, email, country_id AS countryId FROM architects WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Architect with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkArchitectExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetArchitect[]>(
    'SELECT id FROM architects WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postArchitect = async (architectData: PostArchitect): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO architects (name, website, phone, email, country_id) VALUES (?, ?, ?, ?, ?)',
    [
      architectData.name,
      architectData.website,
      architectData.phone,
      architectData.email,
      architectData.countryId
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create architect', 500);
  }
  return headers.insertId;
};

const putArchitect = async (
  architectData: PutArchitect,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE architects SET ? WHERE id = ?', [
    architectData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Architect with id ${id} not found`, 404);
  }
  return true;
};

const deleteArchitect = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM architects WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Architect with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllArchitects,
  getArchitect,
  checkArchitectExistsByName,
  postArchitect,
  putArchitect,
  deleteArchitect
};
