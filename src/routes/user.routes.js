import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";

import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


const router = Router();

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);



router.post("/login", loginUser);

//secured routes
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", accessrefreshToken);

router.post("/change-password", verifyJWT, changeNewPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/update-account-details", updateAccountDetails);

router.patch(
  "/update-avatar",
  verifyJWT,
  upload.single("avatar"),
  updateAvatar
);
router.patch(
  "/update-coverImage",
  verifyJWT,
  upload.single("coverImage"),
  updateCoverImage
);
router.get("/c/:username", verifyJWT, getUserChannelProfile);
router.get("/history", verifyJWT, getWatchHistory);

// router.route("/register").post(registerUser)

export default router;
