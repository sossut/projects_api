import { promisePool } from '../../database/db';

import {
  BuildingUse,
  GetBuildingUse,
  PostBuildingUse,
  PutBuildingUse
} from '../../interfaces/BuildingUse';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllBuildingUses = async (): Promise<BuildingUse[]> => {
  const [rows] = await promisePool.query<GetBuildingUse[]>(
    'SELECT id, building_use AS buildingUse FROM building_uses'
  );
  if (rows.length === 0) {
    throw new CustomError('No building uses found', 404);
  }
  return rows;
};

const getBuildingUse = async (id: number): Promise<BuildingUse> => {
  const [rows] = await promisePool.query<GetBuildingUse[]>(
    'SELECT id, building_use AS buildingUse FROM building_uses WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Building use with id ${id} not found`, 404);
  }
  return rows[0];
};

const checkBuildingUseExistsByName = async (
  buildingUse: string
): Promise<number> => {
  const [rows] = await promisePool.query<GetBuildingUse[]>(
    'SELECT id FROM building_uses WHERE building_use = ?',
    [buildingUse]
  );
  return rows.length > 0 ? (rows[0].id as number) : 0;
};

const postBuildingUse = async (
  buildingUseData: PostBuildingUse
): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO building_uses (building_use) VALUES (?)',
    [buildingUseData.buildingUse]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create building use', 500);
  }
  return headers.insertId;
};

const putBuildingUse = async (
  buildingUseData: PutBuildingUse,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE building_uses SET ? WHERE id = ?', [
    buildingUseData,
    id
  ]);
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Building use with id ${id} not found`, 404);
  }
  return true;
};
const deleteBuildingUse = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM building_uses WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Building use with id ${id} not found`, 404);
  }
  return true;
};

export {
  getAllBuildingUses,
  getBuildingUse,
  checkBuildingUseExistsByName,
  postBuildingUse,
  putBuildingUse,
  deleteBuildingUse
};
