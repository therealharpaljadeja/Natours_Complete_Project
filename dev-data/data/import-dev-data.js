const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({path: './../../config.env'});
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');



const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
.connect(DB, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true
})
.then(() => console.log('DB Connection Established'))

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


const importData = async () => {
	try{
		await Tour.create(tours);
		await User.create(users, { validateBeforeSave: false });
		await Review.create(reviews);
		console.log('Data Successfully Loaded');
		process.exit();
	} catch(err) {
		console.log(err);
	}
}

const deleteData = async () => {
	try{
		await Tour.deleteMany();
		await User.deleteMany();
		await Review.deleteMany();
		process.exit();
	} catch(err) {
		console.log(err);
	}
}

if(process.argv[2] === '--import'){
	importData();
} 
if(process.argv[2] === '--delete'){
	deleteData();
}
