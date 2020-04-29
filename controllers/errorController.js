 
module.exports =  (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	res.status(err.statusCode).render('error', {
		title: 'Something went wrong!',
		msg: err.message
	});

};
