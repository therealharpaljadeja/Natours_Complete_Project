const express = require('express');
const AppError = require('./utils/appError'); 
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json({
	limit: '10kb'
}));


// Data Sanitation against NoSQL Query Injection & CROSS SITE SCRIPTING.
// Removes dollar signs and dots from request body and request params
app.use(mongoSanitize());


const upload = multer({ dest: 'public/img/users' });

// Removes html from request.
app.use(xss()); 


// Set security headers.
app.use(helmet());

app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


const limiter = rateLimit({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many request from this IP. Please try again after 1 hour' 
});

// Rate Limiting
app.use('/api', limiter);


// Prevent Parameter Pollutions
app.use(hpp({
	whitelist: [
		'duration',
		'ratingsQuantity',
		'ratingsAverage',
		'maxGroupSize',
		'difficulty',
		'price'
	]
}));

app.use(cors());

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers',
	'Origin, X-Requested-With, Content-Type, Accept, Authroization'
	);
	res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
	next();
})

app.use((req, res, next) => {
	// console.log(req.cookies);
	next();
})

// Mounting Routers on Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/bookings', bookingRouter);


// Handling Unhandled requests
app.all('*', (req, res, next) => {
	// res.status(404).json({
	// 	status: 'fail',
	// 	message: `Error can't find ${req.originalUrl} on this server`
	// // });
	// const err = new Error(`Couldn't find ${req.originalUrl} on the server!`);
	// err.statusCode = 404;
	next(new AppError(`Error can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);


module.exports = app;