const jwt = require('jsonwebtoken');
const joi = require('joi'); //package validation data
const { tb_films, tb_transac, tb_users } = require('../../models')
const rupiah = require('rupiah-format')
const { uploadFromBuffer } = require("../utils/cloudinary");
const { withErrorLogging } = require('../middlewares/logger');

const isExternalUrl = (value = '') => /^https?:\/\//i.test(value);
const resolveFileUrl = (value, basePath = '') => {
        if (!value) return value;
        if (isExternalUrl(value)) return value;
        return `${basePath}${value}`;
};

const uploadImageBuffer = async (file, folder) => {
        if (!file) return null;
        return uploadFromBuffer(file.buffer, {
                folder,
                use_filename: true,
                unique_filename: false,
                public_id: file.originalname ? file.originalname.replace(/\s/g, '') : undefined,
                resource_type: 'auto',
        });
};

// ============
// add film
// ============
exports.addFilm = withErrorLogging(async (req, res) => {

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
            return res.status(400).send({
                status: 'failed',
                message: error.details[0].message
            })
        }

        const thumbnailFile = req.files?.thumbnail?.[0];
        const posterFile = req.files?.poster?.[0];

        if (!thumbnailFile) {
            return res.status(400).send({
                status: 'failed',
                message: 'Please upload a thumbnail',
            });
        }

        const [thumbnailUpload, posterUpload] = await Promise.all([
            uploadImageBuffer(thumbnailFile, "cinema-online/film"),
            posterFile ? uploadImageBuffer(posterFile, "cinema-online/film") : Promise.resolve(null),
        ]);

        const addFilm = await tb_films.create({
            ...data,
            thumbnail: thumbnailUpload?.secure_url,
            poster: posterUpload?.secure_url || null,
        })

        const film = await tb_films.findOne({
            where: {
                id: addFilm.id
            }
        })

        film.thumbnail = resolveFileUrl(film.thumbnail, process.env.PATH_FILE_FILM);
        film.poster = resolveFileUrl(film.poster, process.env.PATH_FILE_FILM);

        res.send({
            status: 'success',
            data: {
                film
            }
        })

}, 'addFilm');

// ============
// Edit Film
// ============
exports.editFilm = withErrorLogging(async (req, res) => {
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
            return res.status(400).send({
                status: 'failed',
                message: error.details[0].message
            })
        }

        const thumbnailFile = req.files?.thumbnail?.[0];
        const posterFile = req.files?.poster?.[0];

        const payload = { ...data };

        if (thumbnailFile) {
            const thumbnailUpload = await uploadImageBuffer(thumbnailFile, "cinema-online/film");
            payload.thumbnail = thumbnailUpload?.secure_url;
        }

        if (posterFile) {
            const posterUpload = await uploadImageBuffer(posterFile, "cinema-online/film");
            payload.poster = posterUpload?.secure_url;
        }

        await tb_films.update(payload, {
                where: {
                        id
                }
        })

        const film = await tb_films.findOne({
            where: {
                id
            }
        })

        film.thumbnail = resolveFileUrl(film.thumbnail, process.env.PATH_FILE_FILM);
        film.poster = resolveFileUrl(film.poster, process.env.PATH_FILE_FILM);
        film.price = rupiah.convert(film.price)

        res.send({
            status: 'success',
            data: {
                film
            }
        })

}, 'editFilm');

// ============
// show Film
// ============
exports.showFilm = withErrorLogging(async (req, res) => {
        const film = await tb_films.findAll({
            order: [
                ['createdAt', 'ASC']  // Ubah 'name' dengan kolom yang ingin diurutkan
              ]
        })

        // film.sort((a, b) => {
        //     return b.createdAt - a.createdAt
        // })

        film.map((item) => {
            item.thumbnail = resolveFileUrl(item.thumbnail, process.env.PATH_FILE_FILM)
            item.poster = resolveFileUrl(item.poster, process.env.PATH_FILE_FILM)
            item.price = rupiah.convert(item.price)
        })

        res.send({
            status: 'success',
            data: {
                film
            }
        })
}, 'showFilm');

// ============
// select Film
// ============
exports.selectFilm = withErrorLogging(async (req, res) => {
        const { id } = req.params
        const { authorization = false } = req.headers

        let status = '-'
        let film = {}
        await Promise.all([
            tb_films.findOne({where: { id }}).then((res)=> film = res),

            (async()=>{
                if (authorization) {
                    const token = authorization.split(' ')[1]
                    const SECRET_KEY = process.env.TOKEN_KEY
                    const verified = jwt.verify(token, SECRET_KEY) //data user in token
                    const { id: iduser } = await tb_users.findOne({
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
            })()
        ])

        film.thumbnail = resolveFileUrl(film.thumbnail, process.env.PATH_FILE_FILM)
        film.poster = resolveFileUrl(film.poster, process.env.PATH_FILE_FILM)
        film.price = rupiah.convert(film.price)

        res.send({
            status: 'success',
            data: {
                status,
                film,
            }
        })
}, 'selectFilm');

// ============
// show My list film
// ============
exports.showMyList = withErrorLogging(async (req, res) => {
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
            item.film.thumbnail = resolveFileUrl(item.film.thumbnail, process.env.PATH_FILE_FILM)
            item.film.poster = resolveFileUrl(item.film.poster, process.env.PATH_FILE_FILM)
            item.film.price = rupiah.convert(item.film.price)
        })

        res.send({
            status: 'success',
            data: {
                mylist
            }
        })
}, 'showMyList');

// ============
// delete movie
// ============
exports.deleteFilm = withErrorLogging(async (req, res) => {
        const { id } = req.params

        await tb_films.destroy({
            where: { id }
        })

        res.send({
            status: 'success',
            message: 'film has been delete'
        })

}, 'deleteFilm');
