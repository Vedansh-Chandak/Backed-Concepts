import {v2 as cloudinary} from 'cloudinary'
//fs is use to manage the file system is inbuid in nodejs
import fs from 'fs'



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRETS
}); 

const uploadOnCloudinary = async (localFilePath) =>{
   try {
    if(!localFilePath) return null
    //upload file on cloudinary
  const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto"})
   //file has been uploaded successfully
 console.log('file is uploaded',
    response.url,)
    return response
 

   } catch (error) {
    //remove the localy saved tempory file as the upload operation is failed
    fs.unlinkSync(localFilePath);
return null;
}


}

export {uploadOnCloudinary}