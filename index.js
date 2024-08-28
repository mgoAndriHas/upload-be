const express = require("express");
const multer = require("multer");
const cors = require("cors");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    /* Untuk Validasi Foto */
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      return callback(null, true);
    } else {
      callback(null, false);
      return callback(new Error("Only .png .jpg .jpeg format allowed!"));
    }

    /* Untuk Validasi Video */
    // if (
    //   file.mimetype == "video/mp4" ||
    //   file.mimetype == "video/x-msvideo" ||
    //   file.mimetype == "video/quicktime"
    // ) {
    //   return callback(null, true);
    // } else {
    //   callback(null, false);
    //   return callback(new Error("Only .mp4 .avi .mov format allowed!"));
    // }

    /* Untuk Validasi PDF*/
    // if (file.mimetype == "application/pdf") {
    //   return callback(null, true);
    // } else {
    //   callback(null, false);
    //   return callback(new Error("Only .pdf format allowed!"));
    // }
  },
});

const app = express();
app.use(cors());
let whiteList = ["http://localhost:3000", "https://httpbin.org/post"];
let corsOption = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) != 1) {
      callback(null, true);
    } else {
      callback(new Error("Server tidak diizinkan akses oleh CORS"));
    }
  },
};

app.post("/profile", upload.single("file"), cors(corsOption), (req, res) => {
  res.send(req.file);
  console.log("path", req.file.path);
});

app.post("/photos/upload", upload.array("photos", 12), (req, res) => {
  res.send(req.files);
});

app.get("/", (req, res) => {
  res.send("Server Nyala di Port : 5001");
});

app.listen(5001, () => {
  console.log("server is running on port: http://localhost:5001");
});
