import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudnary.js";




const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination

  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  console.log("data come from query", query, sortBy, sortType, userId);
  console.log(userId);

  const pipeline = [];

  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results
  // here the name of search index is 'search-videos'

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"], //search only on title, desc
          fuzzy: { maxEdits: 2 }, // Allows small spelling mistakes
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // fetch videos only that are set isPublished as true
  pipeline.push({ $match: { isPublished: true } });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",

    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  // const pageInt = parseInt(page, 10);
  // const limitInt = parseInt(limit, 10);

  // pipeline.push({ $skip: (pageInt - 1) * limitInt }, { $limit: limitInt });

  // const videos = await Video.aggregate(pipeline);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched successfully"));

});













// get all videos based on query, sort, pagination

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  

//   const pipeline = [];

//   // for using Full Text based search u need to create a search index in mongoDB atlas
//   // you can include field mapppings in search index eg.title, description, as well
//   // Field mappings specify which fields within your documents should be indexed for text search.
//   // this helps in seraching only in title, desc providing faster search results
//   // here the name of search index is 'search-videos'
//   if (query) {
//     pipeline.push({
//       $search: {
//         index: "search-videos",
//         text: {
//           query: query,
//           path: ["title", "description"], //search only on title, desc
//         },
//       },
//     });
//   }

//   if (userId) {
//     if (!isValidObjectId(userId)) {
//       throw new ApiError(400, "Invalid userId");
//     }

//     pipeline.push({
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     });
//   }

//   // fetch videos only that are set isPublished as true
//   pipeline.push({ $match: { isPublished: true } });

//   //sortBy can be views, createdAt, duration
//   //sortType can be ascending(-1) or descending(1)
//   if (sortBy && sortType) {
//     pipeline.push({
//       $sort: {
//         [sortBy]: sortType === "asc" ? 1 : -1,
//       },
//     });
//   } else {
//     pipeline.push({ $sort: { createdAt: -1 } });
//   }

//   pipeline.push(
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "ownerDetails",
//         pipeline: [
//           {
//             $project: {
//               username: 1,
//               avatar: 1,
//             },
//           },
//         ],
//       },
//     },
//     {
//       $unwind: "$ownerDetails",
//     }
//   );

//   const videoAggregate = Video.aggregate(pipeline);

//   const options = {
//     page: parseInt(page, 10),
//     limit: parseInt(limit, 10),
//   };

//   const video = await Video.aggregatePaginate(videoAggregate, options);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, video, "Videos fetched successfully"));
// });



// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

//   console.log("Query Params:", { query, sortBy, sortType, userId });

//   const pipeline = [];

//   // ✅ Full-text search
//   if (query) {
//     pipeline.push({
//       $search: {
//         index: "search-videos",
//         text: {
//           query: query,
//           path: ["title", "description"], // Search only in title, description
//           fuzzy: { maxEdits: 2 }, // Allow small typos
//         },
//       },
//     });
//   }

//   // ✅ Filter by userId if valid
//   if (userId) {
//     if (!isValidObjectId(userId)) {
//       return res.status(400).json(new ApiError(400, "Invalid userId"));
//     }

//     pipeline.push({
//       $match: { owner: new mongoose.Types.ObjectId(userId) },
//     });
//   }

//   // ✅ Fetch only published videos
//   pipeline.push({ $match: { isPublished: true } });

//   // ✅ Sorting fix: Convert `sortType` correctly
//   const sortOrder = sortType === "asc" ? 1 : -1;
//   pipeline.push({ $sort: { [sortBy]: sortOrder } });

//   // ✅ Lookup owner details
//   pipeline.push(
//     {
//       $lookup: {
//         from: "users",
//         localField: "owner",
//         foreignField: "_id",
//         as: "ownerDetails",
//         pipeline: [{ $project: { username: 1, avatar: 1 } }],
//       },
//     },
//     { $unwind: "$ownerDetails" }
//   );

//   // ✅ Fix Pagination: Use `$facet` to return total count and paginated data
//   const pageInt = parseInt(page, 10);
//   const limitInt = parseInt(limit, 10);

//   pipeline.push({
//     $facet: {
//       metadata: [{ $count: "total" }],
//       data: [{ $skip: (pageInt - 1) * limitInt }, { $limit: limitInt }],
//     },
//   });

