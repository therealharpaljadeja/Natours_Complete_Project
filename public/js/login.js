import axios  from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    axios.post('http://127.0.0.1:8000/api/v1/users/login',{
        email: email,
        password: password
    }).then(response => {
        console.log(response);
        if(response.data.status == 'success'){
            showAlert('success', 'Logged In Successfully!');
            window.setTimeout(() => {
                location.assign('/')
            }, '1500');
        }
    }).catch(error => {
        console.log(error);
        showAlert('error', error.response.data.message);
    });

}

export const logout = async () => {
    try{
        const res = await axios({
            method: 'get',
            url: 'http://127.0.0.1:8000/api/v1/users/logout'
        });
        if(res.data.status == 'success') {
            location.reload(true);
        }
    } catch(err) {
        console.log(err);
        showAlert('error', 'Error Logging Out! Try Again');
    }
}



