import { RowDataPacket } from 'mysql2';
import { Point } from 'geojson';
import { City } from './City';

interface Address {
  id: number;
  address: string;
  location: Point;
  postcode: string;
  cityId: number | City;
}

interface GetAddress extends RowDataPacket, Address {}

type PostAddress = Omit<Address, 'id'>;

type PutAddress = Partial<PostAddress>;

export { Address, GetAddress, PostAddress, PutAddress };
