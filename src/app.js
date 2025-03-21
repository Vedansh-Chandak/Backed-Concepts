import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app = express()

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials:true
    }
))
app.use(express.json({limit: "600kb"}))
// this is use to configure url
app.use(express.urlencoded({
    extended: true,
    limit: "600kb"
}))
app.use(express.static("public"))
app.use(cookieParser({}))


//routes
import userRouter from './routes/user.routes.js'

// Routes declaration
app.use('/api/v1/users', userRouter); // Semicolon instead of colon

export { app }