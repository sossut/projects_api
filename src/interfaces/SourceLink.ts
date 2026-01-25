import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface SourceLink {
  id: number;
  url: string;
  projectId: number | Project;
  sourceType:
    | 'developer'
    | 'architect'
    | 'planning'
    | 'database'
    | 'media'
    | 'other';
  publisher: string;
  accessedAt: Date;
}

interface GetSourceLink extends RowDataPacket, SourceLink {}

type PostSourceLink = Omit<SourceLink, 'id'>;

type PutSourceLink = Partial<PostSourceLink>;

export { SourceLink, GetSourceLink, PostSourceLink, PutSourceLink };
