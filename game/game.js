
class Pedina{
    constructor(colore, posX, posY){
        this.colore = colore;
        this.isRegina = false;
        this.posX = posX;
        this.posY = posY;
    }

    set aggRegina(come){
        this.isRegina = come;
    }

    move(endX, endY){
        this.posX = endX;
        this.posY = endY;
        if(this.posY == 0 || this.posY == 7)
            this.isRegina = true;
        return true;
    }

    tryMove(endX, endY){
        if(this.#tornatoIndietro(endY) == true && this.isRegina == false){
            return false;
        }
        return true;
        
    }
    #tornatoIndietro = function(endY){
        if(this.colore == "bianco")
            return endY < this.posY;
        return endY > this.posY;
    }
};

class Game{
    constructor(idBianco, idNero) {
        this.bianco = idBianco;
        this.nero = idNero;
        this.sockets = {};
        this.nBianche = 12;
        this.nNere = 12;
        this.turno = idBianco;
        this.colori = {};
        this.colori[this.bianco] = "bianco";
        this.colori[this.nero] = "nero";
        this.winner = null;
        
        this.gameStatus = [
            [new Pedina("bianco",0,0),"", new Pedina("bianco",2,0),"", new Pedina("bianco",4,0),"", new Pedina("bianco",6,0), ""],
            ["", new Pedina("bianco",1,1),"", new Pedina("bianco",3,1),"", new Pedina("bianco",5,1),"", new Pedina("bianco",7,1)],
            [new Pedina("bianco",0,2),"", new Pedina("bianco",2,2),"", new Pedina("bianco",4,2),"", new Pedina("bianco",6,2), ""],
            [       "",         "X",      "",         "X",         "",         "X",         "",      "X"    ], 
            [       "X",         "",      "X",         "",         "X",         "",         "X",      ""    ], 
            ["",    new Pedina("nero",1,5),  "",    new Pedina("nero",3,5),"", new Pedina("nero",5,5),"", new Pedina("nero",7,5)],
            [   new Pedina("nero",0,6),  "",    new Pedina("nero",2,6),"", new Pedina("nero",4,6),"", new Pedina("nero",6,6), ""], 
            ["",    new Pedina("nero",1,7),  "",    new Pedina("nero",3,7),"", new Pedina("nero",5,7),"", new Pedina("nero",7,7)]
    ]
    }

    get status(){
        let map = [];
        for(let i = 0; i< this.gameStatus.length; i++){
            map.push([]);
            for(let j = 0; j < this.gameStatus[i].length; j++){
                if(this.gameStatus[i][j] == "")
                    map[i].push({   
                            pedina:"null",
                            isRegina:"null",
                            casella:"bianca"});
                else if(this.gameStatus[i][j] == "X")
                    map[i].push({
                        pedina:"null",
                        isRegina:"null",
                        casella: "nera"});
                else if(this.gameStatus[i][j].colore == "bianco")
                    map[i].push({
                        pedina:"p-bianca",
                        isRegina:this.gameStatus[i][j].isRegina,
                        casella: "nera"});
                else if(this.gameStatus[i][j].colore == "nero")
                    map[i].push({
                        pedina:"p-nera",
                        isRegina: this.gameStatus[i][j].isRegina,
                        casella: "nera"});
                if(j == 0)
                    map[i][j].vicino = "null";
                map[i][j].numero = i*8 + j;
                map[i][j].x = j;
                map[i][j].y = i;
            }
        }
        return {
            map: map,
            turno: this.colori[this.turno],
            nBianche: this.nBianche,
            nNere: this.nNere,
            winner : this.colori[this.winner],
            winnerId : this.winner,
            bianco: this.bianco,
            nero: this.nero}
    }

    addSocket(id, socket){
        this.sockets[id] = socket;
    }

    resa(id){
        if(id == this.bianco){
            this.winner = this.nero;
        }
        else if (id == this.nero){
            this.winner = this.bianco;
        }
    }

