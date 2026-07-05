import type { Request, Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../utility/sendResponse";
import { StatusCodes } from "http-status-codes";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User created successfully.",
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

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userService.getALlUsersFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Users retrieved successfully.",
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

const getSingleUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result = await userService.getSingleUserFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User retrieved successfully.",
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

const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const result = await userService.updateUserFromDB(req.body, id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User updated successfully.",
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

const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await userService.deleteUserFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User deleted successfully.",
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

export const userController = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};