import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const userId = req.user?._id;

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        subscribersCount: {
          $sum: 1,
        },
      },
    },
  ]);

  console.log("totalSubscribers", totalSubscribers);

  const video = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        totalLikes: {
          $size: "$likes",
        },
        totalViews: "$views",
        totalVideos: 1,
      },
      //Purpose: Each document represents one video. means add field with value 1 because it is not in docs.
      //$group stage, we use $sum: 1 to count the total videos.
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$totalLikes",
        },
        totalVideos: {
          $sum: 1,
        },
        totalViews: {
          $sum: "$totalViews",
        },
      },
    },
  ]);
  const channelStats = {
    totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
    totalLikes: video[0]?.totalLikes || 0,
    totalViews: video[0]?.totalViews || 0,
    totalVideos: video[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const userId = req.user?._id;

  const video = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: { $ifNull: ["$likes", []] },
        },
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
    {
      $addFields: {
        createdAt: {
          $dateToParts: { date: "$createdAt" },
        },
      },
    },
    {
      $project: {
        _id: 1,
        "videoFile.url": 1,
        thumbnails: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: {
          year: 1,
          month:  1,
          day: 1,
          hour: 1,
          minute:  1,
        },
        likesCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        "channel uploaded videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
