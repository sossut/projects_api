import { RowDataPacket } from 'mysql2';

interface Person {
  id?: number;
  name: string;
  role?: string;
  developerId?: number;
  architectId?: number;
  contractorId?: number;
  consultantId?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
  email?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GetPerson extends RowDataPacket, Person {}

type PostPerson = Omit<Person, 'id'>;

type PutPerson = Partial<Omit<Person, 'id'>>;

export { Person, GetPerson, PostPerson, PutPerson };
