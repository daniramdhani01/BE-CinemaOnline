const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload a file buffer without writing to disk.
const uploadFromBuffer = (fileBuffer, options = {}) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
            return reject(error);
        }
        return resolve(result);
    });

    stream.end(fileBuffer);
});

const destroyAsset = (publicId, options = {}) => {
    if (!publicId) return Promise.resolve(null);
    return cloudinary.uploader.destroy(publicId, options);
};

module.exports = cloudinary;
module.exports.uploadFromBuffer = uploadFromBuffer;
module.exports.destroyAsset = destroyAsset;
