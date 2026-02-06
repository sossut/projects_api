import { RowDataPacket } from 'mysql2';
import { MetroArea } from './MetroArea';
import { Project } from './Project';

interface Search {
  id: number;
  metroAreaId?: number | MetroArea | null;
  startedAt: Date;
  finishedAt?: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorText?: string | null;
  projectId?: number | Project;
  projectFirstPassId?: number;
  sourcesFound: number;
  fieldsUpdated: JSON;
}

interface GetSearch extends RowDataPacket, Search {}

type PostSearch = Omit<Search, 'id' | 'finishedAt' | 'status' | 'errorText'>;

type PutSearch = Partial<Omit<Search, 'id'>>;

export { Search, GetSearch, PostSearch, PutSearch };
