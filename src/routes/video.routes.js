// import { Router } from "express";
// import {
//   deleteVideo,
//   getAllVideos,
//   getVideoById,
//   publishAVideo,
//   togglePublishStatus,
//   updateVideo,
// } from "../controllers/video.controller.js";

// import { verifyJWT } from "../middleware/auth.middleware.js";
// import { upload } from "../middleware/multer.middleware.js";


// const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//   .route("/")
//   .get(getAllVideos)
//   .post(
//     upload.fields([
//       {
//         name: "videoFile",
//         maxCount: 1,
//       },
//       {
//         name: "thumbnail",
//         maxCount: 1,
//       },
//     ]),
//     publishAVideo
//   );




// router
//   .route("/:videoId")
//   .get(getVideoById)
//   .delete(deleteVideo)
//   .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

// export default router;





import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// ✅ PUBLIC: Get all videos (No authentication required)
router.get("/", getAllVideos);

// ✅ PUBLIC: Get a single video by ID (No authentication required)
router.get("/:videoId", getVideoById);


// 🔒 PROTECTED ROUTES (Require authentication)
router.use(verifyJWT); // Apply verifyJWT middleware to protected routes

// ✅ PUBLIC: Toggle video publish status
router.put("/toggle/publish/:videoId", togglePublishStatus);


router.post(
  "/",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

router
  .route("/:videoId")
  .delete(deleteVideo)
  .put(upload.single("thumbnail"), updateVideo);

export default router;
