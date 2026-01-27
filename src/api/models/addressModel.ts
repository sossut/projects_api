import { promisePool } from '../../database/db';

import {
  Address,
  GetAddress,
  PostAddress,
  PutAddress
} from '../../interfaces/Address';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllAddresses = async (): Promise<Address[]> => {
  const [rows] = await promisePool.query<GetAddress[]>(
    'SELECT id, address, city_id AS cityId, postcode AS postalCode FROM addresses'
  );
  if (rows.length === 0) {
    throw new CustomError('No addresses found', 404);
  }
  return rows;
};
const getAddress = async (id: number): Promise<Address> => {
  const [rows] = await promisePool.query<GetAddress[]>(
    'SELECT id, address, city_id AS cityId, postcode AS postalCode FROM addresses WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    throw new CustomError(`Address with id ${id} not found`, 404);
  }
  return rows[0];
};

const getAddressByProjectId = async (projectId: number): Promise<Address> => {
  const [rows] = await promisePool.query<GetAddress[]>(
    `SELECT addresses.id, addresses.address, addresses.city_id AS cityId, addresses.postcode AS postalCode
    FROM addresses
    JOIN projects ON addresses.id = projects.address_id
    WHERE projects.id = ?`,
    [projectId]
  );
  if (rows.length === 0) {
    throw new CustomError(`Address for project id ${projectId} not found`, 404);
  }
  return rows[0];
};

const postAddress = async (addressData: PostAddress): Promise<number> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO addresses (address, city_id, postcode) VALUES (?, ?, ?)',
    [addressData.address, addressData.cityId, addressData.postcode]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError('Failed to create address', 500);
  }
  return headers.insertId;
};

const putAddress = async (
  addressData: PutAddress,
  id: number
): Promise<boolean> => {
  const sql = promisePool.format('UPDATE addresses SET ? WHERE id = ?', [
    addressData,
    id
  ]);

  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`Address with id ${id} not found`, 404);
  }
  return true;
};
const deleteAddress = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM addresses WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`Address with id ${id} not found`, 404);
  }
  return true;
};
export {
  getAllAddresses,
  getAddress,
  getAddressByProjectId,
  postAddress,
  putAddress,
  deleteAddress
};
