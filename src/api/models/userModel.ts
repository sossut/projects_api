import { promisePool } from '../../database/db';
import { GetUser, PostUser, PutUser, User } from '../../interfaces/User';
import { ResultSetHeader } from 'mysql2';
import CustomError from '../../classes/CustomError';

const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await promisePool.query<GetUser[]>(
    'SELECT id, email, username FROM users'
  );

  if (rows.length === 0) {
    throw new CustomError('No users found', 404);
  }

  return rows;
};

const getUser = async (id: number): Promise<User> => {
  const [rows] = await promisePool.query<GetUser[]>(
    'SELECT id, email, username FROM users WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    throw new CustomError(`User with id ${id} not found`, 404);
  }

  return rows[0];
};

const postUser = async (userData: PostUser): Promise<number> => {
  try {
    const [headers] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [userData.username, userData.email, userData.password]
    );
    if (headers.affectedRows === 0) {
      throw new CustomError('Failed to create user', 500);
    }
    return headers.insertId;
  } catch (err: any) {
    // MySQL duplicate entry error
    if (err && err.code === 'ER_DUP_ENTRY') {
      throw new CustomError('Email already exists', 400);
    }
    throw err;
  }
};

const putUser = async (userData: PutUser, id: number): Promise<boolean> => {
  const sql = promisePool.format('UPDATE users SET ? WHERE id = ?', [
    userData,
    id
  ]);
  if (userData.role) {
    throw new CustomError('Can not be updated via this endpoint', 400);
  }
  const [headers] = await promisePool.query<ResultSetHeader>(sql);
  if (headers.affectedRows === 0) {
    throw new CustomError(`User with id ${id} not found`, 404);
  }
  return true;
};

const deleteUser = async (id: number): Promise<boolean> => {
  const [headers] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM users WHERE id = ?',
    [id]
  );
  if (headers.affectedRows === 0) {
    throw new CustomError(`User with id ${id} not found`, 404);
  }
  return true;
};

const getUserLogin = async (email: string): Promise<User> => {
  const [rows] = await promisePool.query<GetUser[]>(
    'SELECT id, email, username, role, password FROM users WHERE email = ?',
    [email]
  );
  if (rows.length === 0) {
    throw new CustomError('Invalid email or password', 401);
  }

  const user = rows[0];
  // defensive fallback in case the column casing differs
  if (!user.password && (user as any).PASSWORD) {
    user.password = (user as any).PASSWORD;
  }

  return user;
};

export { getAllUsers, getUser, postUser, putUser, deleteUser, getUserLogin };
