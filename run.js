const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const {Property, Tax, Jail, Parc} = require("./classes.js")
const plateau = require("./plateau.js")
const communityCards = require("./communityCards.js")
const chance = require("./chance.js");

let playerList = new Array()
let activePlayerId = 0

function Player(socket, name, num) {
    this.socket = socket
    this.name = name
    this.money = 1500
    this.deck = new Array()
    this.lastScore = new Array(0, 0)
    this.hasRolledDices = false
    this.numberOfDoubles = 0
    this.idCase = 0
    this.nbFreePrisonCards = 0
    this.currentAction = null

    playerList.splice(num, 0, this)

    console.log(playerList)
}

Player.prototype.getPlayerById = function(id) {
    return playerList[id]
}

Player.prototype.getPlayerBySocket = function(socket) {
    let playerRet
    playerList.forEach(player => {
        if(player.socket === socket) {
            playerRet = player
        }
    });

    return playerRet
}

Player.prototype.setName = function(name) {
    this.name = name
}

Player.prototype.rollDices = function() {
    this.lastScore[0] = Math.floor(Math.random() * 6) +1
    this.lastScore[1] = Math.floor(Math.random() * 6) +1
    io.emit("resultRollDice", this.lastScore)

    if(this.lastScore[0] == this.lastScore[1]) {
        this.numberOfDoubles += 1
    }

    if(this.numberOfDoubles == 3) {
        io.emit("tooManyDoubles")
        Jail.prototype.sendToJail(this)
        if(this.caseId < Jail.prototype.getJailId()) {
            io.emit("sendToJail", Player.prototype.getActivePlayer(), Jail.prototype.getJailId(), false)
        } else {
            io.emit("sendToJail", Player.prototype.getActivePlayer(), Jail.prototype.getJailId(), true)
        }
    } else {
        this.goTo(this.idCase + this.lastScore[0] + this.lastScore[1])
        this.actionCase(plateau[this.idCase])
    }

    this.hasRolledDices = true
}

Player.prototype.getTotalLastScore = function() {
    return this.lastScore[0] + this.lastScore[1]
}

Player.prototype.buy = function(property, state) {
    console.log("buy")
    switch(state) {
        case 0: //player is on the property
            console.log("buy0")
            if(property.owner === null && property.locator == this) {
                this.currentAction = {"function": "buy", "params": [property, 0]}
                if(this.money >= property.cost) {
                    io.emit("buy", plateau.indexOf(property))
                } else {
                    io.emit("notEnoughToBuy", plateau.indexOf(property))
                }
            } else {
                console.log("ERROR : player cannot buy this property", this, property)
            }
            break
        case 1: //player want to buy it
            console.log("buy1")
            if(property.owner === null && property.locator == this) {
                this.pay(property.cost)
                this.deck.push(property)
                property.owner = this
                io.emit("changeOwner", activePlayerId, plateau.indexOf(property))

                if(this.currentAction != null && this.currentAction.function == "buy") {
                    this.currentAction = null
                }
            }

    }
}

Player.prototype.pay = function(amount) {
    if(amount <= this.money) {
        this.money -= amount
        io.emit("pay", playerList.indexOf(this), amount)
    } else {
        console.error(`Player.pay : Pas assez d'argent pour ${this.name}`)
    }
}

Player.prototype.earn = function(amount) {
    this.money += amount
    io.emit("earn", playerList.indexOf(this), amount)
}

Player.prototype.goTo = function(idCaseDest) {
    console.log("goto", this, idCaseDest)
    if(idCaseDest < 0) {
        idCaseDest += plateau.length
    } else if(idCaseDest >= plateau.length) {
        idCaseDest -= plateau.length
    } 
    
    if(idCaseDest <= this.idCase) {
        this.earn(200)
    } 

    this.idCase = idCaseDest
    plateau[idCaseDest].locator = this
    io.emit("movePlayer", playerList.indexOf(this), idCaseDest, false)
}

