const jwt = require('jsonwebtoken')
const { tb_users } = require('../../models')

exports.auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization')
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.send({
                status: 'failed',
                message: 'Access denied!'
            });
        }

        const SECRET_KEY = process.env.TOKEN_KEY

        const verified = jwt.verify(token, SECRET_KEY) //data user in token

        const { id } = await tb_users.findOne({
            where: { email:  verified.email}
        })

        req.user = {...verified, id};
        
        next()
    } catch (error) {
        res.send({
            message: 'invalid token'
        })
    }
}