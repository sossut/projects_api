import { RowDataPacket } from 'mysql2';
import { Country } from './Country';

interface Developer {
  id: number;
  name: string;
  website?: string;
  countryId: number | Country;
  email?: string;
  phone?: string;
}

interface GetDeveloper extends RowDataPacket, Developer {}

type PostDeveloper = Omit<Developer, 'id'>;

type PutDeveloper = Partial<PostDeveloper>;

export { Developer, GetDeveloper, PostDeveloper, PutDeveloper };
