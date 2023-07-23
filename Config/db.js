const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected Successfully`);
  
  } 
  catch (error) {
    console.log(`Some Error Occurs : ${error.message}`);
  }
};

module.exports = connectDB;