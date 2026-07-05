import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utility/sendResponse";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueIntoDB(
      req.body,
      req.user!.id
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
      error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getSingleIssueFromDB(Number(req.params.id));

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user!
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.deleteIssueFromDB(
      Number(req.params.id)
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue deleted successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Something went wrong",
      error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};