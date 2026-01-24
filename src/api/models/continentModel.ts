import { promisePool } from '../../database/db';

import { Continent, PostContinent } from '../../interfaces/Continent';
import { GetContinent, PutContinent } from '../../interfaces/Continent';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllContinents = async (): Promise<Continent[]> => {
  const [rows] = await promisePool.query<GetContinent[]>(
    'SELECT id, name, code FROM continents'
  );
  if (rows.length === 0) {
    throw new CustomError('No continents found', 404);
  }
  return rows;
};

const getContinent = async (id: number): Promise<Continent> => {
  const [rows] = await promisePool.query<GetContinent[]>(
    'SELECT id, name, code FROM continents WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Continent with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkContinentExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetContinent[]>(
    'SELECT id FROM continents WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? rows[0].id : 0;
};

const postContinent = async (continentData: PostContinent): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO continents (name, code) VALUES (?, ?)',
    [continentData.name, continentData.code]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create continent', 500);
  }
  return headers.insertId;
};

const putContinent = async (
  continentData: PutContinent,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('SELECT * FROM continents WHERE id = ?', [id]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Continent with id ${id} not found`, 404);
  }
  return true;
};

const deleteContinent = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM continents WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Continent with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllContinents,
  getContinent,
  checkContinentExistsByName,
  postContinent,
  putContinent,
  deleteContinent
};
