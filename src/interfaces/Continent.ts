import { RowDataPacket } from 'mysql2';

interface Continent {
  id: number;
  name: string;
  code?: string;
}

interface GetContinent extends RowDataPacket, Continent {}

type PostContinent = Omit<Continent, 'id'>;

type PutContinent = Partial<PostContinent>;

export { Continent, GetContinent, PostContinent, PutContinent };
