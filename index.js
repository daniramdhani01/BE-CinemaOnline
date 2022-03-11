require('dotenv').config()
const express = require('express')
const cors = require('cors')
const router = require('./src/routes');

const app = express()

app.use(express.json())
app.use(cors())
app.use('/api/v1/', router);
app.use('/uploads/', express.static('uploads'))
app.use('/uploads/film', express.static('film'))
app.use('/uploads/photoProfile', express.static('photoProfile'))
app.use('/uploads/transfer', express.static('transfer'))

const port = process.env.PORT || 5000

app.listen(port, () => console.log(`Listening on port ${port}`))