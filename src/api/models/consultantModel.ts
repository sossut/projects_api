import { promisePool } from '../../database/db';

import {
  Consultant,
  GetConsultant,
  PostConsultant,
  PutConsultant
} from '../../interfaces/Consultant';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllConsultants = async (): Promise<Consultant[]> => {
  const [rows] = await promisePool.query<GetConsultant[]>(
    `SELECT
      id,
      name,
      hq_country_id AS hqCountryId,
      website,
      email,
      phone
      FROM consultants`
  );
  if (rows.length === 0) {
    throw new CustomError('No consultants found', 404);
  }
  return rows;
};

const getConsultant = async (id: number): Promise<Consultant> => {
  const [rows] = await promisePool.query<GetConsultant[]>(
    `SELECT
      id,
      name,
      hq_country_id AS hqCountryId,
      website,
      email,
      phone
      FROM consultants WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Consultant with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkConsultantExistsByName = async (
  name: string
): Promise<number | null> => {
  const [rows] = await promisePool.query<GetConsultant[]>(
    `SELECT 
    id FROM consultants WHERE name = ?`,
    [name]
  );

  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postConsultant = async (
  consultantData: PostConsultant
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO consultants (name, hq_country_id, website, email, phone) VALUES (?, ?, ?, ?, ?)',
    [
      consultantData.name,
      consultantData.hqCountryId,
      consultantData.website,
      consultantData.email,
      consultantData.phone
    ]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create consultant', 500);
  } else {
    return headers.insertId;
  }
};

const putConsultant = async (
  consultantData: PutConsultant,
  id: number
): Promise<boolean> => {
  const snakeCaseData = toSnake(consultantData) as any;
  const sql = promisePool.format('UPDATE consultants SET ? WHERE id = ?', [
    snakeCaseData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Failed to update consultant with id ${id}`, 500);
  }
  return headers.affectedRows > 0;
};

const deleteConsultant = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM consultants WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Consultant with id ${id} not found`, 404);
  }
  return headers.affectedRows > 0;
};

export {
  getAllConsultants,
  getConsultant,
  checkConsultantExistsByName,
  postConsultant,
  putConsultant,
  deleteConsultant
};
