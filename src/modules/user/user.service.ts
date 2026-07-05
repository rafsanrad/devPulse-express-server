import { pool } from "../../db";
import type { IUser } from "./user.interface";
import bcrypt from "bcryptjs";
import AppError from "../../errors/AppError";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role = "contributor" } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

const getALlUsersFromDB = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at
    FROM users
  `);

  return result.rows;
};

const getSingleUserFromDB = async (id: string) => {
  const result = await pool.query(
    `
    SELECT id, name, email, role, created_at, updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  return result.rows[0];
};

const updateUserFromDB = async (payload: IUser, id: string) => {
  const { name, password, role } = payload;

  let hashedPassword = null;

  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const result = await pool.query(
    `
    UPDATE users
    SET
      name = COALESCE($1, name),
      password = COALESCE($2, password),
      role = COALESCE($3, role)
    WHERE id = $4
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, hashedPassword, role, id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  return result.rows[0];
};

const deleteUserFromDB = async (id: string) => {
  const result = await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  return true;
};

export const userService = {
  createUserIntoDB,
  getALlUsersFromDB,
  getSingleUserFromDB,
  updateUserFromDB,
  deleteUserFromDB,
};