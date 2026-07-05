import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";

import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issue/issue.route";
import logger from "./middleware/logger";
import { userRoute } from "./modules/user/user.route";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(logger);

// Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Rafsan Rad",
  });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/issues", issueRoute);

// Global Error Handler
app.use(globalErrorHandler);

export default app;