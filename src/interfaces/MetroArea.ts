import { RowDataPacket } from 'mysql2';
import { Country } from './Country';
import { Continent } from './Continent';

interface MetroArea {
  id?: number;
  name: string;
  lastSearchedAt: Date;
  continent?: Continent;
  country?: Country;
  countryId: number | Country;
}

interface GetMetroArea extends RowDataPacket, MetroArea {}

type PostMetroArea = Omit<MetroArea, 'id'>;

type PutMetroArea = Partial<PostMetroArea>;
export { MetroArea, GetMetroArea, PostMetroArea, PutMetroArea };
