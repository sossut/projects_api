import { RowDataPacket } from 'mysql2';

interface ProjectPerson {
  personId: number;
  projectId: number;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GetProjectPerson extends RowDataPacket, ProjectPerson {}

type PostProjectPerson = Omit<ProjectPerson, 'createdAt' | 'updatedAt'>;

type PutProjectPerson = Partial<Omit<ProjectPerson, 'createdAt' | 'updatedAt'>>;

export { ProjectPerson, GetProjectPerson, PostProjectPerson, PutProjectPerson };
