/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface ProjectMedia {
  id: number;
  url: string;
  projectId: number | Project;
  title: string;
  filename?: string;
  mediaType?:
    | 'rendering'
    | 'construction_photo'
    | 'photo'
    | 'other'
    | 'drawing'
    | 'diagram'
    | 'site_plan'
    | 'aerial'
    | 'map';
}

interface GetProjectMedia extends RowDataPacket, ProjectMedia {}

type PostProjectMedia = Omit<ProjectMedia, 'id'>;

type PutProjectMedia = Partial<PostProjectMedia>;

export { ProjectMedia, GetProjectMedia, PostProjectMedia, PutProjectMedia };
