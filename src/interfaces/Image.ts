import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface Image {
  id: number;
  image: string;
  projectId: number | Project;
}

interface GetImage extends RowDataPacket, Image {}

type PostImage = Omit<Image, 'id'>;

type PutImage = Partial<PostImage>;

export { Image, GetImage, PostImage, PutImage };
