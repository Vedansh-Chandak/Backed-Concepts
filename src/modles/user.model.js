import mongoose , {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


const userSchema = new Schema({
   username:{
    type:String,
    requried:true,
    unique:true,
    lowercase:true,
    trim:true,
    index: true
   },
  email: {
    type:String,
    requried:true,
    unique:true,
    lowercase:true,
    trim:true
   },
   fullname:{
    type:String,
    requried:true,
    trim:true,
    index: true
   },
   avatar:{
    type:String, //cloudinary services
    requried:true
   },
   coverImage:{
    type:String
   },
   watchHistory:[
    {
        type:Schema.Types.ObjectId,
        ref: 'Video'
    }
   ],
   password:{
  type: String,
  requried: [true, 'Password is requried']
},
refreshToken:{
    type: String,
}


},{timestamps:true})

userSchema.pre("save", async function(next){
  //this is use to only chance the password when user is want
  if(!this.isModified("password")) return next();

 this.password = bcrypt.hash(this.password, 10)
 next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (){
 return jwt.sign({
  _id:this._id,
  email:this.email,
  usernmae: this.username,
  fullname: this.fullname
},
process.env.ACCESS_TOKEN_SECRET,
{
  expiresIn: process.env.ACCESS_TOKEN_EXPIRY 
}

)

}
userSchema.methods.generateRefreshToken = function (){
  return jwt.sign({
    _id:this._id,
},
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
  }
  
  )

}

export const User = mongoose.model('User',userSchema)
