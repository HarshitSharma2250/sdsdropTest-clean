const mongoose=require("mongoose")

const CardSchema=new mongoose.Schema({

card_name:{
    type:String,
    minlength:[3 , "card length should be grater then 2"],
    require:[true , "card is required"]
}
},
{
    versionKey:false,
    timestamps:true
}
)

module.exports = mongoose.model('Card', CardSchema); 
