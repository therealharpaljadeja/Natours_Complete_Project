const mongoose = require('mongoose');	
const slugify = require('slugify');
// Only needed when embedding
// const User = require('./userModel.js');

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A tour must have a name'],
		unique: true,
		trim: true,
		maxLength: [40, 'A tour name must have less or equal than 40 characters'],
		minLength: [10, 'A tour name must have more or equal than 10 characters']
	},
	slug: {
		type: String,
	},
	duration: {
		type: Number,
		required: [true, 'A tour must have a duration'],
	},
	maxGroupSize: {
		type: Number,
		required: [true, 'A tour must have a group size'],
	},
	difficulty: {
		type: String,
		required: [true, 'A tour must have a difficulty'],
		enum: { values: ['easy', 'medium', 'difficult'], message: 'Difficulty is either easy, medium or difficult'} 
	},
	ratingsAverage: {
		type: Number,
		default: 4.5,
		min: [1, 'Rating must be above 1.0'],
		max: [5, 'Rating must be below 5.0'],
		set: val => Math.round(val * 10) / 10
	},
	ratingsQuantity: {
		type: Number,
		default: 0
	},
	rating: {
		type: Number,
		default: 4.5,
		min: [1, 'Rating must be above 1.0'],
		max: [5, 'Rating must be below 5.0']
	},
	price: {
		type: Number,
		required: [true, 'A tour must have a price']
	},
	priceDiscount: {
		type: Number,
		validate: {
			validator: function(val){
				// This wont work on update only works when creating new document.
				return val < this.price;
			},
		message: 'Price Discount ({VALUE}) cannot be higher than price.' 
		} 
		
	},
	summary: {
		type: String,
		trim: true,
		required: [true, 'A tour must have a summary']
	},
	description: {
		type: String,
		trim: true
	},
	imageCover: {
		type: String,
		required: [true, 'A tour must have a cover image']
	},
	images: [String],
	createdAt: {
		type: Date,
		default: Date.now()
	},
	startDates: [Date],
	startLocation:{
		//GeoJSON
		type: {
			type: String,
			default: 'Point',
			enum: ['Point']
		},
		coordinates: [Number],
		address: String,
		description: String
	},
	locations: [
		{
			type:{
				type: String,
				default: 'Point',
				enum: ['Point']
			},
			coordinates: [Number],
			address: String,
			description: String,
			day: Number
		}
	],
	guides: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User'
		}
	]
}, {
	toJSON: { virtuals : true },
	toObject: { virtuals : true },
});

tourSchema.index({
	price: 1,
	ratingsAverage: -1
});

tourSchema.index({
	startLocation: '2dsphere'
});

tourSchema.virtual('durationWeeks').get(function(){
	return this.duration / 7;
})


// Virtual Populate 
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});

// Document Middleware excutes before save(), .create() but not insertMany()
	tourSchema.pre('save', function(next){
		this.slug = slugify(this.name, { lower: true });
		next();
	})

// tourSchema.pre('save', function(next){
// 	console.log(this);
// 	next();
// });

// tourSchema.post('save', function(doc, next){
// 	console.log(doc);
// 	next();
// })

// Guide Embedding
// tourSchema.pre('save', async function(next) {
// 	const guidesPromises = this.guides.map(async (id) => await User.findById(id)) 
// 	this.guides = await Promise.all(guidesPromises);

// 	next();
// })

// Query Middleware
// tourSchema.pre('find', function(next) => {
	// Statement here will execute before find type statement on tours collection not findOne and findMany.
// tourSchema.pre(/^find/, function(next)  {
// 	// Statement here will execute before all find type statement on tours collection bcoz of regex.
// 	this.find({ secretTour: { $ne: true } })
// 	this.start = Date.now();
// 	next();
// });

// tourSchema.post(/^find/, function(docs, next)  {
// 	console.log(docs);
// 	next();
// 	console.log(Date.now() - this.start);
// });


tourSchema.pre(/^find/, function(next) {
	this.populate({
		path: 'guides',
		select: '-__v -passwordChangedAt'
	});
	
	next();
})

// // Aggregation Middleware
// tourSchema.pre('aggregate', function(next) {
// 	console.log(this);
// });


const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
	name: 'Kanheri Caves',
	rating: 3.5,
	price: 300
});

module.exports = Tour;