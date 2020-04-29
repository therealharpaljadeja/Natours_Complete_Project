const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

const deleteOne = (model) => catchAsync(async (req, res, next) => {
	const doc = await model.findByIdAndDelete(req.params.id);
		
	if(!doc){
		return next(new AppError(`Can't find ${model} with this id`, 404));
	}

	res.status(204).json({
		status: 'success',
		data: null
	})

});

const updateOne = model => catchAsync(async (req, res, next) => {
	const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true
	})

	res.status(201).json({
		status: 'success',
		data: {
			doc
		}
	})
});


const createOne = model => catchAsync(async (req, res, next) => {
	const newDoc = await model.create(req.body);
	res.status(201).json({
		status: 'success',
		data: {
			data: newDoc 
		}
	});	
});


const getOne = (model, populateOptions) => catchAsync(async (req, res, next) => {
	let query = model.findById(req.params.id);
	if(populateOptions) query = query.populate(populateOptions); 

	const doc = await query;
	
	if(!doc){
		return next(new AppError(`Can't find this id`, 404));
	}
	res.status(200).json({
		status: 'success',
		data: {
			data: doc
		} 
	})
});

const getAll = (model) => catchAsync(async (req, res, next) => {

	// To allow for nested get reviews on tour
	let filter = {};
	if(req.params.id) filter = { tour: req.params.tourId };


	const features = new APIFeatures(model.find(filter), req.query)
	.filter() 
	.sort()
	.limitFields()
	.pagination();

	const doc = await features.query;
	
	res.status(200).json({
		status: 'success',
		results: doc.length,
		data: {
			data: doc
		}
	});
});




module.exports = {
	deleteOne: deleteOne,
	updateOne: updateOne,
	createOne: createOne,
	getOne: getOne,
	getAll: getAll
}