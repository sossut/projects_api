import { RowDataPacket } from 'mysql2';
import { Project } from './Project';

interface ImageLink {
  id: number;
  url: string;
  projectId: number | Project;
}

interface GetImageLink extends RowDataPacket, ImageLink {}

type PostImageLink = Omit<ImageLink, 'id'>;

type PutImageLink = Partial<PostImageLink>;

export { ImageLink, GetImageLink, PostImageLink, PutImageLink };
