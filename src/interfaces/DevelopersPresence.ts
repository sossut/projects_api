import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Developer } from './Developer';

interface DevelopersPresence {
  developerId: number | Developer;
  countryId: number | Country;
}
interface GetDevelopersPresence extends RowDataPacket, DevelopersPresence {}

type PostDevelopersPresence = DevelopersPresence;
type PutDevelopersPresence = Partial<PostDevelopersPresence>;

export {
  DevelopersPresence,
  GetDevelopersPresence,
  PostDevelopersPresence,
  PutDevelopersPresence
};
