import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionObj = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    // console.log("database log", connectionObj);
    console.log(
      `\n MongoDb connected !! Db host ${connectionObj.connection.host}`
    );
  } catch (error) {
    console.log("mongodb connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
