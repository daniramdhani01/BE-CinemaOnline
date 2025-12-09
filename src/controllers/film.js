const jwt = require('jsonwebtoken');
const joi = require('joi'); //package validation data
const { tb_films, tb_transac, tb_users } = require('../../models')
const rupiah = require('rupiah-format')
const { uploadFromBuffer, destroyAsset } = require("../utils/cloudinary");
const { withErrorLogging } = require('../middlewares/logger');

const isExternalUrl = (value = '') => /^https?:\/\//i.test(value);
const CLOUDINARY_BASE_URL = process.env.CLOUDINARY_BASE_URL || '';
const FILM_FOLDER = process.env.PATH_FILE_FILM || '';
const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');
const stripExtension = (value = '') => value.replace(/\.[^.]+$/, '');
const toPublicId = (value, folder = FILM_FOLDER) => {
        if (!value) return null;
        const folderPart = trimSlashes(folder);
        let id = value;

        if (isExternalUrl(value)) {
                const match = value.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.\/]+)?$/);
                if (!match) return null;
                id = match[1];
        }

        id = id.replace(/^\/+/, '');
        if (folderPart && !id.startsWith(folderPart)) {
                id = `${folderPart}/${id}`;
        }

        return stripExtension(id);
};
const resolveFileUrl = (value, folder = FILM_FOLDER) => {
        if (!value) return value;
        if (isExternalUrl(value)) return value;
        const base = trimTrailingSlash(CLOUDINARY_BASE_URL);
        const folderPart = trimSlashes(folder);
        if (base && folderPart) {
                return [base, folderPart, value].filter(Boolean).join('/');
        }
        if (base) {
                return [base, value].join('/');
        }
        if (folderPart) {
                return [folderPart, value].join('/');
        }
        return value;
};

const uploadImageBuffer = async (file, folder) => {
        if (!file) return null;
        const publicId = file.filename || (file.originalname ? file.originalname.replace(/\s/g, '') : undefined);
        return uploadFromBuffer(file.buffer, {
                folder,
                use_filename: true,
                unique_filename: false,
                public_id: publicId,
                overwrite: true,
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
            uploadImageBuffer(thumbnailFile, FILM_FOLDER),
            posterFile ? uploadImageBuffer(posterFile, FILM_FOLDER) : Promise.resolve(null),
        ]);

        const addFilm = await tb_films.create({
            ...data,
            thumbnail: thumbnailUpload?.secure_url || thumbnailFile.filename,
            poster: posterUpload?.secure_url || (posterFile ? posterFile.filename : null),
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
            const thumbnailUpload = await uploadImageBuffer(thumbnailFile, FILM_FOLDER);
            payload.thumbnail = thumbnailUpload?.secure_url || thumbnailFile.filename;
        }

        if (posterFile) {
            const posterUpload = await uploadImageBuffer(posterFile, FILM_FOLDER);
            payload.poster = posterUpload?.secure_url || posterFile.filename;
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

        const film = await tb_films.findOne({ where: { id } });

        if (film) {
                const thumbPublicId = toPublicId(film.thumbnail);
                const posterPublicId = toPublicId(film.poster);
                await Promise.all([
                        thumbPublicId ? destroyAsset(thumbPublicId) : Promise.resolve(),
                        posterPublicId ? destroyAsset(posterPublicId) : Promise.resolve(),
                ]);
        }

        await tb_films.destroy({ where: { id } })

        res.send({
            status: 'success',
            message: 'film has been delete'
        })

}, 'deleteFilm');
