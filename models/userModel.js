const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A user must have a name'],
		trim: true
	},
	email: {
		type: String,
		required: [true, 'A user must have an email'],
		trim: true,
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Provide a valid email']
	},
	photo: {
		type: String,
		default: 'default.jpg'
	},
	role: {
		type: String,
		default: 'user',
		enum: ['user', 'guide', 'lead-guide', 'admin']
	},
	password: {
		type: String,
		required: [true, 'A user must have a password'],
		minLength: [8, 'Password length must be atleast 8 characters'],
		select: false
	},
	passwordConfirm: {
		type: String,
		required: [true, 'A user must confirm password'],
		validate: {
			// Only works on save, create
			validator: function(el) {
				return el === this.password;
			},
			message: 'Passwords are not the same'
		}
	},
	passwordChangedAt: {
		type: Date
	},
	passwordResetToken: {
		type: String
	},
	passwordResetExpires: {
		type: Date
	},
	active:{
		type: Boolean,
		default: true,
		select: false
	}
});


userSchema.pre('save', async function(next) {
	// if password is not updated then don't do anything.
	if(!this.isModified('password')) return next();

	// hash the password
	this.password = await bcrypt.hash(this.password, 12);
	// remove passwordConfirm because it is only needed in input to check if user typed the correct password 2 times.  
	this.passwordConfirm = undefined;
	next();
});

userSchema.pre(/^find/, function(next) {
	// this points to current query
	this.find({ active: {$ne: false} });
	next();
});

userSchema.pre('save', function(next){
	if(!this.isModified('password') || this.isNew){
		return next();
	}
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword); 
};

userSchema.methods.changedPasswordAfter = async function(JWTTimestamp) {
	if(this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return JWTTimestamp < changedTimestamp;
	}

	return false;
}

userSchema.methods.createPasswordResetToken = async function() {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
}
 
const User = mongoose.model('User', userSchema);

module.exports = User;