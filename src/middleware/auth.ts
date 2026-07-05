import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Get token from Authorization header
      const token = req.headers.authorization;

      if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized access!",
        });
      }

      // 2. Verify token
      const decoded = jwt.verify(
        token,
        config.secret as string
      ) as JwtPayload;

      // 3. Check if user exists
      const userData = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userData.rows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User not found!",
        });
      }

      const user = userData.rows[0];

      // 4. Check role (if roles are provided)
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resource.",
        });
      }

      // 5. Attach decoded user to request
      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;