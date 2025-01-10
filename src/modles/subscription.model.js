import mongoose, {Schema}  from "mongoose";

const subcriptionSchema = new Schema({
    subscirber:{
        type: mongoose.Schema.Types.ObjectId,//one who subscribing
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{ timestamps: true})


export const Subscription = mongoose.model('Subcription', subcriptionSchema)