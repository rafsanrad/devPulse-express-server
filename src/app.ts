import express, {
  type Application,
  type Request,
  type Response,
} from "express";
// import { userRoute } from "./modules/user/user.route";
// import { profileRoute } from "./modules/profile/profile.route";
// import { authRoute } from "./modules/auth/auth.route";
import logger from "./middleware/loggger";
import CookieParser from "cookie-parser";
// import cors from "cors";
// import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(CookieParser());
app.use(express.json()); //middleware
app.use(express.text()); //middleware
app.use(express.urlencoded({ extended: true })); //nested data gulo nibe extended korar maddhome.

//middleware for full application.
app.use(logger);
// app.use(
//   cors({
//     origin: "http://localhost:8000",
//   }),
// );

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Rafsan Rad",
  });
});

// app.use("/api/users", userRoute); ///api/users ei route e hit korlei taake mini server userRoute e niye jabe.
// app.use("/api/profile", profileRoute);
// app.use("/api/auth", authRoute);


// // Global Error Handling Middleware
// app.use(globalErrorHandler);

export default app;
