import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config({
  path: "./.env",
});
/*
Cloudinary Configuration Scope As mentioned earlier, when you call cloudinary.config() in index.js, it configures Cloudinary for the entire application only in index.js and any files imported directly from it.
If you import cloudinary in another file (e.g., user.controller.js), the Cloudinary configuration is not automatically applied, because each file/module in Node.js is isolated, and module scope is not shared.
*/

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided!");
      return null;
    }
    console.log("Uploading file to Cloudinary:", localFilePath);

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    //file has been uploaded successfuly
    console.log("file is uploaded on cloudinary", response);
    fs.unlinkSync(localFilePath)
    return response;

    
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temp file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
