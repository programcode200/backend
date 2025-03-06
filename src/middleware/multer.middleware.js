import multer from "multer";

// const storage = multer.memoryStorage({
//   destination: function (req, file, cb) {
//     //file contain file that get from user becz file is not in req.body
//     cb(null, "./public/temp");
//   },

//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" +  file.originalname);
//   },
// });

// export const upload = multer({ storage: storage });


const storage = multer.memoryStorage(); // No destination or filename needed

export const upload = multer({ storage });

