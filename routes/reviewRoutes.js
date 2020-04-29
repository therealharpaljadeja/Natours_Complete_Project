const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router({ mergeParams: true });

router.use(authenticationController.protect);

router
	.route('/')
	.get(reviewController.getAllReviews)
	.post( 
		authenticationController.restrictTo('user'), 
		reviewController.setTourUserIds,
		reviewController.createReview
	);

router
	.route('/:id')
	.get(reviewController.getReview)
	.delete(authenticationController.restrictTo('user', 'admin'), reviewController.deleteReview)
	.patch(authenticationController.restrictTo('user', 'admin'), reviewController.updateReview);
module.exports = router;
