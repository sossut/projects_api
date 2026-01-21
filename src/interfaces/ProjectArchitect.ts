import { RowDataPacket } from 'mysql2';

interface ProjectArchitect {
  projectId: number;
  architectId: number;
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
