import type { Request, Response } from "express";
import { pool } from "../../db";
import { userService } from "./user.service";
import sendResponse from "../../utility/sendResponse";

const createUser = async (req: Request, res: Response) => {
  // console.log(req.body)
//   const { name, email, password, age } = req.body;
  try {
    const result=await userService.createUserIntoDB(req.body)

    sendResponse(res,{
      statusCode:201,
      success: true,
      message: "User created successfully.",
      data: result.rows[0],
    })
  } catch (error: any) {
    sendResponse(res,{
      statusCode:500,
      success: false,
      message: error.message,
      error:error
    })
  }
};

const getAllUsers=async (req: Request, res: Response) => {
  // console.log("from controlller",req.user)
  try {
    const result=await userService.getALlUsersFromDB()
    res.status(200).json({
      success: true,
      message: "Users retrived successfully.",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
}

const getSingleUser=async (req: Request, res: Response) => {
  const { id } = req.params; //url theke id niye ashlam.
  try {
    const result=await userService.getSingleUserFromDB(id as string)

    if (result.rows.length === 0) {
      //user na thakle seta handle kortesi.
      res.status(404).json({
        success: false,
        message: "User Not Found.",
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrived successfully.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
}

const updateUser=async (req: Request, res: Response) => {
  const { id } = req.params;
//   const { name, age, password, is_active } = req.body;

  try {
    const result=await userService.updateUserFromDB(req.body,id as string)

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found.",
      });
    }

    // console.log(result)
    res.status(200).json({
      success: true,
      message: "Users updated successfully.",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
}

const deleteUser= async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result=await userService.deleteUserFromDB(id as string)

    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Users deleted successfully.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error,
    });
  }
}

export const userController={
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
}
