export const hideAlert = () => {
    const el = document.querySelector('alert');
    if(el) el.parentElement.removeChild(el);
}


export const showAlert = (type, message) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    console.log(markup);
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert, '5000');
}

