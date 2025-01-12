import mongoose from "mongoose"


const tweetSchema = new Schema({
    constent: {
        tyep: String,
        requried: true
    },
    owner :{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps:true})



export const Tweet = mongoose.model("Tweet", tweetSchema)