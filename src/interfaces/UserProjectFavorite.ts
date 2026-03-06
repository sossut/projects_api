import { RowDataPacket } from 'mysql2';

interface UserProjectFavorite {
  userId: number;
  projectId: number;
  createdAt?: Date;
}

interface GetUserProjectFavorite extends RowDataPacket, UserProjectFavorite {}

type PostUserProjectFavorite = Omit<UserProjectFavorite, 'createdAt'>;

export { UserProjectFavorite, GetUserProjectFavorite, PostUserProjectFavorite };
