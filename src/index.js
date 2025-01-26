// require('dotenv').config()       give path here
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary API Secret:", process.env.CLOUDINARY_API_SECRET);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 4000, () => {
      console.log(`server is running at port :${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    });
  })
  .catch((err) => {
    console.log("mongodb connection faild!! ", err);
  });
























/*
import express from "express";
const app = express()(

  // iife
  async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
      app.on("error", (error) => {
        console.log("error", error);
        throw error;
      });

      app.listen(process.env.PORT, () => {
        console.log(`App is listening of PORT: ${process.env.PORT}`);
      });
    } catch (error) {
      console.error(error);
      throw new Error("error");
    }
  }
)();
*/
