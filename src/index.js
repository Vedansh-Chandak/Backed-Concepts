import dotenv  from "dotenv";
import connectDB from "./Db/index.js";
import { app } from "./app.js";


dotenv.config({
    path: './env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`surver is, ${process.env.PORT}`)
    })
    app.listen('error',(error)=>{
      console.log('Error:',error)
    })
})
.catch( (error)=>{
    console.log('MongoDB connection faol', error)
})