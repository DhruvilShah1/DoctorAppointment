const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = req.body.folder || "others";

    return {
      folder: folder, 
      public_id: `${Date.now()}-${file.originalname}`,
      resource_type: "raw",
    };
  },
});

const upload = multer({ storage });

module.exports = upload;