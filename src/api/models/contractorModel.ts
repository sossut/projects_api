import { promisePool } from '../../database/db';

import {
  Contractor,
  GetContractor,
  PostContractor,
  PutContractor
} from '../../interfaces/Contractor';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllContractors = async (): Promise<Contractor[]> => {
  const [rows] = await promisePool.query<GetContractor[]>(
    'SELECT id, name, country_id AS countryId, website, email, phone FROM contractors'
  );
  if (rows.length === 0) {
    throw new CustomError('No contractors found', 404);
  }
  return rows;
};

const getContractor = async (id: number): Promise<Contractor> => {
  const [rows] = await promisePool.query<GetContractor[]>(
    'SELECT id, name, country_id AS countryId, website, email, phone FROM contractors WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Contractor with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkContractorExistsByName = async (name: string): Promise<number> => {
  const [rows] = await promisePool.query<GetContractor[]>(
    'SELECT id FROM contractors WHERE name = ?',
    [name]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postContractor = async (
  contractorData: PostContractor
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO contractors (name, country_id, website, email, phone) VALUES (?, ?, ?, ?, ?)',
    [
      contractorData.name,
      contractorData.countryId,
      contractorData.website,
      contractorData.email,
      contractorData.phone
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create contractor', 500);
  }
  return headers.insertId;
};
const putContractor = async (
  contractorData: PutContractor,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE contractors SET ? WHERE id = ?', [
    contractorData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Contractor with id ${id} not found`, 404);
  }
  return true;
};

const deleteContractor = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM contractors WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Contractor with id ${id} not found`, 404);
  }
  return true;
};
export {
  getAllContractors,
  getContractor,
  checkContractorExistsByName,
  postContractor,
  putContractor,
  deleteContractor
};
