const {connect,connection}=require("mongoose")

const dataBase_connect=async()=>{
    try {
        await connect(`${process.env.MONGO_URL}`)
    } catch (error) {
        console.log("MongoDB Connection Error:",error.message);
        process.exit(1)
    }
}

connection.once("open", () => {
    console.log("MongoDB connected successfully");
  });

connection.on("Discunnected",()=>{
    console.log("MongoDb Disconnected");
})

connection.on("error",(error)=>{
    console.log("MongoDB Connection Error:",error.message);
})

module.exports=dataBase_connect
