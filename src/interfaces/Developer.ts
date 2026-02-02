import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Continent } from './Continent';

interface Developer {
  id?: number;
  name: string;
  website?: string;
  hqCountryId?: number | Country | null;
  hqCountry?: string | Country | null;
  hqContinent?: string | Continent | null;
  email?: string;
  phone?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
  source?: string;
}

interface GetDeveloper extends RowDataPacket, Developer {}

type PostDeveloper = Omit<Developer, 'id'>;

type PutDeveloper = Partial<PostDeveloper>;

export { Developer, GetDeveloper, PostDeveloper, PutDeveloper };
