/*
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

require("dotenv").config();

const router = express.Router();

//Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// muter set
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) { 
            return res.status(400).json({ message: "No file uploaded" });
        }
        //Function to handle the stream upload to CLoudinary
        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(error);
                    }
                });
                // Use streamifer to convert file buffer to a stream
                streamifier.createReadStream(fileBuffer).pipe(stream);
            });
        };
        //calll the streamuplaod funciton
        const result = await streamUpload(req.file.buffer);
        // Respnd with the uploaded image uRL
        res.json({ imageUrl: result.secure_url });
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;