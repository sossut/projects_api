import { promisePool } from '../../database/db';

import {
  DevelopersPresence,
  GetDevelopersPresence,
  PostDevelopersPresence,
  PutDevelopersPresence
} from '../../interfaces/DevelopersPresence';
import CustomError from '../../classes/CustomError';

import { ResultSetHeader } from 'mysql2';
const getAllDevelopersPresence = async (): Promise<DevelopersPresence[]> => {
  const [rows] = await promisePool.query<GetDevelopersPresence[]>(
    'SELECT developer_id AS developerId, country_id AS countryId FROM developers_presence'
  );
  if (rows.length === 0) {
    throw new CustomError('No developers presence found', 404);
  }
  return rows;
};

const getDevelopersPresence = async (
  developerId: number
): Promise<DevelopersPresence[]> => {
  const [rows] = await promisePool.query<GetDevelopersPresence[]>(
    'SELECT developer_id AS developerId, country_id AS countryId FROM developers_presence WHERE developer_id = ?',
    [developerId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Developers presence with developer id ${developerId} not found`,
      404
    );
  }
  return rows;
};

const checkDeveloperPresenceInCountry = async (
  developerId: number,
  countryId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetDevelopersPresence[]>(
    'SELECT developer_id AS developerId, country_id AS countryId FROM developers_presence WHERE developer_id = ? AND country_id = ?',
    [developerId, countryId]
  );
  return rows.length > 0;
};

const postDevelopersPresence = async (
  developersPresenceData: PostDevelopersPresence
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO developers_presence (developer_id, country_id) VALUES (?, ?)',
    [developersPresenceData.developerId, developersPresenceData.countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create developers presence', 500);
  }
  return headers.insertId;
};

const putDevelopersPresence = async (
  developersPresenceData: PutDevelopersPresence
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'UPDATE developers_presence SET country_id = ? WHERE developer_id = ?',
    [developersPresenceData.countryId, developersPresenceData.developerId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to update developers presence', 500);
  }
  return true;
};

const deleteDevelopersPresence = async (
  developerId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM developers_presence WHERE developer_id = ?',
    [developerId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to delete developers presence', 500);
  }
  return true;
};

export {
  getAllDevelopersPresence,
  getDevelopersPresence,
  checkDeveloperPresenceInCountry,
  postDevelopersPresence,
  putDevelopersPresence,
  deleteDevelopersPresence
};
