import { Router } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router();

router.post("/", userController.createUser);


router.get(
  "/",
  auth(USER_ROLE.maintainer),
  userController.getAllUsers
);

router.get(
  "/:id",
  auth(USER_ROLE.maintainer),
  userController.getSingleUser
);

router.put(
  "/:id",
  auth(USER_ROLE.maintainer),
  userController.updateUser
);

router.delete(
  "/:id",
  auth(USER_ROLE.maintainer),
  userController.deleteUser
);

export const userRoute = router;