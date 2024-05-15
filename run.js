const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const {Property, Tax, Jail, Parc} = require("./classes.js")
const plateau = require("./plateau.js")
const communityCards = require("./communityCards.js")
const chance = require("./chance.js");
const { emitKeypressEvents } = require("readline");
const { on } = require("events");

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
                if(this.money >= property.cost) {
                    this.currentAction = {"function": "buy", "params": [property, 0]}
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
                io.emit("changeOwner", activePlayerId, plateau.indexOf(property), true)

                if(this.currentAction != null && this.currentAction.function == "buy") {
                    this.currentAction = null
                }

                io.to(this.socket).emit("canBuild", this.canBuild())
                
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
    
    if(idCaseDest <= this.idCase && idCaseDest != 0) {
        this.earn(200)
    } else if(idCaseDest == 0) {
        this.earn(400)
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
                } else if(caseDest.owner != this && caseDest.nbBuilds != -1) {
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
                // this.earn(200)
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

            if(element.owner == this && element.nbBuilds != -1) {
                nbPossede++
            }
        }
    });

    return Array(nbPossede, totalCouleur)
}

Player.prototype.canBuild = function() {
    let canBuild = false
    let i = 0
    while(i < this.deck.length && !canBuild) {
        let colorPropertyRate = this.colorGroup(this.deck[i].color)
        console.log(this.deck[i].name, this.deck[i].color != "station", this.deck[i].color != "company", colorPropertyRate[0] == colorPropertyRate[1])
        canBuild = canBuild || (
            this.deck[i].color != "station" && 
            this.deck[i].color != "company" && 
            colorPropertyRate[0] == colorPropertyRate[1]
        )
        i++
    }

    return canBuild
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

Player.prototype.currentTrade = null


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
            socket.emit("changeOwner", i, plateau.indexOf(property), false)
            if(property.nbBuilds == -1) {
                socket.emit("mortgage", plateau.indexOf(property), true, false)
            } else {
                for(let j = 0 ; j < property.nbBuilds ; j++) {
                    socket.emit("addBuild", plateau.indexOf(property), true)
                }
            }
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
                socket.emit("canBuild", playerList[num].canBuild())
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
        io.emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
    })

    socket.on("pseudo", function(pseudo) {
        console.log("pseudo received : " + pseudo)
        let numPlayer = playerList.length
        let player = new Player(socket.id, pseudo, numPlayer)

        socket.emit("numPlayer", numPlayer)
        socket.emit("canBuild", player.canBuild())

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

    socket.on("clientMortgage", function(idCase, idPlayer) {
        console.log("clientMortgage", idCase, idPlayer)
        let player = Player.prototype.getPlayerById(idPlayer)
        let casePlateau = plateau[idCase]

        console.log(player.socket == socket.id, casePlateau.owner != null, casePlateau.owner.socket == socket.id)
        if(player.socket == socket.id && casePlateau.owner != null && casePlateau.owner.socket == socket.id) {
            if(casePlateau.nbBuilds == 0) {
                casePlateau.nbBuilds = -1
                player.earn(plateau[idCase].mortgage)
                io.emit("mortgage", idCase, true, true)
            } else if(casePlateau.nbBuilds == -1) {
                casePlateau.nbBuilds = 0
                player.pay(plateau[idCase].mortgage*1.1)
                io.emit("mortgage", idCase, false, true)
            }
            socket.emit("canBuild", player.canBuild())
        } else {
            socket.emit("cannotMortgage")
        }
    })

    socket.on("askBuild", function(idProperty, buildMode) {
        let property = plateau[idProperty]
        let player = Player.prototype.getPlayerBySocket(socket.id)
        let colorGroupRes = player.colorGroup(property.color)
        let canBuild = true
        let buildPrice = 0

        
        if(Player.prototype.getPlayerList().indexOf(player) == Player.prototype.getActivePlayer() 
            && colorGroupRes[0] == colorGroupRes[1]) {
    
                if(idProperty <= 10) {
                    buildPrice = 50
                } else if(idProperty <= 20) {
                    buildPrice = 100
                } else if(idProperty <= 30) {
                    buildPrice = 150
                } else {
                    buildPrice = 200
                }
                
                let i = 0
                if(buildMode == 1 && property.nbBuilds > 0) {
                    buildPrice /= 2
                    while(i < plateau.length && canBuild) {
                        console.log(plateau[i])
                        console.log(i, plateau[i].name, plateau[i].color, plateau[i].nbBuilds, property.name, property.color, property.nbBuilds)
                        // console.log(plateau[i].color == property.color, plateau[i].nbBuilds <= property.nbBuilds, plateau[i].nbBuilds >= property.nbBuilds-1)
                        if(plateau[i].color == property.color 
                            && !(plateau[i].nbBuilds >= property.nbBuilds 
                            && plateau[i].nbBuilds <= property.nbBuilds+1)) {
                                canBuild = false
                        }
                        i++
                    }
                } else if(buildMode == 0 && property.nbBuilds < 5) {
                    while(i < plateau.length && canBuild) {
                        if(plateau[i].color == property.color 
                            && !(plateau[i].nbBuilds >= property.nbBuilds 
                            && plateau[i].nbBuilds <= property.nbBuilds+1)) {
                                canBuild = false
                        }
                        i++

                    }
                } else {
                    canBuild = false
                }
        } else {
            canBuild = false
        }

        property.canBuild = canBuild
        socket.emit("answerBuild", idProperty, canBuild , buildPrice, buildMode)

    })

    socket.on("sellBuild", function(idProperty) {
        let property = plateau[idProperty]
        let player = Player.prototype.getPlayerBySocket(socket.id)
        let buildPrice = 0

        if(idProperty <= 10) {
            buildPrice = 25
        } else if(idProperty <= 20) {
            buildPrice = 50
        } else if(idProperty <= 30) {
            buildPrice = 75
        } else {
            buildPrice = 100
        }


        if(property.owner == player && property.canBuild && property.nbBuilds > 0) {
            property.nbBuilds--
            property.canBuild = false

            io.emit("removeBuild", idProperty, false)
            player.earn(buildPrice)
        }
    })

    socket.on("buyBuild", function(idProperty) {
        let property = plateau[idProperty]
        let player = Player.prototype.getPlayerBySocket(socket.id)
        let buildPrice = 0

        if(idProperty <= 10) {
            buildPrice = 50
        } else if(idProperty <= 20) {
            buildPrice = 100
        } else if(idProperty <= 30) {
            buildPrice = 150
        } else {
            buildPrice = 200
        }

        if(property.owner == player && property.canBuild && property.nbBuilds < 5) {
            property.nbBuilds++
            property.canBuild = false

            io.emit("addBuild", idProperty, false)
            player.pay(buildPrice)
        }
    })

    socket.on("offerTrade", function(trade) {
        console.log("offerTrade", trade)

        let playerList = Player.prototype.getPlayerList()
        let otherPlayerId = trade.other.id
        let initPlayerId = trade.init.id
        let initPlayer = Player.prototype.getPlayerById(initPlayerId)
        let otherPlayer = Player.prototype.getPlayerById(otherPlayerId)
        let isMoneyValid = otherPlayer.money >= trade.other.money && trade.other.money >= 0
            && initPlayer.money >= trade.init.money && trade.init.money >= 0
        let isInitPlayerPossessionsValid = true
        let isOtherPlayerPossessionsValid = true

        for(let i = 0 ; i < trade.init.properties.length && isInitPlayerPossessionsValid ; i++) {
            let prop = trade.init.properties[i]
            isInitPlayerPossessionsValid = plateau[prop].owner == initPlayer
        }
        for(let i = 0 ; i < trade.other.properties.length && isOtherPlayerPossessionsValid ; i++) {
            let prop = trade.other.properties[i]
            isOtherPlayerPossessionsValid = plateau[prop].owner == otherPlayer
        }

        if(isMoneyValid && isInitPlayerPossessionsValid && isOtherPlayerPossessionsValid) {
            Player.prototype.currentTrade = trade
            for(let i = 0 ; i < playerList.length ; i++) {
                if(i == otherPlayerId) {
                    io.to(playerList[i].socket).emit("trade", trade, initPlayerId, otherPlayerId, true)
                } else {
                    io.to(playerList[i].socket).emit("trade", trade, initPlayerId, otherPlayerId, false)
                }
            }
        }
        
    })
    
    socket.on("acceptTrade", function(idPlayer) {
        console.log("acceptTrade1", idPlayer)
        let trade = Player.prototype.currentTrade
        let initPlayer = Player.prototype.getPlayerById(trade.init.id)
        let otherPlayer = Player.prototype.getPlayerById(trade.other.id)

        if(idPlayer == trade.other.id) {
            io.emit("tradeAccepted", trade.init.id, trade.other.id)

            if(trade.init.money > trade.other.money) {
                initPlayer.pay(trade.init.money - trade.other.money)
                otherPlayer.earn(trade.init.money - trade.other.money)
            } else {
                initPlayer.earn(trade.init.money - trade.other.money)
                otherPlayer.pay(trade.init.money - trade.other.money)
            }

            trade.init.properties.forEach(i => {
                plateau[i].owner = otherPlayer
                io.emit("changeOwner", otherPlayer, i, true)
            });

            trade.other.properties.forEach(i => {
                plateau[i].owner = initPlayer
                io.emit("changeOwner", initPlayer, i, true)
            })
        }
    })
    
})

module.exports = Player