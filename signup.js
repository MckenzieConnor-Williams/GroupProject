let jsonData;

window.addEventListener("load", () => {
    fetch('./storage/users.json')
    .then(res => res.json())
    .then(data => jsonData = data)
    .catch(err => console.log(err));
})

const formEl = document.querySelector('#signup-form');


function checkUserExists(json, value){
    let contains = false;
    Object.keys(json).some(key => {
        contains = typeof json[key] === 'object' ? _isContains(json[key], value) : json[key] === value;
         return contains;
    });
    return contains;
}

formEl.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(formEl);
    let email = formData.get("email-signup");
    let password = formData.get('password-signup');
    let confPassword = formData.get('confirm-password');



    if(password == confPassword){
        
        if(checkUserExists(jsonData, email)){
            console.log("exists");
        }else{
            console.log("signup");
        }
        // passowrd matches confirm password - if user doesnt exist, signup
        const data = Object.fromEntries(formData);

        // add user to users.json file
        const fileData = readFileSync('storage/users.json');
        const jsonData = JSON.parse(fileData);

        jsonData.push({
            email: 'test',
            password: 'test'
        });

        writeFileSync('storage/users.json', JSON.stringify(jsonData));

        console.log(data);
    }else{
        console.log("failed");
    }
});