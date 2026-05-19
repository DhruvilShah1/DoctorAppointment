const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

cloudinary.config({
  cloud_name:"dkpq0yqw4" ,
  api_key:"136983381167343" ,
  api_secret: "RjKP2OS65rl-hovSzWHV3B6nD18",
});

export default cloudinary;