import { RowDataPacket } from 'mysql2';
import { SearchArea } from './SearchArea';

interface Search {
  id: number;
  searchAreaId: number | SearchArea;
  typeParam: string;
  startedAt: Date;
  finishedAt?: Date | null;
  status: 'running' | 'completed' | 'failed';
  errorText?: string | null;
}

interface GetSearch extends RowDataPacket, Search {}

type PostSearch = Omit<Search, 'id' | 'finishedAt' | 'status' | 'errorText'>;

type PutSearch = Partial<Omit<Search, 'id'>>;

export { Search, GetSearch, PostSearch, PutSearch };
