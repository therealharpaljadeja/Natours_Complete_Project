const User = require('./../models/userModel');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');


const signToken = (id) => {
	return jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});
}

const createAndSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);

	const cookieOptions = {
		expires: new Date(Date.now + process.env.JWT_EXPIRES_IN * 24 * 60 * 10 * 1000),
		httpOnly: true 
	}

	if(process.env.NODE_ENV === 'production'){
		cookieOptions.secure = true;
	}
	console.log('sending cookie');
	res.cookie('jwt', token, cookieOptions);

	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user: user
		}
	});
}

const signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		passwordChangedAt: req.body.passwordChangedAt,
		role: req.body.role
	});

	const url = `${req.protocol}://${req.get('host')}/me`;
	console.log(url);
	console.log(Email);
	await new Email(newUser, url).sendWelcome();

	createAndSendToken(newUser, 201, res);
});


const login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	// 1) Check if email and password exist 
	if( !email || !password ){
		return next(new AppError('Please provide email and password', 400));
	}

	// 2) Check if user exists && password is correct
	const user = await User.findOne({email: email}).select('+password');

	if(!user || !(await user.correctPassword(password, user.password))){
		return next(new AppError('Incorrect email or password', 401));
	}
	// 3) If everything is ok, send token to client
	createAndSendToken(user, 200, res);
});

const logout = (req, res) => {
	res.cookie('jwt', 'loggedOut', {
		expires: new Date(Date.now + 10 * 1000) ,
		httpOnly: true
	});
	res.status(200).json({ status: 'success' });
}

const protect = catchAsync(async (req, res, next) => {
	let token;
	// 1) Getting token and check if it exists.
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		token = req.headers.authorization.split(' ')[1];
	} else if(req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if(!token){
		return next(new AppError('You are not logged in. Please login to get access', 401));
	}

	// 2) Verfication token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) Check if user still exists
	const freshUser = await User.findById(decoded.id);
	if(!freshUser){
		return next(new AppError('The user belonging to this token does not exists', 401));
	}

	// 4) Check if user changed password  after the token was issued.
	if(!freshUser.changedPasswordAfter(decoded.iat)){
		return next(new AppError('User Recently changed Password! Please login again', 401));
	}

	// Grant Access
	
	req.user = freshUser;
	res.locals.user = freshUser;
	next();
})


const restrictTo = (...roles) => {
	return (req, res, next) => {
		// roles is an array.
		if(!roles.includes(req.user.role))
			return next(new AppError('You do not have permission to perform this action', 403));
	next();	
	}
}

const forgotPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on posted email
	const user = await User.findOne({ email: req.body.email });
	if(!user){
		return next(new AppError('There is no user with email address', 404));
	}

	// 2) Generate random token
	const resetToken = await user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });


	// 3) Send it to user's email
	const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

	const message = `Forgot your password? Submit a PATCH with your new password and passwordConfirm to: ${resetURL}.`
	
	try{
		await new Email(user, resetURL).sendPasswordReset();
		
		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!'
		});	
	} catch(err) {
		console.log(err);
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		return next(new AppError('There was an error sending an email. Try again later!', 500));
	}

	
});

const resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on the token

	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

	const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
	
	// 2) If the token has not expired, and there is user, set the new password

	if(!user) {
		return next(new AppError('Token is invalid or has expired', 400));
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	await user.save();

	// 3) Update changedPasswordAt property for the user.



	// 4) Log the user in, send JWT
	createAndSendToken(user, 200, res);


});


const updatePassword = catchAsync(async(req, res, next) => {
	// 1) Get user from the collection

	const user = await User.findById(req.user.id).select('+password');
	console.log(user);
	// 2) Check if posted password is correct
	if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
		return next(new AppError('Your current password is wrong.', 401));
	}
	// 3) If so then update the password.
	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	await user.save();

	// 4) Log the user in with the updated password.
	createAndSendToken(user, 200, res);

})


const isLoggedIn = async (req, res, next) => {
	if(req.cookies.jwt) {
		try{
			// 1) Verfies token
			const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

			// 2) Check if user still exists
			const freshUser = await User.findById(decoded.id);
			if(!freshUser){
				return next();
			}

			// 3) Check if user changed password  after the token was issued.
			if(!freshUser.changedPasswordAfter(decoded.iat)){
				return next();
			}

			// Grant Access
			res.locals.user = freshUser;
			console.log('is logged in');
			console.log(freshUser);
			next();
		} catch(err){
			next();
		}
		
	} else {
		
		next();
	}
}

module.exports = {
	signup: signup,
	login: login,
	protect: protect,
	restrictTo: restrictTo,
	forgotPassword: forgotPassword,
	resetPassword: resetPassword,
	updatePassword: updatePassword,
	isLoggedIn: isLoggedIn,
	logout: logout
}