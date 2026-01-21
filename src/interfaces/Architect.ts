import { RowDataPacket } from 'mysql2';
import { Country } from './Country';

interface Architect {
  id: number;
  name: string;
  website?: string;
  countryId: number | Country;
  email?: string;
  phone?: string;
}

interface GetArchitect extends RowDataPacket, Architect {}

type PostArchitect = Omit<Architect, 'id'>;

type PutArchitect = Partial<PostArchitect>;

export { Architect, GetArchitect, PostArchitect, PutArchitect };
