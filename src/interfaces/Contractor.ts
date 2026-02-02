import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Continent } from './Continent';

interface Contractor {
  id?: number;
  name: string;
  hqCountryId?: number | Country | null;
  hqCountry?: string | Country | null;
  hqContinent?: string | Continent | null;
  website?: string;
  email?: string;
  phone?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

interface GetContractor extends RowDataPacket, Contractor {}

type PostContractor = Omit<Contractor, 'id'>;

type PutContractor = Partial<PostContractor>;

export { Contractor, GetContractor, PostContractor, PutContractor };
