const joi = require('joi'); //package validation data
const { tb_films, tb_transac } = require('../../models')
const rupiah = require('rupiah-format')
const cloudinary = require("../utils/cloudinary");

// ============
// add film
// ============
exports.addFilm = async (req, res) => {
    try {

        const data = req.body

        console.log(req.files)

        const schema = joi.object({
            title: joi.string().required(),
            category: joi.string().required(),
            price: joi.string().required(),
            link: joi.string().required(),
            desc: joi.string().required(),
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

        let addFilm

        if (!req.files.poster) {
            addFilm = await tb_films.create({
                ...data,
                thumbnail: req.files.thumbnail[0].filename,
            })

            const result = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
                folder: "cinema-online/film",
                use_filename: true,
                unique_filename: false,
            });

        } else {
            addFilm = await tb_films.create({
                ...data,
                thumbnail: req.files.thumbnail[0].filename,
                poster: req.files.poster[0].filename,
            })

            const result = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
                folder: "cinema-online/film",
                use_filename: true,
                unique_filename: false,
            });

            const resultPoster = await cloudinary.uploader.upload(req.files.poster[0].path, {
                folder: "cinema-online/film",
                use_filename: true,
                unique_filename: false,
            });
        }

        const film = await tb_films.findOne({
            where: {
                id: addFilm.id
            }
        })

        res.send({
            status: 'success',
            data: {
                film
            }
        })

    } catch (err) {
        res.send({
            status: 'failed',
            // message: 'server error'
            message: err
        })
    }
}

// ============
// Edit Film
// ============
exports.editFilm = async (req, res) => {
    try {
        const { id } = req.params
        const data = req.body
        const schema = joi.object({
            title: joi.string().required(),
            category: joi.string().required(),
            price: joi.string().required(),
            link: joi.string().required(),
            desc: joi.string().required(),
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

        if (req.file) {
            const updateFilm = await tb_films.update({
                ...data,
                thumbnail: req.file.filename,
            }, {
                where: {
                    id
                }
            })
        } else {
            const updateFilm = await tb_films.update({
                ...data,
                // thumbnail: req.file.filename,
            }, {
                where: {
                    id
                }
            })
        }

        const film = await tb_films.findOne({
            where: {
                id
            }
        })

        res.send({
            status: 'success',
            data: {
                film
            }
        })

    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ============
// show Film
// ============
exports.showFilm = async (req, res) => {
    try {
        const film = await tb_films.findAll({
            order: [
                ['createdAt', 'ASC']  // Ubah 'name' dengan kolom yang ingin diurutkan
              ]
        })

        // film.sort((a, b) => {
        //     return b.createdAt - a.createdAt
        // })

        film.map((item) => {
            item.thumbnail = process.env.PATH_FILE_FILM + item.thumbnail
            item.poster = process.env.PATH_FILE_FILM + item.poster
            item.price = rupiah.convert(item.price)
        })

        res.send({
            status: 'success',
            data: {
                film
            }
        })
    } catch (err) {
        
        res.status(500)
        res.send({
            status: 'failed',
            message: err.message ?? 'server error'
        })
    }
}

// ============
// select Film
// ============
exports.selectFilm = async (req, res) => {
    try {
        const { id } = req.params
        const { authorization = false } = req.headers

        let status = '-'
        let film = {}
        await Promise.all([
            tb_films.findOne({where: { id }}).then((res)=> film = res),

            async()=>{
                if (authorization) {
                const token = authorization.split(' ')[1]
                const SECRET_KEY = process.env.TOKEN_KEY
                const verified = jwt.verify(token, SECRET_KEY) //data user in token
                const { id } = await tb_users.findOne({
                    where: { email:  verified.email}
                })
                let data = await tb_transac.findOne({
                    where: {
                        iduser,
                        idFilm: id,
                    }
                })
                if (data) {
                    status = data.status
                }
                }
            }
        ])

        film.thumbnail = process.env.PATH_FILE_FILM + film.thumbnail
        film.price = rupiah.convert(film.price)

        res.send({
            status: 'success',
            data: {
                status,
                film,
            }
        })
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ============
// show My list film
// ============
exports.showMyList = async (req, res) => {
    try {
        const { id } = req.user
        const mylist = await tb_transac.findAll({
            where: {
                iduser: id,
                status: 'Approved'
            },
            include: {
                model: tb_films,
                as: 'film',
            }
        })

        mylist.sort((a, b) => {
            return b.createdAt - a.createdAt
        })

        mylist.map((item) => {
            item.film.thumbnail = process.env.PATH_FILE_FILM + item.film.thumbnail
            item.film.price = rupiah.convert(item.film.price)
        })

        res.send({
            status: 'success',
            data: {
                mylist
            }
        })
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ============
// delete movie
// ============
exports.deleteFilm = async (req, res) => {
    try {
        const { id } = req.params

        await tb_films.destroy({
            where: { id }
        })

        res.send({
            status: 'success',
            message: 'film has been delete'
        })

    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}