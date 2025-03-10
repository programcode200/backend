import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();

//use, use for middleware and configuration settings
// const allowedOrigins = process.env.CORS_ORIGIN?.trim()
//   ? process.env.CORS_ORIGIN
//   : "https://frontend-youtube-kappa.vercel.app";

const allowedOrigins = "https://frontend-youtube-kappa.vercel.app";


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: "Content-Type,Authorization", // ✅ Allowed headers

    // origin: "https://frontend-youtube-kappa.vercel.app",
  })
);

app.options("*", cors()); // ✅ Allow all preflight requests


console.log("Allowed CORS Origin:", process.env.CORS_ORIGIN);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser()); // from my server i can access cookies and set cookies from user browser.


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

//routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);


export default app;