import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface ProjectWebsite {
  id: number;
  url: string;
  projectId: number | Project;
}

interface GetProjectWebsite extends RowDataPacket, ProjectWebsite {}

type PostProjectWebsite = Omit<ProjectWebsite, 'id'>;

type PutProjectWebsite = Partial<PostProjectWebsite>;

export {
  ProjectWebsite,
  GetProjectWebsite,
  PostProjectWebsite,
  PutProjectWebsite
};
