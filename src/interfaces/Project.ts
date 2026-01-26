/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';
import { Address } from './Address';
import { BuildingType } from './BuildingType';
import { Developer } from './Developer';
import { Architect } from './Architect';
import { Contractor } from './Contractor';
import { ProjectMedia } from './ProjectMedia';
import { SourceLink } from './SourceLink';

interface Project {
  id?: number;
  name: string;
  addressId: number | Address;
  expectedDateText?: string;
  earliestDate?: Date;
  latestDate?: Date;
  expectedCompletionWindow?: {
    expected?: string;
    earliest?: string;
    latest?: string;
  };
  buildingHeightMeters?: number;
  buildingHeightFloors?: number;
  buildingTypeId?: number | BuildingType;
  buildingType?: string;
  buildingUse?: string[];
  budgetEur?: number;
  glassFacade?: 'yes' | 'no' | 'unknown';
  facadeBasis?:
    | 'renderings'
    | 'construction_photos'
    | 'architectural_specs'
    | 'mixed'
    | 'unknown';
  status?:
    | 'planned'
    | 'approved'
    | 'proposed'
    | 'on_hold'
    | 'under_construction';
  lastVerifiedDate?: Date;
  confidenceScore?: 'low' | 'medium' | 'high';
  isActive?: boolean;
  projectKey?: string; //lower(trim(name)) + "|" + lower(trim(city)) + "|" + lower(trim(country))
  location?: {
    continent: string;
    address: string;
    country: string;
    city: string;
    metroArea: string; //same as search area,
    postcode?: string;
  };
  projectWebsites?: string[];
  developers?: Developer[];
  architects?: Architect[];
  contractors?: Contractor[];
  media?: ProjectMedia[];
  sources?: SourceLink[];
}

interface GetProject extends RowDataPacket, Project {}

type PostProject = Omit<Project, 'id'>;

type PutProject = Partial<PostProject>;

export { Project, GetProject, PostProject, PutProject };
