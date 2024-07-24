const utils = require('../libs/utils');
const url = require('url');
const { ifError } = require('assert');

const FILE_USERS = './users.json';


function test(username, password){
    let esito = verifica(username, password);
    /*
    console.log("esito username: "+ esitoUsername.isValid);
    console.log("esito password: "+ esitoPassword.isValid);
    */
    return {
        isValid: esito.isValid,
        problems: esito.problems,
        id :esito.id
    };
}

function verifica(username, password){
    let esito = {
        isValid : false,
        problems: "Username o password errati",
        id: "null"
    }
    let dati = utils.openJS(FILE_USERS);
    for(id in dati){
        if(dati[id].username == username && dati[id].password == password){
            esito.isValid = true;
            esito.id = id;
            return esito;
        }
    }
    return esito;
}

module.exports = {
    test
};