import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

// const getVideoComments = asyncHandler(async (req, res) => {
//   //TODO: get all comments for a video
//   //TODO: get likes count

//   const { videoId } = req.params;
//   const { page = 1, limit = 10 } = req.query;

//   //get video
//   //validate video
//   //use aggregation $match videoId to comment model
//   //using $lookup comment model owner get user details
//   //using that users details

//   const video = await Video.findById(videoId);

//   if (!video) {
//     throw new ApiError(400, "video not exists");
//   }

//   const commentsAggregate = await Comment.aggregate([
//     {
//       $match: {
//         video: new mongoose.Types.ObjectId(videoId),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "owner",
//       },
//     },
//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "comment",
//         as: "likes",
//       },
//     },
//     {
//       $addFields: {
//         likedCount: {
//           $size: "$likes",
//         },
//         owner: {
//           $first: "$owner",
//         },
//         isLiked: {
//           $cond: {
//             if: { $in: [req.user?._id, "$likes.likedBy"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         content: 1,
//         createdAt: 1,
//         owner: {
//           username: 1,
//           fullName: 1,
//           avatar: 1,
//         },
//         likedCount: 1,
//         isLiked: 1,
//       },
//     },
//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },
//   ]);

//   // const options = {
//   //   page: parseInt(page, 10),
//   //   limit: parseInt(limit, 10),
//   // };

//   // const comments = await Comment.aggregatePaginate(commentsAggregate, options);

//   const pageInt = parseInt(page, 10);
//   const limitInt = parseInt(limit, 10);
//   const skip = (pageInt - 1) * limitInt;

//   const totalComments = await Comment.countDocuments({ video: videoId });
//   const comments = await Comment.aggregate([
//     ...pipeline,
//     { $skip: skip },
//     { $limit: limitInt },
//   ]);

//   return res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         comments,
//         page: pageInt,
//         totalPages: Math.ceil(totalComments / limitInt),
//         totalComments,
//       },
//       "Comments fetched successfully"
//     )
//   );
// });

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video does not exist");
  }

  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const skip = (pageInt - 1) * limitInt;

  const pipeline = [
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $arrayElemAt: ["$owner", 0] },
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: { username: 1, fullName: 1, avatar: 1 },
        likesCount: 1,
        isLiked: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitInt },
  ];

  const totalComments = await Comment.countDocuments({ video: videoId });
  const comments = await Comment.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        page: pageInt,
        totalPages: Math.ceil(totalComments / limitInt),
        totalComments,
      },
      "Comments fetched successfully"
    )
  );
});




const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "please provide content");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "video not found");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { content } = req.body;
  const { commentId } = req.params;

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "content not found");
  }

  if (comment.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Only comment owner can edit their comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!updateComment) {
    throw new ApiError(500, "Failed to edit comment please try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not found");
  }

  if (comment.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "you cannot delete others comment");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, commentId, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
