import { promisePool } from '../../database/db';

import {
  Address,
  GetAddress,
  PostAddress,
  PutAddress
} from '../../interfaces/Address';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';
import { Point } from 'geojson';

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
  const location = addressData.location as Point;
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO addresses (address, city_id, postcode, location) VALUES (?, ?, ?, POINT(?, ?))',
    [
      addressData.address,
      addressData.cityId,
      addressData.postcode,
      location.coordinates[0],
      location.coordinates[1]
    ]
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
  const fields = Object.keys(addressData)
    .map((key) => {
      if (key === 'location') {
        return `${key} = ST_GeomFromGeoJSON(?)`;
      } else {
        return `${key} = ?`;
      }
    })
    .join(', ');
  const values = Object.values(addressData).map((value) => {
    if (
      value &&
      typeof value === 'object' &&
      'type' in value &&
      'coordinates' in value
    ) {
      return JSON.stringify(value);
    }
    return value;
  });
  values.push(id);

  const sql = promisePool.format(
    `UPDATE addresses SET ${fields} WHERE id = ?`,
    values
  );
  console.log(sql);
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
