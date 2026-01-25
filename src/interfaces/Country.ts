import { RowDataPacket } from 'mysql2';
import { Continent } from './Continent';

interface Country {
  id?: number;
  name: string;
  code?: string | null;
  continentId: number | Continent;
}

interface GetCountry extends RowDataPacket, Country {}

type PostCountry = Omit<Country, 'id'>;

type PutCountry = Partial<PostCountry>;

export { Country, GetCountry, PostCountry, PutCountry };
