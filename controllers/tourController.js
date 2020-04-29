const fs = require('fs');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();


const multerFilter = (req, file, cb) => {
	if(file.mimetype.split('/')[0] === 'image'){
		cb(null, true);
	} else {
		cb(new AppError('Not an image. Please upload only images', 400), false)
	}
}


const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
});

const uploadTourImages = upload.fields([
	{ name: 'imageCover', maxCount : 1},
	{ name: 'images', maxCount: 3  }
]);

const resizeTourImages = async (req, res, next) => {
	if(req.files.imageCover && req.files.images){
	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
	await sharp(req.files.imageCover[0].buffer)
	.resize(2000,1333)
	.toFormat('jpeg')
	.jpeg({ quality: 90 })
	.toFile(`public/img/tours/${req.body.imageCover}`);

	req.body.images = [];
	await Promise.all(req.files.images.map(async (image, index) => {
		const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
		await sharp(file.buffer)
		.resize(2000,1333)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/tours/${filename}`);
		req.body.images.push(filename);
	}));

	next();
	} else {
		next();
	}
}


const aliasTopTours = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
};


const getAllTours = factory.getAll(Tour);

const getTour = factory.getOne(Tour, { path: 'reviews' });

const createTour = factory.createOne(Tour);

const updateTour = factory.updateOne(Tour);

const deleteTour = factory.deleteOne(Tour);

// const deleteTour = catchAsync(async (req, res, next) => {
// 	await Tour.findByIdAndDelete(req.params.id);
	
// 	if(!tour){
// 		return next(new AppError(`Can't find this id`, 404));
// 	}

// 	res.status(204).json({
// 		status: 'success',
// 		data: null
// 	})

// });

const getTourStats = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte:4.5 } }
		},
		{
			$group: {
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' }
			}
		},
		{
			$sort: { avgPrice: -1 }
		},
		// {
		// 	$match: { _id: { $ne: 'EASY' } }
		// }
	])

	res.status(200).json({
		status: 'success',
		data: {
			stats
		} 
	});
})


const getMonthlyPlan = catchAsync(async (req, res, next) => {
	const year = req.params.year * 1;

	const plan = await Tour.aggregate([
		{
			$unwind: '$startDates'
		},
		{
			$match: { 
				startDates: {
					$gte: new Date(`${year}-01-01`),
					$lte: new Date(`${year}-12-31`) 
				} 
			}
		},
		{
			$group: {
				_id: { $month: '$startDates' },
				numTours: { $sum : 1 },
				tours: { $push: '$name' } 
			}
		},
		{
			$addFields: {
				month: '$_id'
			}
		},
		{
			$project: {
				_id: 0, 
			}
		},
		{
			$sort: { numTours: -1 }
		},
		{
			$limit: 12
		}
	])

	res.status(200).json({
		status: 'success',
		data: {
			plan
		} 
	});
})

const getToursWithin = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [lat, lng] = latlng.split(',');

	const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

	if(!lat || !lng) {
		next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
	}

	const tours = await Tour.find({ 
		startLocation: 
			{ 
				$geoWithin: { 
					$centerSphere: [ [lng, lat], radius] 
				} 
			} 
		});


	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			data: tours
		}
	})
});

const getDistances = catchAsync( async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [lat, lng] = latlng.split(',');

	const multiplier = unit === 'mi' ? 0.000621 : 0.001;

	if(!lat || !lng) {
		next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));
	}

	const distances = await Tour.aggregate([
		{
			$geoNear: {
				near: {
					type: 'Point',
					coordinates: [lng * 1, lat * 1]
				},
				distanceField: 'distance', 
				distanceMultiplier: multiplier
			}	
		},
		{
			$project: {
				distance: 1,
				name: 1
			}
		}
	]);

	res.status(200).json({
		status: 'success',
		data: {
			data: distances
		}
	});

});

module.exports = {
	getAllTours: getAllTours,
	getTour: getTour,
	createTour: createTour,
	updateTour: updateTour,
	deleteTour: deleteTour,
	aliasTopTours: aliasTopTours,
	getTourStats: getTourStats,
	getMonthlyPlan: getMonthlyPlan,
	getToursWithin: getToursWithin,
	getDistances: getDistances,
	uploadTourImages: uploadTourImages,
	resizeTourImages: resizeTourImages
}