const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router.use(authenticationController.protect);

router.get('/checkout-session/:tourId', authenticationController.protect, bookingController.getCheckoutSession);

router.use(authenticationController.restrictTo('admin', 'lead-guide'));

router
.route('/')
.get(bookingController.getAllBooking)
.post(bookingController.createBooking)


router
.route('/:id')
.patch(bookingController.updateBooking)
.get(bookingController.getBooking)
.delete(bookingController.deleteBooking);

module.exports = router;
