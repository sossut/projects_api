import { promisePool } from '../../database/db';

import {
  ConsultantsPresence,
  GetConsultantsPresence,
  PostConsultantsPresence,
  PutConsultantsPresence
} from '../../interfaces/ConsultantsPresence';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';
const getAllConsultantsPresence = async (): Promise<ConsultantsPresence[]> => {
  const [rows] = await promisePool.query<GetConsultantsPresence[]>(
    `SELECT 
      consultant_id AS consultantId, 
      country_id AS countryId 
      FROM consultants_presence`
  );
  if (rows.length === 0) {
    throw new CustomError('No consultants presence found', 404);
  }
  return rows;
};
const getConsultantsPresence = async (
  consultantId: number,
  countryId: number
): Promise<ConsultantsPresence> => {
  const [rows] = await promisePool.query<GetConsultantsPresence[]>(
    `SELECT 
      consultant_id AS consultantId, 
      country_id AS countryId 
      FROM consultants_presence WHERE consultant_id = ? AND country_id = ?`,
    [consultantId, countryId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `Consultants presence with consultantId ${consultantId} and countryId ${countryId} not found`,
      404
    );
  }
  return rows[0];
};

const checkConsultantsPresenceExists = async (
  consultantId: number,
  countryId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetConsultantsPresence[]>(
    'SELECT consultant_id, country_id FROM consultants_presence WHERE consultant_id = ? AND country_id = ?',
    [consultantId, countryId]
  );
  return rows.length > 0;
};

const postConsultantsPresence = async (
  consultantsPresenceData: PostConsultantsPresence
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO consultants_presence (consultant_id, country_id) VALUES (?, ?)',
    [consultantsPresenceData.consultantId, consultantsPresenceData.countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create consultants presence', 500);
  }
  return headers.insertId;
};
const putConsultantsPresence = async (
  consultantsPresenceData: PutConsultantsPresence,
  consultantId: number,
  countryId: number
): Promise<boolean> => {
  const snakeCaseData = toSnake(consultantsPresenceData) as any;
  const sql = promisePool.format(
    'UPDATE consultants_presence SET ? WHERE consultant_id = ? AND country_id = ?',
    [snakeCaseData, consultantId, countryId]
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  return headers.affectedRows > 0;
};

const deleteConsultantsPresence = async (
  consultantId: number,
  countryId: number
): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM consultants_presence WHERE consultant_id = ? AND country_id = ?',
    [consultantId, countryId]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(
      `Consultants presence with consultantId ${consultantId} and countryId ${countryId} not found`,
      404
    );
  }
  return true;
};
export {
  getAllConsultantsPresence,
  getConsultantsPresence,
  checkConsultantsPresenceExists,
  postConsultantsPresence,
  putConsultantsPresence,
  deleteConsultantsPresence
};
