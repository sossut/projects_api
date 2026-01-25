/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';
import { Address } from './Address';
import { BuildingType } from './BuildingType';

interface Project {
  id: number;
  name: string;
  addressId: number | Address;
  expectedDateText?: string;
  earliestDate?: Date;
  latestDate?: Date;
  buildingHeightMeters?: number;
  buildingHeightFloors?: number;
  buildingTypeId?: number | BuildingType;
  budgetEur?: number;
  glassFacade?: 'yes' | 'no' | 'unknown';
  facadeBasis?:
    | 'renderings'
    | 'construction_photos'
    | 'architectural_specs'
    | 'mixed'
    | 'unknown';
  status:
    | 'planned'
    | 'approved'
    | 'proposed'
    | 'on_hold'
    | 'under_construction';
  lastVerifiedDate?: Date;
  confidenceScore?: 'low' | 'medium' | 'high';
  isActive: boolean;
  projectKey: string; //lower(trim(name)) + "|" + lower(trim(city)) + "|" + lower(trim(country))
}

interface GetProject extends RowDataPacket, Project {}

type PostProject = Omit<Project, 'id'>;

type PutProject = Partial<PostProject>;

export { Project, GetProject, PostProject, PutProject };
