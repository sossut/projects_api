import { RowDataPacket } from 'mysql2';
import { SearchArea } from './SearchArea';

interface City {
  id?: number;
  name: string;
  searchAreaId: number | SearchArea;
}

interface GetCity extends RowDataPacket, City {}
type PostCity = Omit<City, 'id'>;

type PutCity = Partial<PostCity>;

export { City, GetCity, PostCity, PutCity };
