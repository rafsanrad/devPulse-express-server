import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { TCreateIssue } from "../../types";

const createIssueIntoDB = async (
  payload: TCreateIssue,
  reporterId: number
) => {
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

const getAllIssuesFromDB = async () => {
  const result = await pool.query(`
    SELECT * FROM issues
  `);

  return result.rows;
};

const getSingleIssueFromDB = async (id: number) => {
  const result = await pool.query(
    `
      SELECT * FROM issues
      WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }

  return result.rows[0];
};

const updateIssueIntoDB = async (
  id: number,
  payload: TCreateIssue,
  user: JwtPayload
) => {
  // 1. Check if the issue exists
  const issueData = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id]
  );

  if (issueData.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueData.rows[0];

  // 2. Permission check
  if (user.role === "contributor") {
    // Contributor can update only their own issue
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden! You can update only your own issues.");
    }

    // Contributor can update only if status is open
    if (issue.status !== "open") {
      throw new Error("Issue cannot be updated because it is not open.");
    }
  }

  // Maintainer can update any issue

  const { title, description, type } = payload;

  // 3. Update issue
  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [title, description, type, id]
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (id: number) => {
  // 1. Check if the issue exists
  const issueData = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id]
  );

  if (issueData.rows.length === 0) {
    throw new Error("Issue not found");
  }

  // 2. Delete the issue
  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};
