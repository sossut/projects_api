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
  expectedDateText?: string | null;
  earliestDateText?: string | null;
  latestDateText?: string | null;
  expectedCompletionWindow?: {
    expected?: string;
    earliest?: string;
    latest?: string;
  };
  buildingHeightMeters?: number | null;
  buildingHeightFloors?: number | null;
  buildingTypeId?: number | BuildingType;
  buildingType?: string;
  buildingUse?: string[];
  budgetEur?: number;
  glassFacade?: 'yes' | 'no' | 'unknown' | true | false | 0 | 1 | null | 'null';
  facadeBasis?: string;
  status?:
    | 'planned'
    | 'approved'
    | 'proposed'
    | 'on_hold'
    | 'under_construction'
    | 'completed'
    | 'cancelled';
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
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  projectWebsites?: string[];
  developers?: Developer[];
  architects?: Architect[];
  contractors?: Contractor[];
  media?: ProjectMedia[];
  sources?: SourceLink[];
  projects?: Project[];
}

interface GetProject extends RowDataPacket, Project {}

type PostProject = Omit<Project, 'id'>;

type PutProject = Partial<PostProject>;

export { Project, GetProject, PostProject, PutProject };
