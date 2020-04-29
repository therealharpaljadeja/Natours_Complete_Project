const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

const getOverview = catchAsync(async (req, res, next) => {
	// 1) Get Tour Data from collection
	const tours = await Tour.find();

	// 2) Build Template

	// 3) Render Template
	res.status(200).render('overview', { title: 'All Tours', tours });
})


const getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({
		path: 'reviews',
		fields: 'review rating user'
	});

	if(!tour){
		return next(new AppError('No Such Tour', 404));
	}

	res.status(200).render('tour', { title: tour.name ,tour });
})

const getLogin = catchAsync(async (req, res) => {
	res.status(200).render('login', { title: 'Log into your account' });
})

const getAccount = (req, res) => {
	res.status(200).render('account', { title: 'Your Account' });
}

const updateUserData = catchAsync(async (req, res, net) => {
	const updatedUser = await User.findByIdAndUpdate(req.user.id, {
		name: req.body.name,
		email: req.body.email
	},
	{
		new: true,
		runValidators: true
	});
	
	res.status(200).render('account', {
		title: 'Your Account',
		user: updatedUser
	});

});

const getMyTours = catchAsync(async (req, res, next) => {
	// 1) Find all bookings
	const bookings = await Booking.find({ user: req.user.id });

	// 2) Find tours with returned id's.
	const tourIDs = bookings.map(el => el.tour);
	const tours = await Tour.find({ _id: { $in: tourIDs } });

	res.status(200).render('overview', {
		title: 'My Tours',
		tours
	});

});

module.exports = {
	getOverview: getOverview,
	getTour: getTour,
	getLogin: getLogin,
	getAccount: getAccount,
	updateUserData: updateUserData,
	getMyTours: getMyTours
}