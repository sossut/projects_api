import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Contractor } from './Contractor';

interface ConsultantsPresence {
  consultantId: number | Contractor;
  countryId: number | Country;
}

interface GetConsultantsPresence extends RowDataPacket, ConsultantsPresence {}

type PostConsultantsPresence = ConsultantsPresence;

type PutConsultantsPresence = Partial<PostConsultantsPresence>;

export {
  ConsultantsPresence,
  GetConsultantsPresence,
  PostConsultantsPresence,
  PutConsultantsPresence
};
