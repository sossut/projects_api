import { promisePool } from '../../database/db';

import {
  ContractorsPresence,
  GetContractorsPresence,
  PostContractorsPresence,
  PutContractorsPresence
} from '../../interfaces/ContractorsPresence';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
const getAllContractorsPresence = async (): Promise<ContractorsPresence[]> => {
  const [rows] = await promisePool.query<GetContractorsPresence[]>(
    'SELECT contractor_id AS contractorId, country_id AS countryId FROM contractors_presence'
  );
  if (rows.length === 0) {
    throw new CustomError('No contractors presence found', 404);
  }
  return rows;
};

const getContractorsPresence = async (
  contractorId: number
): Promise<ContractorsPresence[]> => {
  const [rows] = await promisePool.query<GetContractorsPresence[]>(
    'SELECT contractor_id AS contractorId, country_id AS countryId FROM contractors_presence WHERE contractor_id = ?',
    [contractorId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Contractors presence with contractor id ${contractorId} not found`,
      404
    );
  }
  return rows;
};

const checkContractorPresenceInCountry = async (
  contractorId: number,
  countryId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetContractorsPresence[]>(
    'SELECT contractor_id AS contractorId, country_id AS countryId FROM contractors_presence WHERE contractor_id = ? AND country_id = ?',
    [contractorId, countryId]
  );
  return rows.length > 0;
};

const postContractorsPresence = async (
  contractorsPresenceData: PostContractorsPresence
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO contractors_presence (contractor_id, country_id) VALUES (?, ?)',
    [contractorsPresenceData.contractorId, contractorsPresenceData.countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create contractors presence', 500);
  }
  return headers.insertId;
};
const putContractorsPresence = async (
  contractorsPresenceData: PutContractorsPresence
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'UPDATE contractors_presence SET country_id = ? WHERE contractor_id = ?',
    [contractorsPresenceData.countryId, contractorsPresenceData.contractorId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to update contractors presence', 500);
  }
  return true;
};

const deleteContractorsPresence = async (
  contractorId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM contractors_presence WHERE contractor_id = ?',
    [contractorId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `Contractors presence with contractor id ${contractorId} not found`,
      404
    );
  }
  return true;
};

export {
  getAllContractorsPresence,
  getContractorsPresence,
  checkContractorPresenceInCountry,
  postContractorsPresence,
  putContractorsPresence,
  deleteContractorsPresence
};
