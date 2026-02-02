import { RowDataPacket } from 'mysql2';
import { Project } from './Project';
import { Contractor } from './Contractor';

interface ProjectContractor {
  projectId: number | Project;
  contractorId: number | Contractor;
  source: string;
}

interface GetProjectContractor extends RowDataPacket, ProjectContractor {}

type PostProjectContractor = ProjectContractor;

type PutProjectContractor = Partial<PostProjectContractor>;

export {
  ProjectContractor,
  GetProjectContractor,
  PostProjectContractor,
  PutProjectContractor
};
