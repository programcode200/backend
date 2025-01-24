import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, fullName, password } = req.body;

  if (
    [name, email, fullName, password].some((field) => field?.trim() === "") //it will return true or false
  ) {
    throw new ApiError(400, "Field should not be empty");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "email or username already existed!");
  }
  console.log("userexisted", existedUser);

  const avatarLocalPath = req.files?.avatar[0]?.path; //files option get by multer, avatar name come from user.routes middleware
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("files", req.files);

  //check that avatar img is upload or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }

  //upload files on cloudinary, use await because take a time to upload img on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar not upload");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    fullName,
  });

  console.log(user);

  //select field that you want to select, we write field that that you dont want to select because by default all are selected.
  const createdUser = await user.findById(user._id).select(
    "-password -refreshToken" // use -neg to not select
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registed."));
});

export { registerUser };