    move(startX, startY, endX, endY, id){
        let infoMossa = this.#tryMove(startX, startY, endX, endY, id);
        if(infoMossa.esito == false)
            return false;

        this.#moveObj(startX, startY, endX, endY);
        let pedina = this.#getObjByCoord(endX, endY);
        pedina.move(endX, endY);
        if(infoMossa.mangiato){
            this.#deleteObjByCoord(
                        this.#puntoDiMezzo(startX, endX), 
                        this.#puntoDiMezzo(startY, endY))
            if(this.#possoMangiareAncora(endX, endY, id))
                return true;
        }
        this.#cambiaTurno()
        if(this.nBianche == 0)
            this.winner = this.nero;
        if(this.nNere == 0)
            this.winner = this.bianco;
    }

    
    #tryMove = function(startX, startY, endX, endY, id){
        let infoMossa = {
            esito: false,
            mangiato: false
        };
        if(id != this.turno){
            return infoMossa;
        }
        let pedina = this.#getObjByCoord(startX, startY);
        
        if(pedina.colore != this.colori[id]){
            return infoMossa;
        }
        if(typeof pedina == "string"){
            return infoMossa;
        }
        if(pedina.tryMove(endX, endY) == false)
            return infoMossa;
        if(this.#coordinateErrate(startX, startY, endX, endY)){
            return infoMossa;
        }    
        infoMossa = this.#mossaImpossibile(startX, startY, endX, endY);
        if(!infoMossa.esito){
            return infoMossa;
        }
        return infoMossa;


    }

    #possoMangiareAncora = function(x, y, id){
        //PROVO I 4 SPOSTAMENTI 
        let pedina = this.#getObjByCoord(x,y);
        let isRegina = pedina.isRegina;
        let colore = pedina.colore;

        let destra_basso = this.#tryMove(x,y, x - 2, y - 2, id).esito;
        let sinistra_basso = this.#tryMove(x,y, x - 2, y + 2, id).esito;
        let destra_alto = this.#tryMove(x,y, x + 2, y - 2, id).esito;
        let sinistra_alto = this.#tryMove(x,y, x + 2, y + 2, id).esito;

        let esito = (
                     destra_basso || sinistra_basso ||
                     destra_alto || sinistra_alto);
        return esito;
    }

    #riduciPedina = function(colore){
        if(colore == this.colori.bianco)
            this.nNere -= 1;
        else
            this.nBianche -= 1;
    }

    #cambiaTurno = function(){
        if(this.turno == this.bianco)
            this.turno = this.nero;
        else
            this.turno = this.bianco;
        return true;  
    }

    #coordinateErrate = function(startX, startY, endX, endY){
        return (startX < 0 || startX > 7 || startY < 0 || startY > 7 ) || 
               (endX < 0 || endX > 7 || endY < 0 || endY > 7)
    }

    #mossaImpossibile = function(startX, startY, endX, endY){
        let info = {
            esito: false,
            mangiato: false
        };
        let casella = this.#getObjByCoord(endX, endY);
        if(casella != "X")
            return info;
        
        if(this.#distanzaFraDuePunti(startX, endX) == 1 && this.#distanzaFraDuePunti(startY, endY) == 1){
            info.esito = true;
            return info;
        }
        let infoMangiare = this.#hoMangiato(startX, startY, endX, endY);
        info.esito = infoMangiare.esito;
        
        info.mangiato = infoMangiare.mangiato;

        return info; 
    }

    #hoMangiato = function(startX, startY, endX, endY){
        let info = {
            esito: false,
            mangiato: false,
        };
        if(this.#distanzaFraDuePunti(startX, endX) != 2 || this.#distanzaFraDuePunti(startY, endY) != 2)
            return info;
        
        let pedinaCheMangia = this.#getObjByCoord(startX, startY);

        let xPedinaDaMangiare = this.#puntoDiMezzo(startX, endX);
        let yPedinaDaMangiare = this.#puntoDiMezzo(startY, endY);
        let pedinaDaMangiare = this.#getObjByCoord(xPedinaDaMangiare, yPedinaDaMangiare);
        let sonoDifferenti = this.#sonoPedineDifferenti(pedinaCheMangia, pedinaDaMangiare);
        if(!sonoDifferenti || (pedinaDaMangiare.isRegina == true && pedinaCheMangia.isRegina == false))
            return info;
        info.esito = true;
        info.mangiato = true;
        return info;
    }

    #distanzaFraDuePunti = function(p1, p2){
        return Math.abs(p1 - p2);
    }

    #puntoDiMezzo = function(p1,p2){
        return (p1+p2) / 2;
    }

    #sonoPedineDifferenti = function(pedina1, pedina2){
        if(pedina1.colore == undefined || pedina2.colore == undefined){

            return false;
        }
        return pedina1.colore != pedina2.colore;
    }

    #moveObj = function(startX, startY, endX, endY){
        this.gameStatus[endY][endX] = this.#getObjByCoord(startX, startY);
        this.gameStatus[startY][startX] = "X";
    }
    
    #getObjByCoord = function(x, y){
        return this.gameStatus[y][x];
    }

    #deleteObjByCoord = function(x, y){
        let pedina = this.#getObjByCoord(x,y);
        if(pedina.colore == "bianco")
            this.nBianche -= 1;
        else if(pedina.colore == "nero")
            this.nNere -= 1;
        this.gameStatus[y][x] = "X";
    }

}


module.exports = {
    Game
};
