const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


// const multerStorage = multer.diskStorage({
// 	destination: (req, file, callback) => {
// 		callback(null, 'public/img/users')
// 	},
// 	filename: (req, file, callback) => {
// 		// user-id-timestamp.jpeg
// 		const ext = file.mimetype.split('/')[1];
// 		callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
// 	}
// });

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

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = async (req, res, next) => {
	if(req.file) {
	req.file.filename =  `user-${req.user.id}-${Date.now()}.jpeg`;
	console.log('resizing');
	await sharp(req.file.buffer)
	.resize(500,500)
	.toFormat('jpeg')
	.jpeg({ quality: 90 })
	.toFile(`public/img/users/${req.file.filename}`);
	next();
	} else {
		next();
	}
}

const filterObj = (obj, ...allowedFields) => {
	const newObject = {};
	Object.keys(obj).forEach(el => {
		if(allowedFields.includes(el)) newObject[el] = obj[el];  
	});
	return newObject;
}

const getAllUsers = factory.getAll(User);

const createUser = (req, res) => {
	res.status(500).json({
		status: 'error',
		message: 'This route is not defined. Please use /signup instead.'
	})
};

const getUser = factory.getOne(User);

const updateUser = factory.updateOne(User);

const deleteUser = factory.deleteOne(User);

const getMe = (req, res, next) => {
	req.params.id = req.user.id;
	next();
}

const deleteMe = catchAsync(async(req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });
	res.status(204).json({
		status: 'success',
		data: null
	});
})

const updateMe = catchAsync(async(req, res, next) => {
	// 1) Create error if user POSTs password data
	if(req.body.password || req.body.passwordConfirm){
		return next(new AppError('This route is not for password updates! Please use /updatePassword', 400));
	}

	// 2) Filtered the body so the user cannot change roles.
	// console.log(filterObj(req.body, 'name', 'email'));
	const filteredBody = filterObj(req.body, 'name', 'email');
	if(req.file) filteredBody.photo = req.file.filename;

	// 3) Update User document
	const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true, 
		runValidators: true
	});
	// console.log(req.body, req.user.id);
	res.status(200).json({
		status: 'success',
		data:{
			user: updateUser
		}
	});
});



module.exports = {
	getAllUsers: getAllUsers,
	getUser: getUser,
	createUser: createUser,
	updateUser: updateUser,
	deleteUser: deleteUser,
	updateMe: updateMe,
	deleteMe: deleteMe,
	getMe: getMe,
	uploadUserPhoto: uploadUserPhoto,
	resizeUserPhoto: resizeUserPhoto
}