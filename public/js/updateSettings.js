import  axios  from 'axios';
import { showAlert } from './alerts';

// updateData

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    try{

        const url = type === 'password' ? 'http://127.0.0.1:8000/api/v1/users/updatePassword' : 'http://127.0.0.1:8000/api/v1/users/updateMe'; 
        console.log(data);
        const res = await axios(url, {
            method: 'PATCH',
            data
        });

        if(res.data.status === 'success'){
            showAlert('success', `${type.toUpperCase()} Updated Successfully!`);
        }


    } catch(err){
        showAlert('error', err.reponse.data.message);
    }
    
}
