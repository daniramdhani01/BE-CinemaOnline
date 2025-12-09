// import package here
const multer = require('multer');

const sanitizeName = (name = '') => name.replace(/\s/g, '');
const generateFilmFilename = (file) => `${file.fieldname}-${Date.now()}-${sanitizeName(file.originalname)}`;
const generateGenericFilename = (file) => `${Date.now()}-${sanitizeName(file.originalname)}`;
const assignFilenames = (files, generator) => {
    if (!files) return;
    const list = Array.isArray(files) ? files : Object.values(files).flat();
    list.forEach((file) => {
        file.filename = generator(file);
    });
};

exports.uploadFilm = (imageFile, imageFile2) => {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        // if (file.fieldname === imageFile && imageFile2) {
        if (file.fieldname) {
            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
                req.fileValidationError = {
                    message: 'Only image files are allowed!',
                };
                return cb(new Error('Only image files are allowed!'), false);
            }
        }
        cb(null, true);
    };

    const sizeInMb = 10;
    const maxSize = sizeInMb * 1000 * 1000;

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize,
        },
    }).fields([{ name: imageFile, maxCount: 1 }, { name: imageFile2, maxCount: 1 }])

    return (req, res, next) => {
        // console.log(req.file)
        upload(req, res, function (err) {
            if (req.fileValidationError) {
                return res.status(400).send({
                    status: 'failed',
                    ...req.fileValidationError
                });
            }

            if (!req.files && !err) {
                if (!req.files) {
                    return res.status(400).send({
                        status: 'failed',
                        message: 'Please select files to uploads',
                    })
                } else if (!req.files.thumbnail) {
                    return res.status(400).send({
                        status: 'failed',
                        message: 'Please select thumbnail',
                    })
                }
                return next()
                // return res.status(400).send({
                //     status: 'failed',
                //     message: 'Please select files to upload',
                // });
            }

            if (err) {
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return res.status(400).send({
                        status: 'failed',
                        message: `Max file sized ${sizeInMb}Mb`,
                    });
                }
                return res.status(400).send(err);
            }
            assignFilenames(req.files, generateFilmFilename);
            return next();
        });
    };
};

exports.uploadTransfer = (imageFile) => {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        if (file.fieldname === imageFile) {
            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
                req.fileValidationError = {
                    message: 'Only image files are allowed!',
                };
                return cb(new Error('Only image files are allowed!'), false);
            }
        }
        cb(null, true);
    };

    const sizeInMb = 10;
    const maxSize = sizeInMb * 1000 * 1000;

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize,
        },
    }).single(imageFile);

    return (req, res, next) => {
        upload(req, res, function (err) {
            if (req.fileValidationError) {
                return res.send(req.fileValidationError);
            }

            console.log(req.file)
            if (!req.file && !err) {
                // return next()
                return res.status(400).send({
                    status: 'failed',
                    message: 'Please select files to upload',
                });
            }

            if (err) {
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return res.status(400).send({
                        status: 'failed',
                        message: `Max file sized ${sizeInMb}Mb`,
                    });
                }
                return res.send(err);
            }
            assignFilenames(req.file ? [req.file] : null, generateGenericFilename);
            return next();
        });
    };
};

exports.uploadPhotoProfile = (imageFile) => {
    // console.log(imageFile)
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        if (file.fieldname === imageFile) {
            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
                req.fileValidationError = {
                    message: 'Only image files are allowed!',
                };
                return cb(new Error('Only image files are allowed!'), false);
            }
        }
        cb(null, true);
    };

    const sizeInMb = 10;
    const maxSize = sizeInMb * 1000 * 1000;

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize,
        },
    }).single(imageFile);

    return (req, res, next) => {
        upload(req, res, function (err) {
            if (req.fileValidationError) {
                return res.status(400).send(req.fileValidationError);
            }

            if (!req.file && !err) {
                return next()
                // return res.status(400).send({
                //     message: 'Please select files to upload',
                // });
            }

            if (err) {
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return res.status(400).send({
                        message: `Max file sized ${sizeInMb}Mb`,
                    });
                }
                return res.status(400).send(err);
            }
            assignFilenames(req.file ? [req.file] : null, generateGenericFilename);
            return next();
        });
    };
};
