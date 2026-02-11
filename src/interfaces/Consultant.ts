import { RowDataPacket } from 'mysql2';
import { Continent } from './Continent';
import { Country } from './Country';

interface Consultant {
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
  source?: string;
}

interface GetConsultant extends RowDataPacket, Consultant {}

type PostConsultant = Omit<Consultant, 'id'>;

type PutConsultant = Partial<PostConsultant>;

export { Consultant, GetConsultant, PostConsultant, PutConsultant };
