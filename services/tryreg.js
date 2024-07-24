const utils = require('../libs/utils');
const url = require('url');

const FILE_USERS = './users.json';

const LUNGHEZZA_PASSWORD = 4;

function test(username, password){
    let esitoUsername = verificaUsername(username);
    let esitoPassword = verificaPassword(password);
    /*
    console.log("esito username: "+ esitoUsername.isValid);
    console.log("esito password: "+ esitoPassword.isValid);
    */
    isValid = esitoUsername.isValid && esitoPassword.isValid;
    user_problems = esitoUsername.problems;
    pass_problems = esitoPassword.problems;


    return {
        isValid: isValid,
        user_problems: user_problems,
        pass_problems: pass_problems
    };
}

function verificaUsername(username){
    let esito = {
        isValid : true,
        problems: ""
    }
    let dati = utils.openJS(FILE_USERS);

    for (key in dati)
        if (dati[key].username == username){
            esito.isValid = false;
            esito.problems = "Username già in uso\n";
            return esito;
        }
    return esito;
}

function verificaPassword(password){
    let esito = {
        isValid : true,
        problems : ""
    }
    if(!lunghezzaGiusta(password)){
        esito.isValid = false;
        esito.problems = "La password deve essere lunga almeno 5 caratteri\n";
        return esito;
    }
    return esito;

}

function lunghezzaGiusta(password){
    console.log(password);
    return LUNGHEZZA_PASSWORD <= password.length;
}

module.exports = {
    test
};