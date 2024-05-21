const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const log = require("./log.js")
const {Property, Tax, Jail, Parc, Auction} = require("./classes.js")
const plateau = require("./plateau.js")
const communityCards = require("./communityCards.js")
const chance = require("./chance.js");

function Player(socket, name, num) {
    this.socket = socket
    this.name = name
    this.money = 100
    this.deck = new Array()
    this.lastScore = new Array(0, 0)
    this.numberOfDoubles = 0
    this.idCase = 0
    this.nbFreePrisonCards = 0
    this.isJailed = 0
    this.currentAction = null
    this.hasRolledDices = false
    this.isBankrupt = false

    Player.prototype.playerList.splice(num, 0, this)

    log(Player.prototype.playerList)
}

Player.prototype.toString = function() {
    return "Player = " + this.socket + ":" + this.name + " ; " 
        + this.money + "€ ; " + this.deck.length + " cards ; " 
        + this.lastScore[0] + " + " + this.lastScore[1] + " ; "
        + this.nbFreePrisonCards + " free prison cards ; "
        + this.isJailed + " state for jail ; "
        + "has rolled dices: " + this.hasRolledDices + " ; "
        + "is bankrupt: " + this.isBankrupt
}

Player.prototype.getPlayerById = function(id) {
    return Player.prototype.playerList[id]
}

Player.prototype.getPlayerBySocket = function(socket) {
    let playerRet = null
    Player.prototype.playerList.forEach(player => {
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

    if(this.lastScore[0] == this.lastScore[1]) {
        this.numberOfDoubles += 1
    } else {
        this.hasRolledDices = true
    }

    if(this.numberOfDoubles == 3) {
        io.emit("tooManyDoubles")
        Jail.prototype.sendToJail(this)
        if(this.caseId < Jail.prototype.getJailId()) {
            io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), false)
        } else {
            io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), true)
        }
        this.hasRolledDices = true
    } else if(this.isJailed > 0) {
        this.hasRolledDices = true
        if(this.lastScore[0] == this.lastScore[1]) {
            io.emit("freeFromJail", Player.prototype.playerList.indexOf(this), this.canBuild())
            this.isJailed = 0
            this.goTo(this.idCase + this.lastScore[0] + this.lastScore[1])
            this.actionCase(plateau[this.idCase])
        } else if(this.isJailed == 1) {
            this.pay(50)
            io.emit("freeFromJail", Player.prototype.playerList.indexOf(this), this.canBuild())
        }
        this.isJailed--
    } else {
        this.goTo(this.idCase + this.lastScore[0] + this.lastScore[1])
        this.actionCase(plateau[this.idCase])
    }

    io.emit("resultRollDice", this.lastScore, !this.hasRolledDices)
}

Player.prototype.getTotalLastScore = function() {
    return this.lastScore[0] + this.lastScore[1]
}

Player.prototype.buy = function(property, state) {
    log("buy")
    switch(state) {
        case 0: //player is on the property
            log("buy0")
            if(property.owner === null && property.locator == this) {
                if(this.money >= property.cost) {
                    this.currentAction = {"function": "buy", "params": [property, 0]}
                    io.emit("buy", plateau.indexOf(property))
                } else {
                    let auction = new Auction(property)
                    awaitAuctionEnd(auction)
                    io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))
                }
            } else {
                this.buy(property, 2)
            }
            break
        case 1: //player want to buy it
            log("buy1")
            if(property.owner === null && property.locator == this) {
                this.pay(property.cost).then(() => {
                    this.deck.push(property)
                    property.owner = this
                    io.emit("changeOwner", Player.prototype.activePlayer, plateau.indexOf(property), true)

                    if(this.currentAction != null && this.currentAction.function == "buy") {
                        this.currentAction = null
                    }

                    io.to(this.socket).emit("canBuild", this.canBuild())
                }).catch(() => {
                    let auction = new Auction(property)
                    awaitAuctionEnd(auction)
                    io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))
                })
                
                
            }
            break
        case 2:
            let auction = new Auction(property)
            awaitAuctionEnd(auction)
            io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))

    }
}

