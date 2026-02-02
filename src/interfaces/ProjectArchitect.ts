import { RowDataPacket } from 'mysql2';

interface ProjectArchitect {
  projectId: number;
  architectId: number;
  source: string;
}

interface GetProjectArchitect extends RowDataPacket, ProjectArchitect {}

type PostProjectArchitect = ProjectArchitect;

type PutProjectArchitect = Partial<PostProjectArchitect>;

export {
  ProjectArchitect,
  GetProjectArchitect,
  PostProjectArchitect,
  PutProjectArchitect
};
