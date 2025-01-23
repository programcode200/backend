import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //file contain file that get from user becz file is not in req.body
    cb(null, "./public/temp");
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
