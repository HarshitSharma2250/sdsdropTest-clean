const fs=require("fs")
const multer=require("multer")
const path=require("path")
const sharp=require("sharp")



if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+file.originalname)
    }
  })

  const fileFilter = (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images are allowed!'), false);
};

  const upload = multer({ 
    storage: storage ,
    fileFilter,
    limits: { fileSize: 100 * 1024 },
})


// if size is more then it will resize autometically
const processImage = async (req, res, next) => {
    if (!req.file) return next();

    const { path: filePath, filename } = req.file;
    const newPath = path.join('uploads', `resized-${filename}`);

    try {
        await sharp(filePath).resize({ width: 1024, height: 1024, fit: 'inside' }).toFile(newPath);
        fs.unlinkSync(filePath); 
        req.file.path = newPath;
        next();
    } catch (error) {
        console.error('Image processing error:', error);
        res.status(500).json({ msg: 'Error processing image' });
    }
};


module.exports = { upload, processImage };