Player.prototype.pay = async function(amount) {
    let result = 0
    if(amount <= this.money) {
        this.money -= amount
        io.emit("pay", Player.prototype.playerList.indexOf(this), amount)
        result = 1
    } else if(this.getAssets() >= amount) {
        this.currentAction = {"function": "gatherMoney", "params": [amount]}
        io.to(this.socket).emit("gatherMoney", amount)
        await this.gatherMoney(amount)
        result = 1
    }
    return new Promise((success, fail) => {
        if(result == 1) {
            success()
        } else {
            fail()
        }
    })
}

Player.prototype.earn = function(amount) {
    this.money += amount
    io.emit("earn", Player.prototype.playerList.indexOf(this), amount)
}

Player.prototype.getAssets = function() {
    let assets = this.money

    this.deck.forEach(prop => {
        let idProperty = plateau.indexOf(prop)

        if(idProperty <= 10) {
            buildPrice = 25
        } else if(idProperty <= 20) {
            buildPrice = 50
        } else if(idProperty <= 30) {
            buildPrice = 75
        } else {
            buildPrice = 100
        }

        if(prop.nbBuilds > 0) {
            assets += buildPrice* prop.nbBuilds
        } else if(prop.nbBuilds > -1) {
            assets += prop.mortgage
        }
    })

    return assets
}

Player.prototype.gatherMoney =  function(amount) {
    return new Promise(() => {
        let currentMoney = this.money
        while(currentMoney < amount) {
            currentMoney = this.money
        }

        log("money gathered")
    })
}

Player.prototype.goTo = function(idCaseDest) {
    log("goto", this, idCaseDest)
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
    io.emit("movePlayer", Player.prototype.playerList.indexOf(this), idCaseDest, false)
}

Player.prototype.actionCase = function(caseDest) {
    log("actionCase", this, caseDest)
    log("0")
    if(this == caseDest.locator) {
        switch(caseDest.type) {
            case "property":
                log("1")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this && caseDest.nbBuilds != -1) {
                    let rent = caseDest.getRent()
                    this.pay(rent).then(() => {
                        caseDest.owner.earn(rent)
                    }).catch(this.bankrupcy)
                }
                break
            case "station":
                log("2")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent).then(() => {
                        caseDest.owner.earn(rent)
                    }).catch(this.bankrupcy)
                }

                break
            case "company":
                log("3")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent).then(() => {
                        caseDest.owner.earn(rent)
                    }).catch(this.bankrupcy)
                }
                break
            case "start":
                log("4")
                // this.earn(200)
                break
            case "tax":
                log("5")
                this.pay(caseDest.getRent()).then(() => {
                    plateau[Parc.prototype.getParcId()].incrementParcBalance(caseDest.getRent())
                }).catch(this.bankrupcy)
                break
            case "chance":
                log("6")
                let randChance = Math.floor(Math.random() * chance.length)
    
                log(chance[randChance].description())
                io.emit("chance", chance[randChance].description())
                let retChance = chance[randChance].action(this)
                if(retChance != undefined) {
                    switch(retChance) {
                        case "gotojail":
                            if(this.idCase < Jail.prototype.getJailId()) {
                                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), false)
                            } else {
                                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), true)
                            }
                            break
                    }
                }
                break
            case "community":
                log("7")
                let randCommunity = Math.floor(Math.random() * communityCards.length)
    
                log(communityCards[randCommunity].description)
                io.emit("community", communityCards[randCommunity].description)
                let retCommunity = communityCards[randCommunity].action(this)

                if(retCommunity != undefined) {
                    switch(retCommunity) {
                        case "gotojail":
                            if(this.idCase < Jail.prototype.getJailId()) {
                                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), true)
                            } else {
                                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), false)
                            }
                            break
                        case "start":
                            io.emit("movePlayer", Player.prototype.activePlayer, 0, false)
                            break
                        case "addNbFreePrisonCard":
                            io.emit("updateFreePrisonCards",  Player.prototype.activePlayer, this.nbFreePrisonCards)
                    }
                }
                break
            case "gotojail":
                log("8")
                Jail.prototype.sendToJail(this)
                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), true)
                break
            case "parc":
                log("9")
                caseDest.transferParcBalance(this)
                break
        }
    
    } else {
        log("ERROR : locator is null")
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
        log(this.deck[i].name, this.deck[i].color != "station", this.deck[i].color != "company", colorPropertyRate[0] == colorPropertyRate[1])
        canBuild = canBuild || (
            this.deck[i].color != "station" && 
            this.deck[i].color != "company" && 
            colorPropertyRate[0] == colorPropertyRate[1]
        )
        i++
    }

    return canBuild
}


