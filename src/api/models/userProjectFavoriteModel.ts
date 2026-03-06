import { promisePool } from '../../database/db';

import {
  UserProjectFavorite,
  GetUserProjectFavorite,
  PostUserProjectFavorite
} from '../../interfaces/UserProjectFavorite';

import CustomError from '../../classes/CustomError';
import { ResultSetHeader } from 'mysql2';

const getAllUserProjectFavorites = async (): Promise<UserProjectFavorite[]> => {
  const [rows] = await promisePool.query<GetUserProjectFavorite[]>(
    `SELECT user_id AS userId, project_id AS projectId, created_at AS createdAt
    FROM user_project_favorites`
  );
  if (rows.length === 0) {
    throw new CustomError('No user project favorites found', 404);
  }
  return rows;
};

const getUserProjectFavorite = async (
  userId: number,
  projectId: number
): Promise<UserProjectFavorite> => {
  const [rows] = await promisePool.query<GetUserProjectFavorite[]>(
    `SELECT user_id AS userId, project_id AS projectId, created_at AS createdAt
    FROM user_project_favorites
    WHERE user_id = ? AND project_id = ?`,
    [userId, projectId]
  );
  if (rows.length === 0) {
    throw new CustomError(
      `User project favorite for userId ${userId} and projectId ${projectId} not found`,
      404
    );
  }
  return rows[0];
};

const postUserProjectFavorite = async (
  userProjectFavoriteData: PostUserProjectFavorite
): Promise<void> => {
  const { userId, projectId } = userProjectFavoriteData;
  const [result] = await promisePool.query<ResultSetHeader>(
    `INSERT INTO 
    user_project_favorites (user_id, project_id) VALUES (?, ?)`,
    [userId, projectId]
  );
  if (result.affectedRows === 0) {
    throw new CustomError('Failed to create user project favorite', 500);
  }
};

const deleteUserProjectFavorite = async (
  userId: number,
  projectId: number
): Promise<void> => {
  const [result] = await promisePool.query<ResultSetHeader>(
    `DELETE FROM 
    user_project_favorites WHERE user_id = ? AND project_id = ?`,
    [userId, projectId]
  );
  if (result.affectedRows === 0) {
    throw new CustomError(
      `Failed to delete user project favorite for userId ${userId} and projectId ${projectId}`,
      500
    );
  }
};

const getFavoritesByUserId = async (
  userId: number
): Promise<UserProjectFavorite[]> => {
  const [rows] = await promisePool.query<GetUserProjectFavorite[]>(
    `SELECT user_id AS userId, project_id AS projectId, created_at AS createdAt
    FROM user_project_favorites
    WHERE user_id = ?`,
    [userId]
  );
  return rows;
};

const getFavoritesByProjectId = async (
  projectId: number
): Promise<UserProjectFavorite[]> => {
  const [rows] = await promisePool.query<GetUserProjectFavorite[]>(
    `SELECT user_id AS userId, project_id AS projectId, created_at AS createdAt
    FROM user_project_favorites
    WHERE project_id = ?`,
    [projectId]
  );
  return rows;
};

const checkIfUserFavoritedProject = async (
  userId: number,
  projectId: number
): Promise<boolean> => {
  const [rows] = await promisePool.query<GetUserProjectFavorite[]>(
    `SELECT 1 FROM user_project_favorites
    WHERE user_id = ? AND project_id = ?`,
    [userId, projectId]
  );
  return rows.length > 0;
};

export {
  getAllUserProjectFavorites,
  getUserProjectFavorite,
  postUserProjectFavorite,
  deleteUserProjectFavorite,
  getFavoritesByUserId,
  getFavoritesByProjectId,
  checkIfUserFavoritedProject
};
