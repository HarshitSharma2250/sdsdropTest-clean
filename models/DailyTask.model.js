const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  task_name: {
    type: String,
    required: [true, "task name is required"],
  },

  type: {
    type: String,
    enum: ["daily", "social", "partner"],
    required: [true , "task type is required"],
  },

  task_points: {
    type: Number,
    required: true,
  },

  created_by:{
    type:String,
    required:true
  },
  task_url:{
    type:String,
    default:"",
  },
},{
    timestamps:true,
    versionKey:false
});

module.exports = mongoose.model("Task", taskSchema);

