const joi = require('joi'); //package validation data
const bcrypt = require('bcrypt') //package encryption data
const jwt = require('jsonwebtoken') //package token
const { tb_users } = require('../../models')
const cloudinary = require("../utils/cloudinary");

// ===============
// register
// ===============
exports.showUser = async (req, res) => {
    try {
        const { email } = req.user

        let user = await tb_users.findOne({
            where: {
                email
            },
            attributes: {
                exclude: ['password','id','createdAt','updatedAt']
            }
        })

        user.image = process.env.PATH_FILE_PP + user.image

        res.send({
            status: 'success',
            data: {
                user
            }
        })

    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ===============
// register
// ===============
exports.regUser = async (req, res) => {
    try {
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
            return res.send({
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
            return res.send({
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
            image: process.env.PATH_FILE_PP + newUser.image,
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
                    image: process.env.PATH_FILE_PP + newUser.image,
                    token,
                },
            },
        });
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}
// ===============
// login
// ===============
exports.loginUser = async (req, res) => {
    try {
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
            return res.send({
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
            return res.send({
                status: 'failed',
                message: 'Email not register'
            })
        }

        const isValid = await bcrypt.compare(data.password, userExist.password)

        if (isValid == false) {
            return res.send({
                status: 'failed',
                message: 'Email & password not match'
            })
        }

        const dataToken = {
            // id: userExist.id,
            fullname: userExist.fullname,
            email: userExist.email,
            isAdmin: userExist.isAdmin,
            image: process.env.PATH_FILE_PP + userExist.image,
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
                    image: process.env.PATH_FILE_PP + userExist.image,
                    token,
                },
            }
        })
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error',
        })
    }
}
// ===============
// edit user
// ===============
exports.editUser = async (req, res) => {
    try {
        const id = req.params.id
        const newData = req.body

        // console.log(newData)

        if (!req.file) {
            await tb_users.update({
                ...newData,
                // image: req.file.filename,
            }, {
                where: {
                    id
                }
            })
        } else {
            // console.log('file here:', req.file)
            await tb_users.update({
                ...newData,
                image: req.file.filename,
            }, {
                where: {
                    id
                }
            })
        }

        const data = await tb_users.findOne({
            where: {
                id
            },
            attributes: {
                exclude: ['password', 'createdAt', 'updatedAt']
            }
        })

        res.send({
            status: 'success',
            data: {
                user: {
                    data
                }
            }
        })
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.checkAuth = async (req, res) => {
    try {
        const { email } = req.user;
        
        const user = await tb_users.findOne({
            where: {
                email,
            }
        });
        
        if (!user) {
            res.status(404)
            return res.send({
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
                    image: process.env.PATH_FILE + user.image,
                }
            },
        });
    } catch (error) {
        res.status(500)
        res.status({
            status: "failed",
            message: "Server Error",
        });
    }
};
