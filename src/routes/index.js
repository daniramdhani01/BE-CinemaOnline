const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth')
const { uploadFilm, uploadPhotoProfile, uploadTransfer } = require('../middlewares/uploadFile')

const {
    addTF,
    showTF,
    approve,
    reject,
    pending,
    historyTransac,
} = require('../controllers/transac')

const {
    regUser,
    loginUser,
    editUser,
    showUser,
    checkAuth,
} = require('../controllers/users')

const {
    addFilm,
    editFilm,
    showFilm,
    showMyList,
    selectFilm,
    deleteFilm,
} = require('../controllers/film')


// user
router.get('/check-auth', auth, checkAuth);
router.post('/login', loginUser)
router.post('/register', regUser)
router.get('/user', auth, showUser);
router.patch('/user/:id', auth, uploadPhotoProfile('image'), editUser)

// film
router.get('/film', showFilm)
router.get('/my-film', auth, showMyList)
router.get('/film-delete/:id', deleteFilm)
router.get('/detail-film/:id', selectFilm)
router.post('/film', uploadFilm('thumbnail', 'poster'), addFilm)
router.patch('/film/:id', auth, uploadFilm('thumbnail', 'poster'), editFilm)

//transaction
router.get('/incoming-transac', auth, showTF)
router.get('/transac', auth, historyTransac)
router.post('/transac', auth, uploadTransfer('image'), addTF)
router.patch('/approve/:id', auth, approve)
router.patch('/reject/:id', auth, reject)
router.patch('/pending/:id', auth, pending)



module.exports = router;