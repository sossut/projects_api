/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';

interface ProjectFirstPass {
  id?: number;
  name: string;
  address: string;
  metroArea: string;
  city: string;
  country: string;
  continent: string;
  buildingHeightMeters?: number | null;
  buildingType: string;
  buildingUse: string[];
  status: string;
  expectedDateText: string;
  lastVerifiedDate: Date;
  promoted?: 0 | 1;
  updatedAt?: Date;
  sources: {
    publisher: string;
    url: string;
  }[];
}

interface GetProjectFirstPass extends RowDataPacket, ProjectFirstPass {}

type PostProjectFirstPass = Omit<ProjectFirstPass, 'id'>;

type PutProjectFirstPass = Partial<
  Omit<ProjectFirstPass, 'id' | 'lastVerifiedDate'>
>;

export {
  ProjectFirstPass,
  GetProjectFirstPass,
  PostProjectFirstPass,
  PutProjectFirstPass
};
