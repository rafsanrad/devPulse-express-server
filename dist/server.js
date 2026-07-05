
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/app.ts
import express from "express";
import cors from "cors";

// src/errors/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
};
var AppError_default = AppError;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
  }
  res.status(statusCode).json({
    success: false,
    message
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.controller.ts
import { StatusCodes } from "http-status-codes";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor'
          CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL
          CHECK (LENGTH(description) >= 20),
        type VARCHAR(20) NOT NULL
          CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(20) DEFAULT 'open'
          CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL
          REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var signupUserIntoDB = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new AppError_default(409, "User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
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
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new AppError_default(401, "Invalid credentials");
  }
  const user = userData.rows[0];
  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    throw new AppError_default(401, "Invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  signupUserIntoDB,
  loginUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    ...data.data !== void 0 && { data: data.data },
    ...data.error !== void 0 && { error: data.error }
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const result = await authService.signupUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporterId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const result = await pool.query(sql, values);
  const issues = result.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const reporterMap = reporterResult.rows.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new AppError_default(404, "Issue not found");
  }
  const issue = result.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (id, payload, user) => {
  const issueData = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueData.rows.length === 0) {
    throw new AppError_default(404, "Issue not found");
  }
  const issue = issueData.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new AppError_default(
        403,
        "You can only update your own issues"
      );
    }
    if (issue.status !== "open") {
      throw new AppError_default(
        409,
        "Issue cannot be updated because it is not open"
      );
    }
  }
  const fields = [];
  const values = [];
  if (payload.title) {
    values.push(payload.title);
    fields.push(`title = $${values.length}`);
  }
  if (payload.description) {
    values.push(payload.description);
    fields.push(`description = $${values.length}`);
  }
  if (payload.type) {
    values.push(payload.type);
    fields.push(`type = $${values.length}`);
  }
  if (fields.length === 0) {
    throw new AppError_default(400, "No fields provided for update");
  }
  values.push(id);
  const result = await pool.query(
    `
    UPDATE issues
    SET ${fields.join(", ")}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING *
    `,
    values
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const issueData = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueData.rows.length === 0) {
    throw new AppError_default(404, "Issue not found");
  }
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueIntoDB(
      req.body,
      req.user.id
    );
    sendResponse_default(res, {
      statusCode: StatusCodes2.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await issueService.getSingleIssueFromDB(Number(req.params.id));
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await issueService.updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user
    );
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const result = await issueService.deleteIssueFromDB(
      Number(req.params.id)
    );
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue deleted successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(StatusCodes3.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        return res.status(StatusCodes3.NOT_FOUND).json({
          success: false,
          message: "User not found!"
        });
      }
      const user = userData.rows[0];
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(StatusCodes3.FORBIDDEN).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resource."
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  maintainer: "maintainer",
  contributor: "contributor"
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue
);
router2.delete(
  "/:id",
  auth_default(USER_ROLE.maintainer),
  issueController.deleteIssue
);
var issueRoute = router2;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method-Url-Time:", req.method, req.url, Date.now());
  const log = `
Method->${req.method} - Time->${Date.now()} - Url->${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/modules/user/user.route.ts
import { Router as Router3 } from "express";

// src/modules/user/user.service.ts
import bcrypt2 from "bcryptjs";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const hashedPassword = await bcrypt2.hash(password, 10);
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
var getALlUsersFromDB = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at
    FROM users
  `);
  return result.rows;
};
var getSingleUserFromDB = async (id) => {
  const result = await pool.query(
    `
    SELECT id, name, email, role, created_at, updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new AppError_default(404, "User not found");
  }
  return result.rows[0];
};
var updateUserFromDB = async (payload, id) => {
  const { name, password, role } = payload;
  let hashedPassword = null;
  if (password) {
    hashedPassword = await bcrypt2.hash(password, 10);
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
    throw new AppError_default(404, "User not found");
  }
  return result.rows[0];
};
var deleteUserFromDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new AppError_default(404, "User not found");
  }
  return true;
};
var userService = {
  createUserIntoDB,
  getALlUsersFromDB,
  getSingleUserFromDB,
  updateUserFromDB,
  deleteUserFromDB
};

// src/modules/user/user.controller.ts
import { StatusCodes as StatusCodes4 } from "http-status-codes";
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes4.CREATED,
      success: true,
      message: "User created successfully.",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes4.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllUsers = async (req, res) => {
  try {
    const result = await userService.getALlUsersFromDB();
    sendResponse_default(res, {
      statusCode: StatusCodes4.OK,
      success: true,
      message: "Users retrieved successfully.",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes4.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleUser = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await userService.getSingleUserFromDB(id);
    sendResponse_default(res, {
      statusCode: StatusCodes4.OK,
      success: true,
      message: "User retrieved successfully.",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes4.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await userService.updateUserFromDB(req.body, id);
    sendResponse_default(res, {
      statusCode: StatusCodes4.OK,
      success: true,
      message: "User updated successfully.",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes4.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await userService.deleteUserFromDB(id);
    sendResponse_default(res, {
      statusCode: StatusCodes4.OK,
      success: true,
      message: "User deleted successfully."
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes4.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser
};

// src/modules/user/user.route.ts
var router3 = Router3();
router3.post("/", userController.createUser);
router3.get("/", auth_default(USER_ROLE.maintainer), userController.getAllUsers);
router3.get("/:id", auth_default(USER_ROLE.maintainer), userController.getSingleUser);
router3.put("/:id", auth_default(USER_ROLE.maintainer), userController.updateUser);
router3.delete("/:id", auth_default(USER_ROLE.maintainer), userController.deleteUser);
var userRoute = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Rafsan Rad"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map