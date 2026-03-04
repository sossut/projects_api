import { promisePool } from '../../database/db';

import {
  Person,
  GetPerson,
  PostPerson,
  PutPerson
} from '../../interfaces/Person';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllPersons = async (): Promise<Person[]> => {
  const [rows] = await promisePool.query<GetPerson[]>(
    `SELECT
      id,
      name,
      role,
      company_type AS companyType,
      company_id AS companyId,
      linkedin_url AS linkedinUrl,
      twitter_url AS twitterUrl,
      email,
      phone,
      created_at AS createdAt,
      updated_at AS updatedAt
      FROM persons`
  );
  if (rows.length === 0) {
    throw new CustomError('No persons found', 404);
  }
  return rows;
};

const getPerson = async (id: number): Promise<Person> => {
  const [rows] = await promisePool.query<GetPerson[]>(
    `SELECT
      id,
      name,
      role,
      company_type AS companyType,
      company_id AS companyId,
      linkedin_url AS linkedinUrl,
      twitter_url AS twitterUrl,
      email,
      phone,
      created_at AS createdAt,
      updated_at AS updatedAt
      FROM persons WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Person with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkPersonExistsByEmail = async (email: string): Promise<boolean> => {
  const [rows] = await promisePool.query<GetPerson[]>(
    'SELECT id FROM persons WHERE email = ?',
    [email]
  );
  return rows.length > 0;
};

const postPerson = async (personData: PostPerson): Promise<number> => {
  const snakeData = toSnake(personData);
  const sql = promisePool.format('INSERT INTO persons SET ?', [snakeData]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create person', 500);
  }
  return headers.insertId;
};

const putPerson = async (
  personData: PutPerson,
  id: number
): Promise<boolean> => {
  const snakeData = toSnake(personData);
  const sql = promisePool.format('UPDATE persons SET ? WHERE id = ?', [
    snakeData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Person with id ${id} not found`, 404);
  }
  return true;
};

const deletePerson = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM persons WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Person with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllPersons,
  getPerson,
  checkPersonExistsByEmail,
  postPerson,
  putPerson,
  deletePerson
};
