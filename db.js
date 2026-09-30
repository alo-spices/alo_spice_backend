
const mongoose = require("mongoose");

const connectDB = async () => {
  try {

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("message: server connection is success");

  } catch (error) {

    console.log("message: connect fail");
    console.log(error);

    process.exit(1);
  }
};

module.exports = connectDB;
