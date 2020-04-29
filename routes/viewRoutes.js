const express = require('express');
const viewsController = require('./../controllers/viewsController');
const router = express.Router();
const authenticationController = require('./../controllers/authenticationController');
const bookingController = require('./../controllers/bookingController');

router.get('/', bookingController.createBookingCheckout, authenticationController.isLoggedIn, viewsController.getOverview);

router.get('/tour/:slug', authenticationController.isLoggedIn, viewsController.getTour);

router.get('/login', authenticationController.isLoggedIn, viewsController.getLogin);
router.get('/me', authenticationController.protect, viewsController.getAccount);

router.post('/submit-user-data', authenticationController.protect, viewsController.updateUserData);
router.get('/my-tours', authenticationController.protect, viewsController.getMyTours);

module.exports = router;