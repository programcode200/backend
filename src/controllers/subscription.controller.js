import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res, next) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const SubscribeAlready = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (SubscribeAlready) {
    await Subscription.findByIdAndDelete(SubscribeAlready._id);
    return res.status(200).json(new ApiResponse(200, { isSubscribed: false }));
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed: true }, "toggle"));
});

// Controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res, next) => {
//   const { channelId } = req.params;

//   if (!isValidObjectId(channelId)) {
//     throw new ApiError(400, "Invalid channelId");
//   }

//   const getUserChannelSubscribers = await Subscription.aggregate([
//     {
//       $match: {
//         channel: new mongoose.Types.ObjectId(channelId),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "subscriber",
//         foreignField: "_id",
//         as: "subscriber",
//       },
//     },
//     {
//       $unwind: "$subscriber",
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "subscriber._id",
//         foreignField: "channel",
//         as: "subscribersOfSubscriber",
//       },
//     },
//     {
//       $addFields: {
//         subscribedToSubscriber: {
//           $in: [
//             new mongoose.Types.ObjectId(channelId),
//             {
//               $map: {
//                 input: "$subscribersOfSubscriber",
//                 as: "sub",
//                 in: "$$sub.subscriber"
//               }
//             }
//           ]
//           ,
//         },
//         subscribersCount: { $size: "$subscribersOfSubscriber" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         subscriber: {
//           _id: 1,
//           username: 1,
//           fullName: 1,
//           avatar: 1,
//           subscribedToSubscriber: 1,
//           subscribersCount: 1,
//         },
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, getUserChannelSubscribers, "Users subscribers fetched successfully"));
// });

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  let { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  channelId = new mongoose.Types.ObjectId(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscribedToSubscriber.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "subscribers fetched successfully")
    );
});



// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          {
            $addFields: {
              latestVideo: {
                $last: "$videos",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $project: {
        _id: 0,
        subscribedChannel: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          latestVideo: {
            _id: 1,
            videoFile: 1,
            thumbnails: 1,
            owner: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "subscribed channels fetched successfully"
      )
    );
});


// const getSubscribedChannels = asyncHandler(async (req, res) => {
//   const { subscriberId } = req.params;

//   if (!isValidObjectId(subscriberId)) {
//     throw new ApiError(400, "Invalid subscriberId");
//   }

//   const subscribedChannels = await Subscription.aggregate([
//     {
//       $match: {
//         subscriber: new mongoose.Types.ObjectId(subscriberId),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "channel",
//         foreignField: "_id",
//         as: "subscribedChannels",
//       },
//     },
//     {
//       $unwind: "$subscribedChannels",
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "_id",
//         foreignField: "owner",
//         as: "videos",
//         pipeline: [
//           { $sort: { createdAt: -1 } }, // Sort videos by latest
//           { $limit: 1 }, // Only get the latest
//         ],
//       },
//     },
//     {
//       $addFields: {
//         latestVideo: { $ifNull: [{ $arrayElemAt: ["$videos", 0] }, {}] },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         subscribedChannels: {
//           _id: 1,
//           username: 1,
//           fullName: 1,
//           avatar: 1,
//           latestVideo: {
//             _id: 1,
//             videoFile: 1,
//             thumbnails: 1,
//             owner: 1,
//             title: 1,
//             description: 1,
//             duration: 1,
//             createdAt: 1,
//             views: 1,
//           },
//         },
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"));
// });

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
