import { promisePool } from '../../database/db';

import {
  ProjectPerson,
  GetProjectPerson,
  PostProjectPerson,
  PutProjectPerson
} from '../../interfaces/ProjectPerson';
import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { toSnake } from '../../utils/utilities';

const getAllProjectPersons = async (): Promise<ProjectPerson[]> => {
  const [rows] = await promisePool.query<GetProjectPerson[]>(
    `SELECT
      id,
      project_id AS projectId,
      person_id AS personId,
      role
      FROM project_persons`
  );
  if (rows.length === 0) {
    throw new CustomError('No project persons found', 404);
  }
  return rows;
};

const getProjectPerson = async (id: number): Promise<ProjectPerson> => {
  const [rows] = await promisePool.query<GetProjectPerson[]>(
    `SELECT
      id,
      project_id AS projectId,
      person_id AS personId,
      role
      FROM project_persons WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`ProjectPerson with id ${id} not found`, 404);
  }
  return rows[0];
};

const postProjectPerson = async (
  projectPersonData: PostProjectPerson
): Promise<number> => {
  const snakeData = toSnake(projectPersonData);
  const sql = promisePool.format(
    'INSERT INTO project_persons SET ?',
    snakeData
  );
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  return headers.insertId;
};

const putProjectPerson = async (
  id: number,
  projectPersonData: PutProjectPerson
): Promise<boolean> => {
  const snakeData = toSnake(projectPersonData);
  const sql = promisePool.format('UPDATE project_persons SET ? WHERE id = ?', [
    snakeData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectPerson with id ${id} not found`, 404);
  }
  return true;
};

const deleteProjectPerson = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM project_persons WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`ProjectPerson with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllProjectPersons,
  getProjectPerson,
  postProjectPerson,
  putProjectPerson,
  deleteProjectPerson
};