Player.prototype.getDisconnectedPlayerIdList = function() {
    let disconnectedPlayerList = Array()

    Player.prototype.playerList.forEach(player => {
        if(player.socket === null) {
            disconnectedPlayerList.push(Player.prototype.playerList.indexOf(player))
        }
    });

    return disconnectedPlayerList
}
Player.prototype.getClientPlayerList = function() {
    let clientPlayerList = Array()
    Player.prototype.playerList.forEach(player => {
        clientPlayerList.push({
            "id": Player.prototype.playerList.indexOf(player),
            "pseudo": player.name,
            "pos": player.idCase,
            "balance": player.money,
            "nbFreePrisonCards": player.nbFreePrisonCards,
            "isJailed": player.isJailed
        })
    })

    return clientPlayerList
}
Player.prototype.nextActivePlayer = function() {
    if(Player.prototype.activePlayer < Player.prototype.playerList.length-1) {
        Player.prototype.activePlayer++
    } else {
        Player.prototype.activePlayer = 0
    }
}

Player.prototype.bankrupcy = function() {
    io.send("bankrupcy", Player.prototype.playerList.indexOf(this))
    this.isBankrupt = true

    let nbBankrupcy = 0
    Player.prototype.playerList.forEach(player => {
        if(player.isBankrupt) {
            nbBankrupcy++
        }
    })

    if(nbBankrupcy == Player.prototype.playerList.length - 1) {
        io.send("gameOver")
        io.close()
    }
}

Player.prototype.currentTrade = null
Player.prototype.playerList = new Array()
Player.prototype.activePlayer = 0

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


async function awaitAuctionEnd(auction) {
    log("start timer")
    auction.timer().then(() => {
        log("end of timer")
    
        if(auction.lastPlayer != null) {
            auction.lastPlayer.pay(auction.bid).then(() => {
                auction.property.owner = auction.lastPlayer
            
                io.emit("endAuction", Player.prototype.playerList.indexOf(auction.lastPlayer), plateau.indexOf(auction.property), auction.bid)
                io.emit("changeOwner", Player.prototype.playerList.indexOf(auction.lastPlayer), plateau.indexOf(auction.property), true)
            }).catch(auction.lastPlayer.bankrupcy)
        } else {
            io.emit("endAuction", null, plateau.indexOf(auction.property), 0)
        }
    
        Auction.prototype.currentAuction = null
    })
}



const requestListener = function (req, res) {
    // log(req.url)
    // log(req.rawHeaders.slice(0,4))
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
            log(err);
            res.setHeader("Content-Type", "text/html");
            res.writeHead(404);
            res.end("Page not found");
        }
    }
}





const server = http.createServer(requestListener);
const io = new Server(server)


server.listen(port, host, () => {
    log(`Server is running on http://${host}:${port}`);
});

