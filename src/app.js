import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//use, use for middleware and configuration settings
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser()); // from my server i can access cookies and set cookies from user browser.

export { app };
