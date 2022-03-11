const joi = require('joi'); //package validation data
const { tb_films, tb_transac } = require('../../models')
const rupiah = require('rupiah-format')
// ============
// add film
// ============
exports.addFilm = async (req, res) => {
    try {

        const data = req.body
        // console.log(req.file)
        // console.log(data)
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

        if (!req.files) {
            return res.send({
                status: 'failed',
                message: 'Please select files to uploads',
            })
        } else if (!req.files.thumbnail) {
            return res.send({
                status: 'failed',
                message: 'Please select thumbnail',
            })
        } else if (!req.files.poster) {
            addFilm = await tb_films.create({
                ...data,
                thumbnail: req.files.thumbnail[0].filename,
            })
        } else {
            addFilm = await tb_films.create({
                ...data,
                thumbnail: req.files.thumbnail[0].filename,
                poster: req.files.poster[0].filename,
            })
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
            message: 'server error'
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
        const film = await tb_films.findAll()

        film.sort((a, b) => {
            return b.createdAt - a.createdAt
        })

        console.log('process here..')
        console.log(process.env.PATH_FILE_FILM)
        console.log(process.env.TOKEN_KEY)

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
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

// ============
// select Film
// ============
exports.selectFilm = async (req, res) => {
    try {
        const { id } = req.params
        const { iduser } = req.body
        let status = '-'

        let film = await tb_films.findOne({
            where: { id }
        })

        film.thumbnail = process.env.PATH_FILE_FILM + film.thumbnail
        film.price = rupiah.convert(film.price)

        if (iduser) {
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
        const { id } = req.params
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