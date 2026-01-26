import { promisePool } from '../../database/db';

import {
  BuildingType,
  GetBuildingType,
  PostBuildingType,
  PutBuildingType
} from '../../interfaces/BuildingType';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllBuildingTypes = async (): Promise<BuildingType[]> => {
  const [rows] = await promisePool.query<GetBuildingType[]>(
    'SELECT id, building_type AS buildingType FROM building_types'
  );
  if (rows.length === 0) {
    throw new CustomError('No building types found', 404);
  }
  return rows;
};

const getBuildingType = async (id: number): Promise<BuildingType> => {
  const [rows] = await promisePool.query<GetBuildingType[]>(
    'SELECT id, building_type AS buildingType FROM building_types WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Building type with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkBuildingTypeExistsByName = async (
  buildingType: string
): Promise<number> => {
  const [rows] = await promisePool.query<GetBuildingType[]>(
    'SELECT id FROM building_types WHERE building_type = ?',
    [buildingType]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postBuildingType = async (
  buildingTypeData: PostBuildingType
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO building_types (building_type) VALUES (?)',
    [buildingTypeData.buildingType]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create building type', 500);
  }
  return headers.insertId;
};

const putBuildingType = async (
  buildingTypeData: PutBuildingType,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE building_types SET ? WHERE id = ?', [
    buildingTypeData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Building type with id ${id} not found`, 404);
  }
  return true;
};

const deleteBuildingType = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM building_types WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Building type with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllBuildingTypes,
  getBuildingType,
  checkBuildingTypeExistsByName,
  postBuildingType,
  putBuildingType,
  deleteBuildingType
};
