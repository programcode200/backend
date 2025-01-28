import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken(); //When you call user.generateAccessToken(), the method has access to the specific user's data (like this._id, this.email, etc.) because it is defined as a method of the user schema:
    const refreshToken = user.generateRefreshToken();

    console.log("generte token", user);
    console.log("generte access token", accessToken);
    console.log("generte refresh token", refreshToken);

    user.refreshToken = refreshToken; //add token into user object
    await user.save({ validateBeforeSave: false }); // This option is used to bypass validation before saving the document to the database., just add what give not all other data

    console.log("this is user:", user);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, fullName, password, username } = req.body;

  if (
    [name, email, fullName, password, username].some(
      (field) => field?.trim() === ""
    ) //it will return true or false
  ) {
    throw new ApiError(400, "Field should not be empty");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "email or username already existed!");
  }
  console.log("userexisted", existedUser);

  const avatarLocalPath = req.files?.avatar[0]?.path; //files option get by multer, avatar name come from user.routes middleware

  console.log("files", req.files);
  console.log("avatarLocalPath", avatarLocalPath);

  //check that avatar img is upload or not
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length >= 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //upload files on cloudinary, use await because take a time to upload img on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("avatar res obj ", avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar not upload");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    fullName,
  });

  console.log("register user", user);

  //select field that you want to select, we write field that that you dont want to select because by default all are selected.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // use -neg to not select
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registed."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPaawordValid = await user.isPasswordCorrect(password); //use user not models User becuase custom methods available in your user

  console.log("this is check password, encrypt pass", isPaawordValid);

  if (!isPaawordValid) {
    throw new ApiError(401, "password is not match");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true, // Ensures that the cookie cannot be accessed through JavaScript (important for security).
    secure: true, // Ensures that the cookie is only sent over HTTPS (important for security).
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, //req.user._id comes from the verifyJWT middleware, which ensures that only authenticated users can log out.
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true, //Return the modified user object after the update
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const accessrefreshToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  console.log("userRefreshToken; pppppppppppppppppppp", userRefreshToken);

  if (!userRefreshToken) {
    throw new ApiError(402, "Unauthorized Token");
  }

  try {
    const decodedToken = jwt.verify(userRefreshToken, REFRESH_TOKEN_SECRET);
    console.log("new decodedToken", decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid RefreshToken");
    }

    console.log("user get bty accessrefreshToken", user);

    if (userRefreshToken !== user?.refreshToken) {
      //check that token is same as getting from user and db token
      throw new ApiError(401, "Invalid and expired RefreshToken");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "user new access token generated"
        )
      );
  } catch (error) {
    throw new ApiError(202, error?.message, "Invalid RefreshToken");
  }
});

const changeNewPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!(oldPassword || newPassword)) {
    throw new ApiError(401, "Both password are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Enter correct password");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All field are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {$set : {
      fullName: fullName,
      email: email,
    }},
    { new: true } //get updated infomation with not updated field
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while while uploading avatar");
  }

  const user = User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url
    }
  }, { new: true }).select("-password")

  return res.status(200)
  .json(new ApiResponse(200, user, "Cover Image upated successfully"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while while uploading avatar");
  }

  const user = User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url
    }
  }, { new: true }).select("-password")

  return res.status(200)
  .json(new ApiResponse(200, user, "Cover Image upated successfully"))

})


export {
  registerUser,
  loginUser,
  logoutUser,
  accessrefreshToken,
  changeNewPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage
};
