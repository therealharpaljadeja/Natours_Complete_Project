const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('./../models/bookingModel');


const getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get currently booked tour.
    const tour = await Tour.findById(req.params.tourId);
    console.log(tour);

    // 2) Create the checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: `${tour.summary}`,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1,
            }
        ]
    })

    

    // 3) Send the session to client.

    res.status(200).json({
        status: 'success',
        session
    })
})

const createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;
    if(!tour || !user || !price){
        next();
    } else {
        await Booking.create({
            tour,
            user,
            price
        });
        res.redirect(req.originalUrl.split('?')[0]);
    }
});

const createBooking = factory.createOne(Booking);
const getBooking = factory.getOne(Booking);
const getAllBooking = factory.getAll(Booking);
const updateBooking = factory.updateOne(Booking);
const deleteBooking = factory.deleteOne(Booking);


module.exports = { 
    getCheckoutSession: getCheckoutSession,
    createBookingCheckout: createBookingCheckout,
    getAllBooking: getAllBooking,
    getBooking: getBooking,
    updateBooking: updateBooking,
    deleteBooking: deleteBooking,
    createBooking: createBooking
};