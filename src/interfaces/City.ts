import { RowDataPacket } from 'mysql2';
import { MetroArea } from './MetroArea';

interface City {
  id?: number;
  name: string;
  metroAreaId: number | MetroArea;
}

interface GetCity extends RowDataPacket, City {}
type PostCity = Omit<City, 'id'>;

type PutCity = Partial<PostCity>;

export { City, GetCity, PostCity, PutCity };
