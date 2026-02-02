import { promisePool } from '../../database/db';

import {
  ArchitectsPresence,
  GetArchitectsPresence,
  PostArchitectsPresence,
  PutArchitectsPresence
} from '../../interfaces/ArchitectsPresence';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
const getAllArchitectsPresence = async (): Promise<ArchitectsPresence[]> => {
  const [rows] = await promisePool.query<GetArchitectsPresence[]>(
    'SELECT architect_id AS architectId, country_id AS countryId FROM architects_presence'
  );
  if (rows.length === 0) {
    throw new CustomError('No architects presence found', 404);
  }
  return rows;
};
const getArchitectsPresence = async (
  architectId: number
): Promise<ArchitectsPresence[]> => {
  const [rows] = await promisePool.query<GetArchitectsPresence[]>(
    'SELECT architect_id AS architectId, country_id AS countryId FROM architects_presence WHERE architect_id = ?',
    [architectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Architects presence with architect id ${architectId} not found`,
      404
    );
  }
  return rows;
};

const checkArchitectPresenceInCountry = async (
  architectId: number,
  countryId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetArchitectsPresence[]>(
    'SELECT architect_id AS architectId, country_id AS countryId FROM architects_presence WHERE architect_id = ? AND country_id = ?',
    [architectId, countryId]
  );
  return rows.length > 0;
};

const postArchitectsPresence = async (
  architectsPresenceData: PostArchitectsPresence
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO architects_presence (architect_id, country_id) VALUES (?, ?)',
    [architectsPresenceData.architectId, architectsPresenceData.countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create architects presence', 500);
  }
  return headers.insertId;
};
const putArchitectsPresence = async (
  architectsPresenceData: PutArchitectsPresence
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'UPDATE architects_presence SET country_id = ? WHERE architect_id = ?',
    [architectsPresenceData.countryId, architectsPresenceData.architectId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to update architects presence', 500);
  }
  return true;
};

const deleteArchitectsPresence = async (
  architectId: number,
  countryId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM architects_presence WHERE architect_id = ? AND country_id = ?',
    [architectId, countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to delete architects presence', 500);
  }
  return true;
};
export {
  getAllArchitectsPresence,
  getArchitectsPresence,
  checkArchitectPresenceInCountry,
  postArchitectsPresence,
  putArchitectsPresence,
  deleteArchitectsPresence
};
