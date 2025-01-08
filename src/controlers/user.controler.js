import { asynchandler } from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../modles/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { Apiresponse } from '../utils/Apiresponse.js';

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

    const existedUser = User.findOne({$or: [{ email }, { username }]})

if(existedUser){
    throw new ApiError(409, 'User already exit')
}
//geting path of avatar by multer
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar is requried')
}
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

export default registerUser;