Player.prototype.actionCase = function(caseDest) {
    console.log("actionCase", this, caseDest)
    console.log("0")
    if(this == caseDest.locator) {
        switch(caseDest.type) {
            case "property":
                console.log("1")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                    caseDest.owner.earn(rent)
                }
                break
            case "station":
                console.log("2")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                    caseDest.owner.earn(rent)
                }

                break
            case "company":
                console.log("3")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                    caseDest.owner.earn(rent)
                }
                break
            case "start":
                console.log("4")
                this.earn(200)
                break
            case "tax":
                console.log("5")
                this.pay(caseDest.getRent())
                plateau[Parc.prototype.getParcId()].incrementParcBalance(caseDest.getRent())
                break
            case "chance":
                console.log("6")
                let randChance = Math.floor(Math.random() * chance.length)
    
                io.emit("chance", chance[randChance].description())
                let retChance = chance[randChance].action(this)
                if(retChance != undefined) {
                    switch(retChance) {
                        case "gotojail":
                            if(this.idCase < Jail.prototype.getJailId()) {
                                io.emit("sendToJail", this.getActivePlayer(), Jail.prototype.getJailId(), false)
                            } else {
                                io.emit("sendToJail", this.getActivePlayer(), Jail.prototype.getJailId(), true)
                            }
                            break
                    }
                }
                break
            case "community":
                console.log("7")
                let randCommunity = Math.floor(Math.random() * communityCards.length)
    
                io.emit("community", communityCards[randCommunity].description)
                let retCommunity = communityCards[randCommunity].action(this)

                if(retCommunity != undefined) {
                    switch(retCommunity) {
                        case "gotojail":
                            if(this.idCase < Jail.prototype.getJailId()) {
                                io.emit("sendToJail", this.getActivePlayer(), Jail.prototype.getJailId(), true)
                            } else {
                                io.emit("sendToJail", this.getActivePlayer(), Jail.prototype.getJailId(), false)
                            }
                            break
                        case "start":
                            io.emit("movePlayer", this.getActivePlayer(), 0, false)
                    }
                }
                break
            case "gotojail":
                console.log("8")
                Jail.prototype.sendToJail(this)
                io.emit("sendToJail", this.getActivePlayer(), Jail.prototype.getJailId(), true)
                break
            case "parc":
                console.log("9")
                caseDest.transferParcBalance(this)
                break
        }
    
    } else {
        console.log("ERROR : locator is null")
    }
}

// renvoie le couple (nbPossédé, totalCouleur)
Player.prototype.colorGroup = function(color) {
    let totalCouleur = 0
    let nbPossede = 0
    plateau.forEach(element => {
        if(element.type == color || element.color == color) {
            totalCouleur++

            if(element.owner == this) {
                nbPossede++
            }
        }
    });

    return Array(nbPossede, totalCouleur)
}

Player.prototype.getPlayerList = function() {return playerList}
Player.prototype.getActivePlayer = function() {return activePlayerId}
Player.prototype.getDisconnectedPlayerIdList = function() {
    let disconnectedPlayerList = Array()

    playerList.forEach(player => {
        if(player.socket === null) {
            disconnectedPlayerList.push(playerList.indexOf(player))
        }
    });

    return disconnectedPlayerList
}
Player.prototype.getClientPlayerList = function() {
    let clientPlayerList = Array()
    playerList.forEach(player => {
        clientPlayerList.push({
            "id": playerList.indexOf(player),
            "pseudo": player.name,
            "pos": player.idCase,
            "balance": player.money
        })
    })

    return clientPlayerList
}
Player.prototype.nextActivePlayer = function() {
    if(activePlayerId < playerList.length-1) {
        activePlayerId++
    } else {
        activePlayerId = 0
    }
}


/*
function getPropertyByIdCase(id) {
    let res
    let i = 0
    while(id != plateau.case) {
        i++
    }

    return i
}
*/



const requestListener = function (req, res) {
    // console.log(req.url)
    // console.log(req.rawHeaders.slice(0,4))
    let fileContent;
    if(req.url == "/") {
        res.writeHead(301, {
            Location: "./index.html"
          }).end();
    } else {
        try {
            const data = fs.readFileSync(__dirname + "/site/" + req.url);
            fileContent = data;
    
            switch(req.url.split(".")[1]) {
                case "html":
                    res.setHeader("Content-Type", "text/html");
                    break;
                case "css":
                    res.setHeader("Content-Type", "text/css");
                    break;
                case "js":
                    res.setHeader("Content-Type", " application/javascript");
                    break;
                case "png":
                    res.setHeader("Content-Type", " image/png");
                    break;
                case "jpg":
                    res.setHeader("Content-Type", " image/jpeg");
                    break;
                case "json":
                    res.setHeader("Content-Type", "application/json");
                    break;
                default:
                    res.setHeader("Content-Type", "text/plain");
            }
    
            res.writeHead(200);
            res.end(fileContent);
        } catch(err) {
            console.log(err);
            res.setHeader("Content-Type", "text/html");
            res.writeHead(404);
            res.end("Page not found");
        }
    }
}





const server = http.createServer(requestListener);
const io = new Server(server)


server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

