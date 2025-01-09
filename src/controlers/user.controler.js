import { asynchandler } from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../modles/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { Apiresponse } from '../utils/Apiresponse.js';

const generateAccessandRefershToken = async (userId)=>{
    try {
     const user = await User.findById(userId)
   const accessToken =  user.generateAccessToken()
   const refreshToken =  user.generateRefreshToken()
       user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}     
    } catch (error) {
        throw new ApiError(500, 'something wenrt wrong while generating token')
    }
}

const registerUser = asynchandler(async (req, res) => {
   //get user details from frontend
   //validation on details
   //check if user already exit: username, enmail
  // check for images, check for avatar
 //upload them to cloudinary, check avatar
 //create user object - create entry in db
 //remove password and refresh token field from response
 //check for user creation response 
 //return response to frontend

//get user detail
const {fullname,email, username, password} = req.body
    console.log("email", email);
    //validation
    if(
        [fullname, email, username, password].some((field)=> field?.trim() === '')
    ){
        throw new ApiError(400, 'All fields are requried')
    }

    const existedUser = await User.findOne({ $or: [{ email }, { username }]})

if(existedUser){
    throw new ApiError(409, 'User already exit')
}
console.log(req.files)

//geting path of avatar by multer
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar is requried')
}
console.log(avatarLocalPath)
//upload on cloudinary

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 
if(!avatar){
    throw new ApiError(400, 'Avatar is requried')
}

//create user object
const user = await User.create({
   fullname,
   avatar: avatar.url,
   coverImage: coverImage?.url || '',
   email,
   password,
   username: username.toLowerCase()
})
//check for user is create is or not
 const createdUser = await User.findById(user._id).select("-password -refreshToken")
if(!createdUser)
{
    throw new ApiError(500, 'Something went wrong in resgistration')
}

//return response
return res.status(201).json(new Apiresponse(201, createdUser, 'User is registered'))

});

const loginUser = asynchandler(async (req, res)=>{
// req body -> data
//username or email
//find the user
//check for password
//accress and refresh token
//send cookie
//return response

const {usernmae, email, password} = req.body
if (!uername || !email) {
    throw new ApiError(400, "username or paasword is requried")
}

const user = await User.findOne({$or: [{usernmae}, {email}]})
if(!user){
    throw new ApiError(400, "User not fornd")
}

const isPasswordValid = await user.isPasswordCorrect(password);
if(!isPasswordValid){
    throw new ApiError(401, "Invalid password")
}

const {accessToken, refreshToken} = await user.generateAccessandRefershToken(user._id)

const loggedInUser =   User.findById(user._id).select('-password -refrenshToken')

const options = {
//for security purpose by this cokiee can modify only by server not by forntend

  httpOnly: true,
  secure: true

}

return res.status(200)
.cokiee('accessToken', accessToken, options)
.cokiee('refreshToken', refreshToken, options)
.json(new Apiresponse(200,
     {
    user: loggedInUser, accessToken, refrenshToken
    },
    "user loggedin Successfully"
))
})

const logoutUser = asynchandler(async (res, req)=>{
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
        refrenchToken: undefined
    }
  },
{
    new: true
}
)

                 const options = {
                    //for security purpose by this cokiee can modify only by server not by forntend
                    
                      httpOnly: true,
                      secure: true
                    
                    }
                    return res.
                    status(200)
                    .clearCookie('accessToken', options)
                    .clearCookie('refrenchToken', options)
                    .json(new Apiresponse(200, "user is loggedOut"))
})




export { registerUser, loginUser, logoutUser };