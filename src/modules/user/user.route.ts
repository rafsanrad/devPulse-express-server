import { Router } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router();

router.post("/", userController.createUser);

router.get(
  "/",
  auth(USER_ROLE.maintainer, USER_ROLE.contributor),
  userController.getAllUsers
);

router.get("/:id", userController.getSingleUser);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);

export const userRoute = router;