io.on("connection", (socket) => {
    let playerList = Player.prototype.getPlayerList()
    let isDisconnectedPlayer = false
    console.log("user connected : " + socket.id)
    
    socket.emit("clientPlayerList", Player.prototype.getClientPlayerList()) //envoyer la liste des joueurs au client

    for(let i = 0 ; i < playerList.length ; i++) { //pour chaque joueur dans la liste
        if(playerList[i].socket === null) { //vérifier s'il est déconnecter
            isDisconnectedPlayer = true
        }

        playerList[i].deck.forEach(property => { //envoyer a tout le monde ses propriétés
            io.emit("changeOwner", i, plateau.indexOf(property))
        })
    }   

    if(isDisconnectedPlayer) { //Si un joueur s'est déconnecté
        socket.emit("playerIsDisconnected", Player.prototype.getDisconnectedPlayerIdList())
    } 
    else if(playerList.length < 4 ) { //Si la liste n'est pas pleine
        socket.emit("askPseudo") //Demander pseudo au client
    } else {
        socket.emit("numPlayer", -1) //sinon donner le n° de joueur -1
    }
    
    socket.on("numDisconnectedPlayer", function(num) { //le client dit quel joueur déconnecté il est, ou un nouveau
        let activePlayer = playerList[Player.prototype.getActivePlayer()] 
        console.log("numDisconnectedPlayer : " + num)
        if(num == -1) {
            if(playerList.length < 4) {
                socket.emit("numPlayer", playerList.length) //envoyer le numero de joueur
                socket.emit("askPseudo") //Demander pseudo au client
            } else {
                socket.emit("numPlayer", -1) //sinon -1
            }
        } else {
            if(playerList[num].socket === null) {
                socket.emit("numPlayer", num) //envoyer le numéro du joueur deja existant
                playerList[num].socket = socket.id //enregistrer l'id de la connection dans le joueur
            } else {
                socket.emit("numPlayer", -1) //sinon -1
            }
        }

        if(Player.prototype.getActivePlayer() < playerList.length) {
            socket.emit("activePlayer", Player.prototype.getActivePlayer(), playerList[Player.prototype.getActivePlayer()].hasRolledDices)
        } else {
            socket.emit("activePlayer", Player.prototype.getActivePlayer(), false)
        }
        
        playerList.forEach(element => {
            if(element.socket !== null && element.name !== null) {
                io.to(element.socket).emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
            }
        });

        if(activePlayer.currentAction != null) {
            console.log("currentAction :")
            switch(activePlayer.currentAction.function) {
                case "buy":
                    console.log("buy")
                    activePlayer.buy(activePlayer.currentAction.params[0], activePlayer.currentAction.params[1])
                    break
            }
        }
    })

    socket.on("disconnect", function() {
        console.log("user disconnected : ")
        for(let i = 0 ; i < playerList.length ; i++) {
            if(playerList[i].socket !== null && playerList[i].socket == socket.id) {
                console.log(socket.id + " - " + playerList[i].name)
                playerList[i].socket = null //on supprime juste la connexion du joueur
            }
        }

        //on envoie aux autres joueurs la liste des joueurs
        playerList.forEach(element => {
            if(element.socket !== null && element.name !== null) {
                io.to(element.socket).emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
            }
        });
    })

    socket.on("pseudo", function(pseudo) {
        console.log("pseudo received : " + pseudo)
        let numPlayer = playerList.length
        let _ = new Player(socket.id, pseudo, numPlayer)
        socket.emit("numPlayer", numPlayer)
        io.emit("broadcastPseudo", numPlayer, pseudo)
        io.emit("clientPlayerList", Player.prototype.getClientPlayerList())

        if(Player.prototype.getActivePlayer() < playerList.length) {
            socket.emit("activePlayer", Player.prototype.getActivePlayer(), playerList[Player.prototype.getActivePlayer()].hasRolledDices)
        } else {
            socket.emit("activePlayer", Player.prototype.getActivePlayer(), false)
        }

        playerList.forEach(element => {
            if(element.socket !== null && element.name !== null) {
                io.to(element.socket).emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
            }
        });
    })

    socket.on("rollDices", function() {
        let activePlayer = playerList[Player.prototype.getActivePlayer()]
        console.log("roolDices : " + activePlayer.name)
        if(socket.id == activePlayer.socket) {
            activePlayer.rollDices()
        }
    })

    socket.on("confirmBuying", function(idPlayer, idProperty) {
        console.log("confirmBuying : ", playerList[idPlayer], plateau[idProperty])
        playerList[idPlayer].buy(plateau[idProperty], 1)
    })

    socket.on("endTurn", function() {
        console.log("endTurn")
        playerList[Player.prototype.getActivePlayer()].numberOfDoubles = 0
        Player.prototype.nextActivePlayer()
        io.emit("activePlayer", Player.prototype.getActivePlayer(), false)
    })



    socket.on("testChance", function() {
        console.log("testChance")
        let activePlayer = playerList[Player.prototype.getActivePlayer()]
        activePlayer.goTo(2)
        activePlayer.actionCase(plateau[2])
    })
})

module.exports = Player