import { RowDataPacket } from 'mysql2';
import { Contractor } from './Contractor';
import { Project } from './Project';

interface ProjectConsultant {
  projectId: number | Project;
  consultantId: number | Contractor;
  source: string;
}

interface GetProjectConsultant extends RowDataPacket, ProjectConsultant {}

type PostProjectConsultant = ProjectConsultant;

type PutProjectConsultant = Partial<PostProjectConsultant>;

export {
  ProjectConsultant,
  GetProjectConsultant,
  PostProjectConsultant,
  PutProjectConsultant
};
