import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Continent } from './Continent';

interface SearchArea {
  id?: number;
  name: string;
  lastSearchedAt: Date;
  continent?: Continent;
  country?: Country;
  countryId: number | Country;
}

interface GetSearchArea extends RowDataPacket, SearchArea {}

type PostSearchArea = Omit<SearchArea, 'id'>;

type PutSearchArea = Partial<PostSearchArea>;

export { SearchArea, GetSearchArea, PostSearchArea, PutSearchArea };
