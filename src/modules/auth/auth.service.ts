import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config";

const signupUserIntoDB = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}) => {
  const { name, email, password, role = "contributor" } = payload;

  // Check if email already exists
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("User already exists.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  // Check user
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials.");
  }

  const user = userData.rows[0];

  // Compare password
  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    throw new Error("Invalid credentials.");
  }

  // JWT payload (as required by assignment)
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};