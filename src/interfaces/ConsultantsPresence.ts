import { RowDataPacket } from 'mysql2';
import { Country } from './Country';

import { Consultant } from './Consultant';

interface ConsultantsPresence {
  consultantId: number | Consultant;
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
