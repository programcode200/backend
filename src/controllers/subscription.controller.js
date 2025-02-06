import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError("Invalid channelId");
  }

  const SubscribeAlready = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (SubscribeAlready) {
    await Subscription.findByIdAndDelete(SubscribeAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isSubscribed: false }));
  }

  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res.status(200).json(new ApiResponse(200, { isSubscribed: true }));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError("invalid ChannelId");
  }

  const getUserChannelSubscribers = await Subscription.aggregate([
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
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribersOfSubscriber",
          },
          {
            $addFields: {
              subscribersOfSubscriber: {
                $cond: {
                  if: [channelId, "$subscribersOfSubscriber.subscriber"],
                },
                then: true,
                else: false,
              },
            },
            subscriberCount: {
              $size: "$subscribersOfSubscriber",
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
          "avatar.url": 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getUserChannelSubscribers,
        "users subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError("invalid subscriberId");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: subscriberId,
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannels",

        // pipeline: [
        //   {
        //     $lookup: {
        //       from: "videos",
        //       localField: "_id",
        //       foreignField: "owner",
        //       as: "videos",
        //     },
        //   },
        //   {
        //     $addFields: {
        //       latestVideo: {
        //         $last: "$videos",
        //       },
        //     },
        //   },
        // ],

        //add if you want latest videos of $subscribedChannels
      },
    },

    {
      $unwind: "$subscribedChannels",
    },
    {
      $project: {
        _id: 0,
        subscribedChannels: {
          _id: 1,
          username: 1,
          fullName: 1,
          "avatar.url": 1,

          //if you add above comment latest videos then add this

          //   latestVideo: {
          //     _id: 1,
          //     "videoFile.url": 1,
          //     "thumbnail.url": 1,
          //     owner: 1,
          //     title: 1,
          //     description: 1,
          //     duration: 1,
          //     createdAt: 1,
          //     views: 1
          // },
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

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
