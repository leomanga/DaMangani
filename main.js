const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const url = require('url');
const fs = require('fs');
const path = require('path');

const lib = require('./libs/utils')

const TryRegistration = require('./services/tryreg');
const TryLogin = require('./services/trylog');
const Game = require('./game/game');

const { hasUncaughtExceptionCaptureCallback } = require('process');
const { info } = require('console');

app.use('/img', express.static(path.join(__dirname, '/img')))
app.use('/images', express.static(path.join(__dirname, '/images')))
app.use('/fonts', express.static(path.join(__dirname, '/fonts')))
app.use('/css', express.static(path.join(__dirname, '/libs/bootstrap/css')))
app.use('/css', express.static(path.join(__dirname, '/css')))
app.use('/js', express.static(path.join(__dirname, '/js')))
app.use('/js', express.static(path.join(__dirname, '/libs/bootstrap/js')))
app.use('/js', express.static(path.join(__dirname, '/libs/jquery')))
//app.use('/js', express.static(path.join(__dirname, '/libs/')))

//let utentiOnline = [{username:'pippo', socket:''},{username:'pluto', socket:''}];
//es utentiOnline. {id:{username: ... , socket: ...}}
let utentiOnline = {}
let connessioni = {}

let games = {contatore: 0}

let idLibero = lib.openJS("idLibero.json").id;

server.listen(3000, () => {
});

//PAGINA INIZIALE
app.get('/', (req, res) => {
    res.sendFile(__dirname +'/login/login.html');
});

//LOGIN
app.get('/login.html/', (req, res) => {
    res.sendFile(__dirname +'/login/login.html');
});

//REGISTRAZIONE
app.get('/registrazione.html/', (req, res) => {
    res.sendFile(__dirname +'/registrazione/registrazione.html');
});

//LOBBY
app.get('/lobby.html/', (req, res) => {
    res.sendFile(__dirname +'/lobby/lobby.html');
});

app.get('/game.html/', (req, res) => {
    res.sendFile(__dirname +'/game/game.html');
});

io.on('connection', (socket) => {
    console.log("Connessione");

    //EVENTI
    socket.on('testRegistrazione', (dati) => {
        let result = TryRegistration.test(dati.username, dati.password);
        if(result.isValid){
            let id = idLibero;
            aggiornaIdLibero();

            //AGGIUNGERE UTENTE A FILE
            addUser(id, dati.username, dati.password);
            result["id"] = id;
        }

        //emetto result.isValid, id, user & password problems
        socket.emit("regResult", result);
    });

    socket.on('testLogin', (dati) => {
        let result = TryLogin.test(dati.username, dati.password);
        if(result.id in utentiOnline){
            result.isValid = false;
            result.problems = "Utente già online";
        }
        //emetto result.isValid, id, user & password problems
        socket.emit("logResult", result);
    });


    socket.on('lobbyReady', (id) => {
        let dati = lib.openJS("users.json");
        
        let datiUtente = lib.openJS("users.json")[id];
        utentiOnline[id] = {username:datiUtente.username, socket:socket};
        connessioni[socket.id] = id;
        let mainUser ={
            username: datiUtente.username,
            partiteGiocate: datiUtente.partiteGiocate,
            vittorie: datiUtente.vittorie
        }
        socket.emit("mainUser", mainUser);
        inviaLobby();  
    });


    socket.on('invioSfida', (ids) => {
        let playerSocket = utentiOnline[ids.friend].socket;
        playerSocket.emit('richiestaSfida', ids.sender);
    });


    socket.on('sfidaAccettata', (ids) => {

        let socket1 = utentiOnline[ids.sender].socket;
        let socket2 = utentiOnline[ids.friend].socket;
        let idGioco = games.contatore;
        games[idGioco] = new Game.Game(ids.sender, ids.friend);
        games.contatore = idGioco + 1;
        socket1.emit("passaAlGioco",idGioco);
        socket2.emit("passaAlGioco",idGioco);

    });


    socket.on('gameReady', (info) => {
        connessioni[socket.id] = info.id;
        let dati = lib.openJS("users.json");
        let datiUtente = lib.openJS("users.json")[info.id];
        games[info.idGioco].addSocket(info.id, socket);
        let utente = {
            username : datiUtente.username,
            colore : games[info.idGioco].colori[info.id]
        }
        socket.emit("mainUser", utente);
        socket.emit("gameStatus", games[info.idGioco].status);
    });

    socket.on("resa", (id) => {
        deleteGame(id);
    })
    
    socket.on("move", (info) => {
        let partita = games[info.idGioco];
        if(partita == undefined)
            return;
        partita.move(info.startX, info.startY, info.endX, info.endY, info.id);
        inviaGameStatus(partita, info.idGioco);

    })

    socket.on('disconnect', () => {
        let id = connessioni[socket.id];
        if(id == undefined)
            return;
        if(id in utentiOnline){
            delete utentiOnline[id];
            inviaDisconnesso(id);
        }
        else{
            deleteGame(id);
        }

        delete connessioni[socket.id];
        
    });

});

function deleteGame(id){
    for(gameId in games){
        if(games[gameId].nero == id || games[gameId].bianco == id){
            games[gameId].resa(id);
            inviaGameStatus(games[gameId], gameId);
            return;
        }
    }
}


function inviaGameStatus(infoGioco, idGioco){
    let status = infoGioco.status;
    for (id in infoGioco.sockets){
        infoGioco.sockets[id].emit("gameStatus", status);
    }
    if(status.winner != null){
        for (id in infoGioco.sockets){
            endGame(status.winner, infoGioco, id);
        }
        let utenti = lib.openJS("users.json");
        utenti[status.bianco].partiteGiocate = utenti[status.bianco].partiteGiocate + 1;
        utenti[status.nero].partiteGiocate = utenti[status.nero].partiteGiocate + 1;

        utenti[status.winnerId].vittorie = utenti[status.winnerId].vittorie + 1;
        lib.writeJS("users.json", utenti);
        delete games[idGioco];
    }
}

function endGame(winner, infoGioco, id){
    infoGioco.sockets[id].emit("endGame", winner);
}


function addUser(id, username, password){
    let dati = lib.openJS("users.json");
    dati[id] = {
        username: username,
        password: password};
    lib.writeJS("users.json", dati);
}

function inviaLobby(idUtente){
    for (id in utentiOnline){
        io.emit("addUser",{username: utentiOnline[id].username,
                            id: id});
    }
}

function aggiornaIdLibero(){
    idLibero ++;
    lib.writeJS("idLibero.json", {id:idLibero});
}

function inviaDisconnesso(id){
    io.emit("deleteUser", id);
}    

function stampaUtentiOnline(){
    for(k in utentiOnline){
        console.log(utentiOnline[k].username);
    }
}
