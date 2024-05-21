const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const log = require("./log.js")
const Auction = require("./Auction.js")
const Player = require("./Player.js")

const plateau = require("./plateau.js")


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
            const data = fs.readFileSync(__dirname.slice(0, -6) + "client" + req.url);
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