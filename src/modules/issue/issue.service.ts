import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { TCreateIssue, TIssueQuery } from "../../types";
import AppError from "../../errors/AppError";

/* ---------------- CREATE ISSUE ---------------- */
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

/* ---------------- GET ALL ISSUES ---------------- */
const getAllIssuesFromDB = async (query: TIssueQuery) => {
  const { sort = "newest", type, status } = query;

  let sql = `SELECT * FROM issues`;
  const values: any[] = [];
  const conditions: string[] = [];

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

  sql += sort === "oldest"
    ? ` ORDER BY created_at ASC`
    : ` ORDER BY created_at DESC`;

  const result = await pool.query(sql, values);
  const issues = result.rows;

  if (issues.length === 0) return [];

  const reporterIds = [...new Set(issues.map(i => i.reporter_id))];

  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );

  const reporterMap = reporterResult.rows.reduce((acc: any, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});

  return issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));
};

/* ---------------- GET SINGLE ISSUE ---------------- */
const getSingleIssueFromDB = async (id: number) => {
  const result = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Issue not found");
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
    updated_at: issue.updated_at,
  };
};

/* ---------------- UPDATE ISSUE (SAFE PATCH) ---------------- */
const updateIssueIntoDB = async (
  id: number,
  payload: Partial<TCreateIssue>,
  user: JwtPayload
) => {
  const issueData = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );

  if (issueData.rows.length === 0) {
    throw new AppError(404, "Issue not found");
  }

  const issue = issueData.rows[0];

  // Contributor rules
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new AppError(
        403,
        "You can only update your own issues"
      );
    }

    if (issue.status !== "open") {
      throw new AppError(
        409,
        "Issue cannot be updated because it is not open"
      );
    }
  }

  const fields: string[] = [];
  const values: any[] = [];

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
    throw new AppError(400, "No fields provided for update");
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

/* ---------------- DELETE ISSUE ---------------- */
const deleteIssueFromDB = async (id: number) => {
  const issueData = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );

  if (issueData.rows.length === 0) {
    throw new AppError(404, "Issue not found");
  }

  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};