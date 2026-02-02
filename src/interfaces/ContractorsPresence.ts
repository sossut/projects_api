import { RowDataPacket } from 'mysql2';
import { Contractor } from './Contractor';
import { Country } from './Country';

interface ContractorsPresence {
  contractorId: number | Contractor;
  countryId: number | Country;
}

interface GetContractorsPresence extends RowDataPacket, ContractorsPresence {}

type PostContractorsPresence = ContractorsPresence;

type PutContractorsPresence = Partial<PostContractorsPresence>;

export {
  ContractorsPresence,
  GetContractorsPresence,
  PostContractorsPresence,
  PutContractorsPresence
};
