import mongoose from "mongoose"

const playlistSchema = new Schema({
   name: {
    type:String,
    requried:true
   },
   description: {
    type: String,
    requried: true
   },
   videos: [
    {
        tyep: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
   ],
   owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
   }

},{timestamps:true})



export const Playlist = mongoose.model("Playlist",playlistSchema)