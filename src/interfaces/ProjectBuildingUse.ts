import { RowDataPacket } from 'mysql2';
import { Project } from './Project';
import { BuildingUse } from './BuildingUse';

interface ProjectBuildingUse {
  projectId: number | Project;
  buildingUseId: number | BuildingUse;
}

interface GetProjectBuildingUse extends RowDataPacket, ProjectBuildingUse {}

type PostProjectBuildingUse = ProjectBuildingUse;

type PutProjectBuildingUse = Partial<PostProjectBuildingUse>;

export {
  ProjectBuildingUse,
  GetProjectBuildingUse,
  PostProjectBuildingUse,
  PutProjectBuildingUse
};
