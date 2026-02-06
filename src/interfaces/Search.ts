/* eslint-disable @typescript-eslint/indent */
import { RowDataPacket } from 'mysql2';

interface Search {
  id: number;
  targetType:
    | 'project'
    | 'project_first_pass'
    | 'developer'
    | 'architect'
    | 'contractor'
    | 'consultant'
    | 'company';
  targetId?: number;
  startedAt: Date;
  finishedAt?: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorText?: string | null;
  sourcesFound?: number;
  fieldsUpdated?: JSON;
}

interface GetSearch extends RowDataPacket, Search {}

type PostSearch = Omit<Search, 'id' | 'finishedAt' | 'status' | 'errorText'>;

type PutSearch = Partial<Omit<Search, 'id'>>;

export { Search, GetSearch, PostSearch, PutSearch };
