import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Continent } from './Continent';

interface Architect {
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
}

interface GetArchitect extends RowDataPacket, Architect {}

type PostArchitect = Omit<Architect, 'id'>;

type PutArchitect = Partial<PostArchitect>;

export { Architect, GetArchitect, PostArchitect, PutArchitect };
