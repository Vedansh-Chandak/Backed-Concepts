import { asynchandler } from "../utils/asynchandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

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

const changeCurrentPassword = asynchandler(async(req, res)=>{
   const { oldPassword, newPassword}= req.body

  const user = await User.findById(req.user?._id)

 const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)
if(!isPasswordCorrect){
  throw new ApiError(400, "Invalid Password")
}
user.password = newPassword
await user.save({validateBeforeSave: false})
return res.status(200)
.json(new Apiresponse(200, "password change successfully"))
})

const getCurrentUser = asynchandler(async(req, res)=>{
  return res.status(200)
  .json(new Apiresponse(200, req.user, "current user ferched"))
})

const updatAccountDetail = asynchandler(async(req, res)=>{
  const {fullname, email} =req.body
  if(!fullname || !email){
    throw new ApiError(400, "all field is requried")
  }

const user = User.findByIdAndUpdate( req.user?._id,
{
  $set: {
    fullname,
    email
  }
},{
  new:true
}

 ).select('-password -refreshToken')

 return res.status(200)
 .json(new Apiresponse(200, user, "Account detailed is updated"))
})

const updateUserAvatar  = asynchandler(async(req, res)=>{
 const avatarLocalPath =  req.file?.path
 if(!avatarLocalPath){
  throw new ApiError(400, "Avatart file is missing")
 }
 const avatar = await uploadOnCloudinary(avatarLocalPath)

 if(!avatar.url){
  throw new ApiError(400, "error while upload on avatar")
 }
 const user =  await User.findByIdAndUpdate(req.user?._id,
  { 
    $set: {
      avatar: avatar.url
    }
  },{
    new: true
  }
).select('-password')
return res.status(200)
.json(new Apiresponse(200, user, 'Avatar is updated'))

}
)

const updateCoverImage = asynchandler(async(req, res)=>{
   const coverImageLocalPath = req.user?.file.path

   if(!coverImageLocalPath){
    throw new ApiError(400, 'coverImage path is missing')
   }

 const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
  const user = User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select('-password')

  return res.status(200)
  .json(new Apiresponse(200, user, "Cover Image is updated"))
})

const getUserChannelProfile = asynchandler(async(req, res)=>{
  const {username} = req.params
  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }
//using aggregate pipelines
const channel =  await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: 'subcriptions',
        localField: "_id",
        foreignField: "channel",
        as: "subscriber"
      }
    },
    {
      $lookup: {
        from: "subcription",
        localField: "_id",
        foreignField: "subscirber",
        as: "subscribeTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscriber"
        }
      },
      channelSubscribeTo: {
        $size: "subscribeTo"
      },
      isSubscribed: {
        $cond: {
          if: {$in: [req.user?._id, "$subscriber.subscirber"]},
          then: true,
          else: false
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberCount: 1,
        channelSubscribeTo: 1,
        isSubscribed:1,
        avatar: 1 ,
        coverImage:1,
        email: 1
      }
    }
  ]
)
if(!channel?.length){
  throw new ApiError(400, "Channel deos not exit")
}

return res.status(200)
.json(new Apiresponse(200, channel[0], "User channel fetched successfully"))

})

const getWatchHistory = asynchandler(async(req, res)=>{
    const user = await aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup: {
          from: 'videos',
          localField: "watchHistory",
          foreignField: '_id',
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: 'owner',
                foreignField: "_id",
                as: "owner",
                pipeline: [
                 {
                  $project: {
                    username: 1,
                   
                    fullname: 1,
                    avatar: 1
                  }
                 }
                ]
              }
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner"
                }
              }
            }
          ]
        }
      }
    ])
    return res.status(200)
    .json(new Apiresponse(200, user[0].watchHistory , "watch History fetched successfully") )

})



export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser,
   changeCurrentPassword, updatAccountDetail,
   updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory };
