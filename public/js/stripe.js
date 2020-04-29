import Axios from "axios";
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_oo9uJ0sIW1nh8jLmeskx9SIX00HVT0D6uw');

export const bookTour = async (tourId) => {
    try{
        // 1) Get the session from the server.
        const session = await Axios.get(`http://127.0.0.1:8000/bookings/checkout-session/${tourId}`);
        console.log(session);
        // 2) Create checkout from + charge the credit card 
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch(err){
        console.log(err);
        showAlert('error', err);
    }
    
}