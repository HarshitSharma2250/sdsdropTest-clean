const mongoose=require("mongoose")

const UserSchema=new mongoose.Schema({

    telegram_id:{
        type:String,
        required:[true , "telegram_id required"],
        unique:[true , "this id already used"]
    },
    name:{
        type:String,
        minlength:[3 , "Name should be minimum 3 character long"]
    },
    avatar:{
        type:String,
        default:""
    },
refered_by:{
    type:String,
    default:""
},
role:{
    type:String,
    enum:["Admin","User"],
    default:"User"
}
},
{
    timestamps:true,
    versionKey:false,
})

module.exports=mongoose.model("user",UserSchema)