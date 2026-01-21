import { RowDataPacket } from 'mysql2';

interface ProjectDeveloper {
  projectId: number;
  developerId: number;
}

interface GetProjectDeveloper extends RowDataPacket, ProjectDeveloper {}

type PostProjectDeveloper = ProjectDeveloper;

type PutProjectDeveloper = Partial<PostProjectDeveloper>;

export {
  ProjectDeveloper,
  GetProjectDeveloper,
  PostProjectDeveloper,
  PutProjectDeveloper
};
