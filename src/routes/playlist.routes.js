import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .put(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").put(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").put(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router; 