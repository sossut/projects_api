import { RowDataPacket } from 'mysql2';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface GetUser extends RowDataPacket, User {}

type PostUser = Omit<User, 'id'>;

type PutUser = Partial<PostUser>;

export { User, GetUser, PostUser, PutUser };
