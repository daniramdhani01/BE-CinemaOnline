const joi = require('joi'); //package validation data
const bcrypt = require('bcrypt') //package encryption data
const jwt = require('jsonwebtoken') //package token
const { tb_users } = require('../../models')
const { uploadFromBuffer } = require("../utils/cloudinary");
const { withErrorLogging } = require('../middlewares/logger');

const isExternalUrl = (value = '') => /^https?:\/\//i.test(value);
const resolveFileUrl = (value, basePath = '') => {
        if (!value) return value;
        if (isExternalUrl(value)) return value;
        return `${basePath}${value}`;
};

// ===============
// register
// ===============
exports.showUser = withErrorLogging(async (req, res) => {
        const { email } = req.user

        let user = await tb_users.findOne({
            where: {
                email
            },
            attributes: {
                exclude: ['password','id','createdAt','updatedAt']
            }
        })

        user.image = resolveFileUrl(user.image, process.env.PATH_FILE_PP)

        res.send({
            status: 'success',
            data: {
                user
            }
        })

}, 'showUser');

// ===============
// register
// ===============
exports.regUser = withErrorLogging(async (req, res) => {
        const data = req.body
        const schema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().min(8).required(),
            fullname: joi.string().required(),
        });

        //do validation and get error
        const { error } = schema.validate(data);

        //if error exist send validation error message}
        if (error) {
            return res.status(400).send({
                status: 'failed',
                message: error.details[0].message
            })
        }

        const userExist = await tb_users.findOne({
            where: {
                email: data.email
            },
        })

        if (userExist) {
            return res.status(400).send({
                status: 'failed',
                message: 'user has been register'
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(data.password, salt)

        const newUser = await tb_users.create({
            ...data,
            password: hashedPassword
        });

        const dataToken = {
            id: newUser.id,
            email: newUser.email,
            fullname: newUser.fullname,
            isAdmin: newUser.isAdmin,
            image: resolveFileUrl(newUser.image, process.env.PATH_FILE_PP),
        }
        const SECRET_KEY = process.env.TOKEN_KEY
        const token = jwt.sign(dataToken, SECRET_KEY)

        res.send({
            status: "success",
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    fullname: newUser.fullname,
                    isAdmin: newUser.isAdmin,
                    image: resolveFileUrl(newUser.image, process.env.PATH_FILE_PP),
                    token,
                },
            },
        });
}, 'regUser');
// ===============
// login
// ===============
exports.loginUser = withErrorLogging(async (req, res) => {
        const data = req.body
        // console.log(data)
        const schema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().min(8).required(),
        });

        //do validation and get error
        const { error } = schema.validate(data);

        //if error exist send validation error message}
        if (error) {
            return res.status(400).send({
                status: 'failed',
                message: error.details[0].message
            })
        }

        const userExist = await tb_users.findOne({
            where: {
                email: data.email
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt',]
            }
        })

        if (!userExist) {
            return res.status(400).send({
                status: 'failed',
                message: 'Email not register'
            })
        }

        const isValid = await bcrypt.compare(data.password, userExist.password)

        if (isValid == false) {
            return res.status(400).send({
                status: 'failed',
                message: 'Email & password not match'
            })
        }

        const dataToken = {
            // id: userExist.id,
            fullname: userExist.fullname,
            email: userExist.email,
            isAdmin: userExist.isAdmin,
            image: resolveFileUrl(userExist.image, process.env.PATH_FILE_PP),
        }
        const SECRET_KEY = process.env.TOKEN_KEY
        const token = jwt.sign(dataToken, SECRET_KEY)

        res.send({
            status: 'success',
            data: {
                user: {
                    // id: userExist.id,
                    fullname: userExist.fullname,
                    email: userExist.email,
                    isAdmin: userExist.isAdmin,
                    image: resolveFileUrl(userExist.image, process.env.PATH_FILE_PP),
                    token,
                },
            }
        })
}, 'loginUser');
// ===============
// edit user
// ===============
exports.editUser = withErrorLogging(async (req, res) => {
        const id = req.params.id
        const newData = req.body

        // console.log(newData)

        const payload = {
                ...newData,
        };

        if (req.file) {
                const publicId = req.file.filename || (req.file.originalname ? req.file.originalname.replace(/\s/g, '') : undefined);
                await uploadFromBuffer(req.file.buffer, {
                        folder: "cinema-online/photoProfile",
                        use_filename: true,
                        unique_filename: false,
                        public_id: publicId,
                        overwrite: true,
                        resource_type: 'auto',
                });
                payload.image = req.file.filename;
        }

        await tb_users.update(payload, {
                where: {
                        id
                }
        })

        const data = await tb_users.findOne({
            where: {
                id
            },
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt']
            }
        })

        data.image = resolveFileUrl(data.image, process.env.PATH_FILE_PP)

        res.send({
            status: 'success',
            data: {
                user: {
                    data
                }
            }
        })
}, 'editUser');

exports.checkAuth = withErrorLogging(async (req, res) => {
        const { email } = req.user;
        
        const user = await tb_users.findOne({
            where: {
                email,
            }
        });
        
        if (!user) {
            return res.status(400).send({
                status: "failed",
            });
        }

        res.send({
            status: "success",
            data: {
                user: {
                    // id: user.id,
                    fullname: user.fullname,
                    isAdmin: user.isAdmin,
                    email: user.email,
                    image: resolveFileUrl(user.image, process.env.PATH_FILE_PP || process.env.PATH_FILE),
                }
            },
        });
}, 'checkAuth');
