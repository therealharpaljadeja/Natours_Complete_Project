const express = require('express');
const userController = require('../controllers/userController.js')
const authenticationController = require('./../controllers/authenticationController');
const reviewController = require('./../controllers/reviewController');


const router = express.Router();


// Because signup can only have post request
router.post('/signup', authenticationController.signup);

router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);

router.use(authenticationController.protect)

router.patch('/updatePassword', authenticationController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

router.delete('/deleteMe', userController.deleteMe);

router.use(authenticationController.restrictTo('admin'));

router
	.route('/')
	.get(userController.getAllUsers)
	.post(userController.createUser);

router
	.route('/:id')
	.get(userController.getUser)
	.patch(userController.updateUser)
	.delete(userController.deleteUser);




module.exports = router;