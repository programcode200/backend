import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

// const registerUser = asyncHandler(async (req, res) => {

//   console.log("Incoming Request Body:", req.body); // ✅ Debugging
//   console.log("Incoming Files:", req.files);

//   const { name, email, fullName, password, username } = req.body;
//   if (
//     [name, email, fullName, password, username].some(
//       (field) => field?.trim() === ""
//     ) //it will return true or false
//   ) {
//     throw new ApiError(400, "Field should not be empty");
//   }

//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, "email or username already existed!");
//   }
//   console.log("userexisted", existedUser);

//   const avatarLocalPath = req.files?.avatar[0]?.path; //files option get by multer, avatar name come from user.routes middleware

//   console.log("files", req.files);
//   console.log("avatarLocalPath", avatarLocalPath);

//   //check that avatar img is upload or not
//   if (!avatarLocalPath) {
//     throw new ApiError(400, "Avatar file is Required");
//   }

//   let coverImageLocalPath;
//   if (
//     req.files &&
//     Array.isArray(req.files.coverImage) &&
//     req.files.coverImage.length >= 0
//   ) {
//     coverImageLocalPath = req.files.coverImage[0].path;
//   }

//   //upload files on cloudinary, use await because take a time to upload img on cloudinary
//   const avatar = await uploadOnCloudinary(avatarLocalPath);
//   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//   console.log("avatar res obj ", avatar);

//   if (!avatar) {
//     throw new ApiError(400, "Avatar not upload");
//   }

//   const user = await User.create({
//     username: username.toLowerCase(),
//     avatar: avatar?.url,
//     coverImage: coverImage?.url || "",
//     email,
//     password,
//     fullName,
//   });

//   console.log("register user", user);

//   //select field that you want to select, we write field that that you dont want to select because by default all are selected.
//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken" // use -neg to not select
//   );

//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while register user");
//   }

//   return res
//     .status(201)
//     .json(new ApiResponse(200, createdUser, "user registed."));
// });

const registerUser = asyncHandler(async (req, res) => {
  const { email, fullName, password, username } = req.body;

  if (
    [email, fullName, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Field should not be empty");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "Email or username already exists!");
  }

  // ✅ Get Avatar Buffer & Format
  const avatarFile = req.files?.avatar?.[0];

  if (!avatarFile) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatarBuffer = avatarFile.buffer;
  const avatarFormat = avatarFile.mimetype.split("/")[1];

  // ✅ Get Cover Image Buffer & Format (Optional)
  let coverImage = "";
  if (req.files?.coverImage?.[0]) {
    const coverImageBuffer = req.files.coverImage[0].buffer;
    const coverImageFormat = req.files.coverImage[0].mimetype.split("/")[1];
    coverImage = await uploadOnCloudinary(coverImageBuffer, coverImageFormat);
  }

  // ✅ Upload Avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarBuffer, avatarFormat);
  if (!avatar) throw new ApiError(400, "Avatar upload failed");

  // ✅ Save User to Database
  const user = await User.create({
    username: username.toLowerCase(),
    avatar: avatar.secure_url, // Use Cloudinary URL
    coverImage: coverImage?.secure_url || "",
    email,
    password,
    fullName,
  });

  // ✅ Remove Sensitive Data from Response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) throw new ApiError(500, "User registration failed");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully."));
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

  const isPasswordValid = await user.isPasswordCorrect(password); //use user not models User becuase custom methods available in your user

  console.log("this is check password, encrypt pass", isPasswordValid);

  if (!isPasswordValid) {
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
    sameSite: "None",
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
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // removes field from document
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
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
    const decodedToken = jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
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

  if (!oldPassword || !newPassword) {
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
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All field are required");
  }

  if (!req.user?._id) {
    throw new ApiError(400, "User ID is missing. Please re-authenticate.");
  }  

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true } //get updated infomation with not updated field
  ).select("-password");

  if (!user) {
    throw new ApiError(400, "User not found");
  }
  

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {

  // const avatarLocalPath = req.file.path;

  const avatarBuffer = req.file?.buffer;
  const avatarFormat = req.file?.mimetype.split("/")[1];

  if (!avatarBuffer) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);

  const avatar = await uploadOnCloudinary(avatarBuffer, avatarFormat, "image");

  if (!avatar.secure_url) {
    throw new ApiError(400, "Error while while uploading avatar");
  }

  console.log("log avatar",avatar);
  

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image upated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // const coverImageLocalPath = req.file.path;

  const coverImageBuffer = req.file?.buffer;
  const coverImageFormat = req.file?.mimetype.split("/")[1];

  if (!coverImageBuffer) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageBuffer, coverImageFormat, "image");


  if (!coverImage.secure_url) {
    throw new ApiError(400, "Error while while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image upated successfully"));
});

//ref doc for sub and sub To
// [
//   { "_id": "sub1", "subscriber": "124", "channel": "123" },  // Rohit → Virat
//   { "_id": "sub2", "subscriber": "125", "channel": "123" },  // Sachin → Virat
//   { "_id": "sub3", "subscriber": "124", "channel": "126" }   // Rohit → Dhoni
// ]

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log("params value", username);

  if (!username?.trim()) {
    throw new ApiError(400, " Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(), //eg. username: "johndoe"
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", //get subscribers
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", //get subscribed To
        as: "subscribedTo",
      },
    },

    //add these two new field into user
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedCount: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "channel doesnot exists");
  }

  console.log("channel data come from pipelines", channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched succeefully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // req.user._id it will return string not mongodb id, but in mongoose it will automatically convert into id

  const user = await User.findById(req.user._id);
console.log("User's watch history in DB:", user.watchHistory);


  const userHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), //to convert it into a valid MongoDB ObjectId. it will convert into mongodb id will not convert into id it return string
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //Nested Lookup - Get Video Owner Details
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log("userHistory    ", userHistory);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userHistory[0]?.watchHistory,
        "watch history fetched successfully"
      )
    );
});


export {
  registerUser,
  loginUser,
  logoutUser,
  accessrefreshToken,
  changeNewPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
