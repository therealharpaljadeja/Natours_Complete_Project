const express = require('express');
const fs = require('fs');
const tourController = require('../controllers/tourController');
const authenticationController = require('./../controllers/authenticationController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);


router
	.route('/top-5-cheap')
	.get(tourController.aliasTopTours, tourController.getAllTours)

router
	.route('/tour-stats')
	.get(tourController.getTourStats)

router
	.route('/monthly-plan/:year')
	.get(authenticationController.protect, authenticationController.restrictTo('lead-guide', 'admin', 'guide'), tourController.getMonthlyPlan)

router
	.route('/tours-within/:distance/center/:latlng/unit/:unit')
	.get(tourController.getToursWithin);

router
	.route('/distances/:latlng/unit/:unit')
	.get(tourController.getDistances);

router
	.route('/')
	.get(tourController.getAllTours)
	.post(authenticationController.protect, authenticationController.restrictTo('lead-guide', 'admin'), tourController.createTour)

router
	.route('/:id')
	.get(tourController.getTour)
	.patch( authenticationController.protect, authenticationController.restrictTo('lead-guide', 'admin'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)	
	.delete(
		authenticationController.protect, 
		authenticationController.restrictTo('admin', 'lead-guide'), 
		tourController.deleteTour
	)



module.exports = router;