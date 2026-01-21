import { RowDataPacket } from 'mysql2';
import { Country } from './Country';

interface SearchArea {
  id: number;
  name: string;
  lastSearchedAt: Date;
  countryId: number | Country;
}

interface GetSearchArea extends RowDataPacket, SearchArea {}

type PostSearchArea = Omit<SearchArea, 'id'>;

type PutSearchArea = Partial<PostSearchArea>;

export { SearchArea, GetSearchArea, PostSearchArea, PutSearchArea };
