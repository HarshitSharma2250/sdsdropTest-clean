const UserSchema=require('../models/UserRegistration.model')
const jwt=require('jsonwebtoken')


const Authentication=async(req,res,next)=>{

 if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

const token = req.headers.authorization.split(' ')[1];

    try {
    jwt.verify(token, process.env.ACCESS_KEY, async function(err, decoded) {
            
if(err){
   return res.status(403).json({
        success:false,
        msg:err.message
    })
}

const checkuerExist=await UserSchema.findById(decoded).lean()

if(!checkuerExist){
  return  res.status(404).json({
        success:false,
        msg:"User not Found , Account mismatched !"
    })
}

req.user_detail= checkuerExist

next()
     });

    } catch (error) {
        
res.status(500).json({
    success:false,
    msg:error.essage
})

    }

}

const Authorization = (allowedRoles) => {
    return async (req, res, next) => {
      try {
        const userData = await UserSchema.findById({ _id: req.user_detail._id });
        if (!userData) {
          return res.status(404).json({
            message: "User not found",
          });
        }
        const { role } = userData;
        if (!allowedRoles.includes(role.toString())) {
          return res.status(403).json({
            message: "You are not authorized to access this resource",
          });
        }
        next();
      } catch (error) {
        res.status(500).json({
          message: error.message,
          "error": "error coming from middleware"
        });
      }
    };
  };
  










module.exports={Authentication,Authorization}