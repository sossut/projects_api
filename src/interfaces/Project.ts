import { RowDataPacket } from 'mysql2';
import { Address } from './Address';
import { BuildingType } from './BuildingType';

interface Project {
  id: number;
  name: string;
  addressId: number | Address;
  expectedCompletionDate: Date;
  earliestExpectedCompletionDate?: Date;
  latestExpectedCompletionDate?: Date;
  buildingHeightMeters?: number;
  buildingHeightFloors?: number;
  buildingTypeId?: number | BuildingType;
  budgetEur?: number;
}

interface GetProject extends RowDataPacket, Project {}

type PostProject = Omit<Project, 'id'>;

type PutProject = Partial<PostProject>;

export { Project, GetProject, PostProject, PutProject };
