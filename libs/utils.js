const fs = require('fs');

function openJS(path){
    let rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata)
}

function writeJS(path, cosa){
    let data = JSON.stringify(cosa);
    fs.writeFileSync(path, data);
}

module.exports = {
    openJS,
    writeJS,
};