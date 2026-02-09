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
    | 'company'
    | 'metro_area';
  targetId?: number;
  startedAt: Date;
  finishedAt?: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorText?: string | null;
  sourcesFound?: number;
  fieldsUpdated?: JsonValue;
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface GetSearch extends RowDataPacket, Search {}

type PostSearch = Omit<Search, 'id' | 'finishedAt' | 'status' | 'errorText'>;

type PutSearch = Partial<Omit<Search, 'id'>>;

export { Search, GetSearch, PostSearch, PutSearch };
