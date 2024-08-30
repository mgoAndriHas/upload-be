const express = require("express");
const app = express();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const db = require("./db");
const minio = require("minio");
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

const minioClient = new minio.Client({
  endPoint: "play.min.io",
  port: 9000,
  useSSL: true,
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

cloudinary.config({
  cloud_name: "dydjwts7v",
  api_key: "799974175552435",
  api_secret: "n16FLGBNbPcA94KdbCxluXihfYo",
});

// fungsi upload ke cloudinary
async function uploadClodinary(filePath) {
  let result;
  try {
    result = await cloudinary.uploader.upload(filePath, {
      use_filename: true,
      /* Tambahan Untuk Upload Video */
      resource_type: "auto",
    });

    // hapus file yang sudah diupload
    fs.unlinkSync(filePath);
    return result.url;
  } catch (err) {
    console.log("err", err);
    // hapus file yang gagal diupload
    fs.unlinkSync(filePath);
    return null;
  }
}

app.use(cors());
let whiteList = [
  "https://petitemart.click",
  "https://httpbin.org/post",
  "https://petitemart.click:3000",
];
let corsOption = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) != 1) {
      callback(null, true);
    } else {
      callback(new Error("Server tidak diizinkan akses oleh CORS"));
    }
  },
};

app.post(
  "/upload",
  upload.single("file"),
  cors(corsOption),
  async (req, res) => {
    let upload;
    try {
      const bucket = "bucket-andri";

      await minioClient.fPutObject(
        bucket,
        req.file.originalname,
        req.file.path
      );

      upload = await minioClient.presignedGetObject(
        bucket,
        req.file.originalname
      );

      fs.unlinkSync(req.file.path);
    } catch (err) {
      fs.unlinkSync(req.file.path);
      console.log(err);

      return res.json({ message: "Upload gagal" });
    }

    return res.json({ message: "Upload berhasil", url: upload });
  }
);

app.post(
  "/profile",
  upload.single("file"),
  cors(corsOption),
  async (req, res) => {
    // res.send(req.file);
    // console.log("path", req.file.path);
    const url = await uploadClodinary(req.file.path);
    // const filename = url.split("/").at(-1);
    const filename = req.file.filename;
    console.log(req.file);

    await db("files").insert({
      url: url,
      nama: filename,
    });

    if (url) {
      return res.json({
        message: "Upload berhasil",
        url: url,
      });
    } else {
      return res.json({
        message: "Upload Gagal",
      });
    }
  }
);

app.post("/photos/upload", upload.array("photos", 12), async (req, res) => {
  // res.send(req.files);
  let urls = [];
  let count = 1;

  for (const file of req.files) {
    const url = await uploadClodinary(file.path);
    // const filename = req.file.filename;

    await db("files")
      .insert({
        url: url,
        nama: `File Ke ${count}`,
      })
      .returning(["id"]);
    if (url) {
      urls.push(url);
    } else {
      return res.json({
        message: "Uplaod gagal",
      });
    }
    count++;
  }

  return res.json({
    message: "Upload berhasil",
    url: urls,
  });
});

app.get("/", (req, res) => {
  res.send("Server Nyala di Port : 5001");
});

app.get("/images", async (req, res) => {
  const images = await db("files").select("*");
  return res.json({ images });
});

app.listen(5001, () => {
  console.log("server is running on port: http://localhost:5001");
});
