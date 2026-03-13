/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface ProjectMedia {
  id?: number;
  url: string;
  projectId: number | Project;
  title: string;
  filename?: string;
  sourcePage?: string | null;
  mediaType?: string | null;
  createdAt?: Date;
  mediaDate?: Date | null;
}

interface GetProjectMedia extends RowDataPacket, ProjectMedia {}

type PostProjectMedia = Omit<ProjectMedia, 'id'>;

type PutProjectMedia = Partial<PostProjectMedia>;

export { ProjectMedia, GetProjectMedia, PostProjectMedia, PutProjectMedia };
