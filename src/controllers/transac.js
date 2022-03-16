const joi = require('joi'); //package validation data
const { tb_transac, tb_films, tb_users } = require('../../models')
const rupiah = require('rupiah-format')
const cloudinary = require("../utils/cloudinary");

exports.addTF = async (req, res) => {
    try {
        const data = req.body
        const { id } = req.params

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

    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.historyTransac = async (req, res) => {
    try {
        const { id } = req.params
        const transac = await tb_transac.findAll({
            where: {
                idUser: id
            },
            include: {
                model: tb_films,
                as: 'film',
                attributes: ['title', 'price']
            }
        })

        transac.sort((a, b) => {
            return b.createdAt - a.createdAt
        })

        transac.map((item) => {
            item.film.price = rupiah.convert(item.film.price)
        })

        res.send({
            status: 'success',
            data: {
                transac
            }
        })
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.showTF = async (req, res) => {
    try {
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
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.approve = async (req, res) => {
    try {
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
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.reject = async (req, res) => {
    try {
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
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}

exports.pending = async (req, res) => {
    try {
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
    } catch (err) {
        res.send({
            status: 'failed',
            message: 'server error'
        })
    }
}