import { RowDataPacket } from 'mysql2';

interface SearchSource {
  id: number;
  searchId: number; // FK to Search
  url: string;
  title: string;
  relevanceScore?: number;
  dataContributed: string[]; // ["developers", "buildingHeight"]
  fetchedAt: Date;
}

interface GetSearchSource extends RowDataPacket, SearchSource {}

type PostSearchSource = Omit<SearchSource, 'id' | 'fetchedAt'>;
type PutSearchSource = Partial<Omit<SearchSource, 'id' | 'searchId'>>;

export { SearchSource, GetSearchSource, PostSearchSource, PutSearchSource };