//   // ✅ Fetch videos
//   const result = await Video.aggregate(pipeline);

//   // ✅ Handle empty result case
//   const videos = result[0]?.data || [];
//   const total = result[0]?.metadata[0]?.total || 0;

//   return res.status(200).json(
//     new ApiResponse(200, { docs: videos, total, hasNextPage: total > pageInt * limitInt }, "Videos fetched successfully")
//   );
// });


const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video

  const { title, description } = req.body;

  //   if (!title || !description) {
  //     throw new ApiError(400, "title and description is required");
  //   }

  if ([title, description].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // const videoFileLocalPath = req.files?.videoFile[0]?.path;
  // const thumbnailsLocalPath = req.files?.thumbnail[0]?.path;

  // if (!videoFileLocalPath || !thumbnailsLocalPath) {
  //   throw new ApiError(400, "videoFile and thumbnail is reuired");
  // }

  // const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  // const thumbnail = await uploadOnCloudinary(thumbnailsLocalPath);

  const videoFileBuffer = req.files?.videoFile?.[0]?.buffer;
  const thumbnailBuffer = req.files?.thumbnail?.[0]?.buffer;
  const videoFormat = req.files?.videoFile?.[0]?.mimetype.split("/")[1];
  const thumbnailFormat = req.files?.thumbnail?.[0]?.mimetype.split("/")[1];

  if (!videoFileBuffer || !thumbnailBuffer) {
    throw new ApiError(400, "videoFile and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(
    videoFileBuffer,
    videoFormat,
    "video"
  );
  const thumbnail = await uploadOnCloudinary(
    thumbnailBuffer,
    thumbnailFormat,
    "image"
  );

  if (!videoFile || !thumbnail) {
    throw new ApiError(
      500,
      "videoFile and thumbnail is not uploaded on Cloudinary"
    );
  }

  const video = await Video.create({
    videoFile: {
      url: videoFile.secure_url,
      public_id: videoFile.public_id,
    },
    thumbnails: {
      url: thumbnail.secure_url,
      public_id: thumbnail.public_id,
    },
    duration: videoFile.duration,
    title: title,
    description: description,
    owner: req.user?._id,
    isPublished: false,
  });

  if (!video) {
    throw new ApiError(500, "Something went wrong while uploading video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCounts: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCounts: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "video not found");
  }

  console.log("video nnnnnnnnnnnnnnnn", video);
  

  //increment views if video fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  // add this video to user watch history
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { 
      watchHistory: videoId
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail

  const { videoId } = req.params;
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "title and description is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (video?.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(400, "only owner can edit video details");
  }

  //deleting old thumbnail and updating with new one
  const thumbnailToDelete = video.thumbnails.public_id;

  // const thumbnailLocalPath = req.file?.path;

  const thumbnailBuffer = req.file?.buffer;
  const thumbnailFormat = req.file?.mimetype.split("/")[1];

  if (!thumbnailBuffer) {
    throw new ApiError(400, "thumbnail is required");
  }

  // const thumbmail = await uploadOnCloudinary(thumbnailLocalPath);
  const thumbnail = await uploadOnCloudinary(
    thumbnailBuffer,
    thumbnailFormat,
    "image"
  );

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not upload please try again");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnails: {
          public_id: thumbnail.public_id,
          url: thumbnail.secure_url,
        },
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "changes are not update try again!!");
  }

  if (updatedVideo) {
    await deleteOnCloudinary(thumbnailToDelete);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video

  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can delete their video");
  }

  const videoDelete = await Video.findByIdAndDelete(videoId);

  if (!videoDelete) {
    throw new ApiError(500, "Failed to delete the video please try again");
  }

  await deleteOnCloudinary(video?.thumbnails.url); // video model has thumbnail public_id stored in it->check videoModel
  await deleteOnCloudinary(video?.videoFile.public_id, "video"); // specify video while deleting video

  await Like.deleteMany({
    video: videoId,
  });
  await Comment.deleteMany({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      401,
      "You can't toogle publish status as you are not the owner"
    );
  }

  const toggledVideoPublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );

  if (!toggledVideoPublish) {
    throw new ApiError(500, "Failed to toogle video publish status");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toggledVideoPublish,
        "Video publish toggled successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
