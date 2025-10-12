const joi = require('joi'); //package validation data
const { tb_transac, tb_films, tb_users } = require('../../models')
const rupiah = require('rupiah-format')
const cloudinary = require("../utils/cloudinary");
const { withErrorLogging } = require('../middlewares/logger');

exports.addTF = withErrorLogging(async (req, res) => {
        const data = req.body
        const { id } = req.user

        const schema = joi.object({
            idFilm: joi.string().required(),
            accountNum: joi.string().min(4).required(),
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

        if (!id) {
            return res.send({
                status: 'failed',
                message: 'Please login',
            })
        }

        const dataExist = await tb_transac.findOne({
            where: {
                iduser: id,
                idFilm: data.idFilm
            }
        })

        if (dataExist) {
            return res.send({
                status: 'failed',
                message: 'movie its already on your list'
            })
        }

        const tf = await tb_transac.create({
            idFilm: data.idFilm,
            iduser: id,
            accountNum: data.accountNum,
            buktiTF: req.file.filename
        })

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "cinema-online/transfer",
            use_filename: true,
            unique_filename: false,
        });

        res.send({
            status: 'success',
            data: {
                tf
            }
        })

}, 'addTF');

exports.historyTransac = withErrorLogging(async (req, res) => {
        const { id } = req.user

        const transac = await tb_transac.findAll({
            where: {
                idUser: id
            },
            include: {
                model: tb_films,
                as: 'film',
                attributes: ['title', 'price']
            },
            order: [['createdAt', 'DESC']]
        })

        // transac.sort((a, b) => {
        //     return b.createdAt - a.createdAt
        // })

        transac.map((item) => {
            item.film.price = rupiah.convert(item.film.price)
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
}, 'historyTransac');

exports.showTF = withErrorLogging(async (req, res) => {
        const transac = await tb_transac.findAll(
            {
                include: [
                    {
                        model: tb_films,
                        as: 'film',
                        attributes: ['title']
                    },
                    {
                        model: tb_users,
                        as: 'user',
                        attributes: ['fullname']
                    },
                ]
            }
        )

        transac.sort((a, b) => {
            return b.createdAt - a.createdAt
        })

        transac.map((item) => {
            item.buktiTF = process.env.PATH_FILE_TF + item.buktiTF
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
}, 'showTF');

exports.approve = withErrorLogging(async (req, res) => {
        const { id } = req.params

        const newData = await tb_transac.update(
            {
                status: 'Approved'
            }, {
            where: { id }
        })

        const transac = await tb_transac.findOne({
            where: { id }
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
}, 'approve');

exports.reject = withErrorLogging(async (req, res) => {
        const { id } = req.params

        const newData = await tb_transac.update(
            {
                status: 'Rejected'
            }, {
            where: { id }
        })

        const transac = await tb_transac.findOne({
            where: { id }
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
}, 'reject');

exports.pending = withErrorLogging(async (req, res) => {
        const { id } = req.params

        const newData = await tb_transac.update(
            {
                status: 'Pending'
            }, {
            where: { id }
        })

        const transac = await tb_transac.findOne({
            where: { id }
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
}, 'pending');
