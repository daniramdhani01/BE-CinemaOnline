const jwt = require('jsonwebtoken')

exports.auth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization')
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.send({
                message: 'Access denied!'
            });
        }

        const SECRET_KEY = process.env.TOKEN_KEY

        const verified = jwt.verify(token, SECRET_KEY) //data user in token

        // console.log('jwt')
        req.user = verified;
        console.log(req.user)

        next()
    } catch (error) {
        res.send({
            message: 'invalid token'
        })
    }
}