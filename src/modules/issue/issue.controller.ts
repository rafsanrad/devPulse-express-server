import type { Request, Response } from "express";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result=await issueService.createIssueIntoDB(req.body)
    res.status(201).json({
        success:true,
        message:"Issue created successfully.",
        data:result.rows[0],
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
};
export const issueController = {
  createIssue,
};
