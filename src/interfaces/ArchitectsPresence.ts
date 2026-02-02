import { RowDataPacket } from 'mysql2';
import { Architect } from './Architect';
import { Country } from './Country';

interface ArchitectsPresence {
  architectId: number | Architect;
  countryId: number | Country;
}

interface GetArchitectsPresence extends RowDataPacket, ArchitectsPresence {}

type PostArchitectsPresence = ArchitectsPresence;

type PutArchitectsPresence = Partial<PostArchitectsPresence>;

export {
  ArchitectsPresence,
  GetArchitectsPresence,
  PostArchitectsPresence,
  PutArchitectsPresence
};
