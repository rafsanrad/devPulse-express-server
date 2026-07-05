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

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB
};
