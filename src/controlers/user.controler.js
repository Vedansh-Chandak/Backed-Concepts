import { asynchandler } from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
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
  const { fullname, email, username, password } = req.body;
  console.log("email", email);
  //validation
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are requried");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "User already exit");
  }
  console.log(req.files);

  //geting path of avatar by multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is requried");
  }
  console.log(avatarLocalPath);
  //upload on cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is requried");
  }

  //create user object
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //check for user is create is or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong in resgistration");
  }

  //return response
  return res
    .status(201)
    .json(new Apiresponse(201, createdUser, "User is registered"));
});

const loginUser = asynchandler(async (req, res) => {
  // req body -> data
  //username or email
  //find the user
  //check for password
  //accress and refresh token
  //send cookie
  //return response
console.log(req.body)
  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "username or paasword is requried");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(400, "User not fornd");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new Apiresponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asynchandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new Apiresponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asynchandler(async(req, res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorised request")
   }
 
 try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
   const user =  await User.findById(decodedToken?._id)
   
   if(!user){
       throw new ApiError(401, "Invalid Token")
   }
   
   if(incomingRefreshToken !== user.refreshToken){
       throw new ApiError(401, "Refersh token is expired or used")
   }
   
   const options ={
       httpOnly: true,
       secure: true
   }
   
   const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id)
   return res.status(200)
   .cookie("accessToken", accessToken)
   .cookie("refreshToken", newrefreshToken)
   .json(new Apiresponse(200, 'token is refreshed', {accessToken, newrefreshToken}))
   
   
 } catch (error) {
    throw new ApiError(401, error?.message || "invalid token")
 }})


export { registerUser, loginUser, logoutUser, refreshAccessToken };
