import { RowDataPacket } from 'mysql2';
import { Country } from './Country';

interface Contractor {
  id: number;
  name: string;
  countryId?: number | Country;
  website?: string;
  email?: string;
  phone?: string;
}

interface GetContractor extends RowDataPacket, Contractor {}

type PostContractor = Omit<Contractor, 'id'>;

type PutContractor = Partial<PostContractor>;

export { Contractor, GetContractor, PostContractor, PutContractor };