io.on("connection", (socket) => {
    let playerList = Player.prototype.playerList
    let isDisconnectedPlayer = false
    log("user connected : " + socket.id)
    
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
        let activePlayerId = Player.prototype.activePlayer
        let activePlayer = playerList[activePlayerId] 
        log("numDisconnectedPlayer : " + num)
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

        if(activePlayerId < playerList.length) {
            socket.emit("activePlayer", activePlayerId, activePlayer.hasRolledDices, activePlayer.isJailed)
        } else {
            socket.emit("activePlayer", activePlayerId, false, activePlayer.isJailed)
        }
        
        playerList.forEach(element => {
            if(element.socket !== null && element.name !== null) {
                io.to(element.socket).emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
            }
        });

        if(activePlayer.currentAction != null) {
            log("currentAction :")
            switch(activePlayer.currentAction.function) {
                case "buy":
                    log("buy")
                    activePlayer.buy(activePlayer.currentAction.params[0], activePlayer.currentAction.params[1])
                    break
            }
        }

        let trade = Player.prototype.currentTrade
        if(trade != null) {
            socket.emit("trade", trade)
        }
    })

    socket.on("disconnect", function() {
        log("user disconnected : ")
        let player = Player.prototype.getPlayerBySocket(socket.id)
        if(player !== null) {
            player.socket = null

            //on envoie aux autres joueurs la liste des joueurs
            io.emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
        }

    })

    socket.on("pseudo", function(pseudo) {
        log("pseudo received : " + pseudo)
        let numPlayer = playerList.length
        let player = new Player(socket.id, pseudo, numPlayer)

        socket.emit("numPlayer", numPlayer)
        socket.emit("canBuild", player.canBuild())

        io.emit("broadcastPseudo", numPlayer, pseudo)
        io.emit("clientPlayerList", Player.prototype.getClientPlayerList())

        if(Player.prototype.activePlayer < Player.prototype.playerList.length) {
            socket.emit("activePlayer", Player.prototype.activePlayer,
                playerList[Player.prototype.activePlayer].hasRolledDices,
                playerList[Player.prototype.activePlayer].isJailed
            )
        } else {
            socket.emit("activePlayer", Player.prototype.activePlayer, false, playerList[Player.prototype.activePlayer].isJailed)
        }

        

        playerList.forEach(element => {
            if(element.socket !== null && element.name !== null) {
                io.to(element.socket).emit("playerDisconnected", Player.prototype.getDisconnectedPlayerIdList())
            }
        });
    })

    socket.on("rollDices", function() {
        let activePlayer = playerList[Player.prototype.activePlayer]
        log("roolDices : " + activePlayer.name)
        if(socket.id == activePlayer.socket) {
            activePlayer.rollDices()
        }
    })

    socket.on("endTurn", function() {
        log("endTurn")
        playerList[Player.prototype.activePlayer].numberOfDoubles = 0
        playerList[Player.prototype.activePlayer].hasRolledDices = false
        
        Player.prototype.nextActivePlayer()
        io.emit("activePlayer", Player.prototype.activePlayer, false, playerList[Player.prototype.activePlayer].isJailed)
    })

    socket.on("confirmBuying", function(idPlayer, idProperty) {
        log("confirmBuying : ", Player.prototype.playerList[idPlayer], plateau[idProperty])
        Player.prototype.playerList[idPlayer].buy(plateau[idProperty], 1)
    })

    socket.on("denyBuying", function(idPlayer, idProperty) {
        log("denyBuying : ", Player.prototype.playerList[idPlayer], plateau[idProperty])
        Player.prototype.playerList[idPlayer].buy(plateau[idProperty], 2)
    })

    socket.on("payFreePrison", function() {
        let player = Player.prototype.getPlayerBySocket(socket.id)
        if(player.isJailed > 0) {
            player.pay(50)
            player.isJailed = 0
            io.emit("freeFromJail", Player.prototype.playerList.indexOf(player), playe.canBuild)
        }
    })

    socket.on("clientMortgage", function(idCase, idPlayer) {
        log("clientMortgage", idCase, idPlayer)
        let player = Player.prototype.getPlayerById(idPlayer)
        let casePlateau = plateau[idCase]

        log(player.socket == socket.id, casePlateau.owner != null, casePlateau.owner.socket == socket.id)
        if(player.socket == socket.id && casePlateau.owner != null && casePlateau.owner.socket == socket.id) {
            if(casePlateau.nbBuilds == 0) {
                casePlateau.nbBuilds = -1
                player.earn(plateau[idCase].mortgage)
                io.emit("mortgage", idCase, true, true)
            } else if(casePlateau.nbBuilds == -1) {
                if(player.money >= plateau[idCase].mortgage*1.1) {
                    casePlateau.nbBuilds = 0
                    player.pay(plateau[idCase].mortgage*1.1).then(() => {
                        io.emit("mortgage", idCase, false, true)
                    }).catch(player.bankrupcy)
                } else {
                    socket.emit("notEnoughMoney")
                }
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

        
        if(Player.prototype.playerList.indexOf(player) == Player.prototype.activePlayer
            && player.isJailed == 0
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
                        log(plateau[i])
                        log(i, plateau[i].name, plateau[i].color, plateau[i].nbBuilds, property.name, property.color, property.nbBuilds)
                        // log(plateau[i].color == property.color, plateau[i].nbBuilds <= property.nbBuilds, plateau[i].nbBuilds >= property.nbBuilds-1)
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
            if(player.money >= buildPrice) {
                player.pay(buildPrice).then(() => {
                    property.nbBuilds++
                    property.canBuild = false
        
                    io.emit("addBuild", idProperty, false)
                })
            } else {
                socket.emit("notEnoughMoney")
            }
        }
    })

    socket.on("offerTrade", function(trade) {
        log("offerTrade", trade)

        let playerList = Player.prototype.playerList
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
        } else {
            io.emit("tradeError")
        }
        
    })
    
    socket.on("acceptTrade", function() {
        log("acceptTrade")
        let trade = Player.prototype.currentTrade
        let initPlayer = Player.prototype.getPlayerById(trade.init.id)
        let otherPlayer = Player.prototype.getPlayerById(trade.other.id)

        if(socket.id == otherPlayer.socket) {
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
                io.emit("changeOwner", trade.other.id, i, true)
            });

            trade.other.properties.forEach(i => {
                plateau[i].owner = initPlayer
                io.emit("changeOwner", trade.init.id, i, true)
            })
        }
    })

    socket.on("offerNewTrade", function() {
        log("offerNewTrade")

        let trade = Player.prototype.currentTrade
        let otherPlayer = Player.prototype.getPlayerById(trade.other.id)

        if(socket.id == otherPlayer.socket) {
            socket.emit("tradeForNewOffer", trade)
        }
    })

    socket.on("denyTrade", function() {
        log("denyTrade")

        let trade = Player.prototype.currentTrade
        let otherPlayer = Player.prototype.getPlayerById(trade.other.id)

        if(socket.id == otherPlayer.socket) {
            io.emit("tradeDenied", trade.init.id, trade.other.id)
            trade = null
            log(Player.prototype.currentTrade)
        }
    }) 

    socket.on("inputAuction", function(bid) {
        let auction = Auction.prototype.currentAuction
        let player = Player.prototype.getPlayerBySocket(socket.id)        

        log("inputAuction", bid, auction, player)

        log(auction.bid, bid, player.money, bid, auction.bid < bid, player.money >= bid)
        if(auction.bid < bid && player.money >= bid) {
            auction.lastPlayer = player
            auction.bid = bid
            auction.timeLeft = 10
            io.emit("newAuction", Player.prototype.playerList.indexOf(player), bid)
        } else {
            socket.emit("deniedAuction")
        }
        io.emit("syncAuctionTimer", auction.timeLeft)
    })
    
})

module.exports = Player