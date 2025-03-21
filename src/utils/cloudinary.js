import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
cloud_name: "dfhcz9bte", 
api_key: 493557567198323, 
api_secret: process.env.CLOUDINARY_API_SECRETS 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
       
        await fs.unlinkSync(localFilePath)
        return response;
      

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}