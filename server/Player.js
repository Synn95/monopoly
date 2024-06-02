const communityCards = require("./communityCards.js")
const chance = require("./chance.js");
const Parc = require("./Parc.js")
const Jail = require("./Jail.js")
const Auction = require("./Auction.js")
const log = require("./log.js")
const plateau = require("./plateau.js")

let io = null
let playerList = new Array()

function Player(socket, name, num) {
    this.socket = socket
    this.name = name
    this.money = 1500
    this.deck = new Array()
    this.lastScore = new Array(0, 0)
    this.numberOfDoubles = 0
    this.idCase = 0
    this.nbFreePrisonCards = 0
    this.isJailed = 0
    this.currentAction = null
    this.hasRolledDices = false
    this.isBankrupt = false

    Player.prototype.playerList().splice(num, 0, this)

    log(Player.prototype.playerList())
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

Player.prototype.getId = function() {
    return Player.prototype.playerList().indexOf(this)
}

Player.prototype.getPlayerById = function(id) {
    return Player.prototype.playerList()[id]
}

Player.prototype.getPlayerBySocket = function(socket) {
    let playerRet = null
    Player.prototype.playerList().forEach(player => {
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
            io.emit("freeFromJail", Player.prototype.playerList().indexOf(this), this.canBuild())
            this.isJailed = 0
            this.goTo(this.idCase + this.lastScore[0] + this.lastScore[1])
            this.actionCase(plateau[this.idCase])
        } else if(this.isJailed == 1) {
            this.pay(50)
            io.emit("freeFromJail", Player.prototype.playerList().indexOf(this), this.canBuild())
            this.goTo(this.idCase + this.lastScore[0] + this.lastScore[1])
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
    switch(state) {
        case 0: //player is on the property
            log("Player is on property " + property.name)
            if(property.owner === null && property.locator == this) {
                if(this.money >= property.cost) {
                    this.currentAction = {"function": "buy", "params": [property, 0]}
                    io.emit("buy", plateau.indexOf(property))
                } else {
                    let auction = new Auction(property)
                    auction.awaitAuctionEnd()
                    io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))
                }
            } else {
                this.buy(property, 2)
            }
            break
        case 1: //player want to buy it
            log("Player want to buy")
            if(property.owner === null && property.locator == this) {
                if(this.money >= property.cost) { 
                    this.pay(property.cost)
                    this.deck.push(property)
                    property.owner = this
                    io.emit("changeOwner", Player.prototype.activePlayer, plateau.indexOf(property), true)

                    if(this.currentAction != null && this.currentAction.function == "buy") {
                        this.currentAction = null
                    }

                    io.to(this.socket).emit("canBuild", this.canBuild())
                } else {
                    let auction = new Auction(property)
                    auction.awaitAuctionEnd()
                    io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))
                }
                
                
            }
            break
        case 2:
            log("Player cannot/don't want to buy")
            let auction = new Auction(property)
            auction.awaitAuctionEnd()
            io.emit("initiateAuction", plateau.indexOf(property), Math.floor(property.cost / 2))

    }
}

Player.prototype.pay = function(amount) {
    let res = 0
    log("Player is paying " + amount)
    
    log(this, " : -" + amount)
    this.money -= amount
    io.emit("pay", Player.prototype.playerList().indexOf(this), amount)
    if(this.money < 0) {
        if( this.getAssets() >= this.money) {
            log(this, " : Not enough to pay " + amount)
            this.currentAction = {"function": "gatherMoney", "params": [amount]}
            io.to(this.socket).emit("gatherMoney", this.money * -1)
        } else {
            this.bankrupcy()
        }
    }
        
}

Player.prototype.earn = function(amount) {
    this.money += amount
    io.emit("earn", Player.prototype.playerList().indexOf(this), amount)
    if(this.currentAction !== null && this.currentAction.function == "gatherMoney") {
        if(this.money >= 0) {
            this.currentAction = null
            io.to(this.socket).emit("moneyGathered")
        } else {
            io.to(this.socket).emit("gatherMoney", this.money *-1)
        }
    }
}

Player.prototype.getAssets = function() {
    let assets = 0

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

    log("Current assets :",assets)
    return assets
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
    io.emit("movePlayer", Player.prototype.playerList().indexOf(this), idCaseDest, false)
}

Player.prototype.actionCase = function(caseDest) {
    log("actionCase", this, caseDest)
    if(this == caseDest.locator) {
        switch(caseDest.type) {
            case "property":
                log("Player is on property")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this && caseDest.nbBuilds != -1) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                }
                break
            case "station":
                log("Player is on station")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                }

                break
            case "company":
                log("Player is on company")
                if(caseDest.owner === null) {
                    this.buy(caseDest, 0)
                } else if(caseDest.owner != this) {
                    let rent = caseDest.getRent()
                    this.pay(rent)
                }
                break
            case "start":
                log("Player is on start")
                // this.earn(200)
                break
            case "tax":
                log("Player is on tax")
                this.pay(caseDest.getRent())
                break
            case "chance":
                log("Player is on chance")
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
                log("Player is on community")
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
                log("Player is on go to jail")
                Jail.prototype.sendToJail(this)
                io.emit("sendToJail", Player.prototype.activePlayer, Jail.prototype.getJailId(), true)
                break
            case "parc":
                log("Player is on parc")
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
    let disconnectedPlayerList = new Array()

    Player.prototype.playerList().forEach(player => {
        if(player.socket === null) {
            disconnectedPlayerList.push(Player.prototype.playerList().indexOf(player))
        }
    });

    return disconnectedPlayerList
}
Player.prototype.getClientPlayerList = function() {
    let clientPlayerList = Array()
    Player.prototype.playerList().forEach(player => {
        clientPlayerList.push({
            "id": Player.prototype.playerList().indexOf(player),
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
    if(Player.prototype.activePlayer < Player.prototype.playerList().length-1) {
        Player.prototype.activePlayer++
    } else {
        Player.prototype.activePlayer = 0
    }
}

Player.prototype.bankrupcy = function() {
    log("bankrupcy for ", this)
    io.emit("bankrupcy", Player.prototype.playerList().indexOf(this))
    this.isBankrupt = true

    let nbBankrupcy = 0
    Player.prototype.playerList().forEach(player => {
        if(player.isBankrupt) {
            nbBankrupcy++
        }
    })

    log(nbBankrupcy + " player(s) bankrupted")
    if(nbBankrupcy == Player.prototype.playerList().length - 1) {
        io.emit("gameOver")
        log("Game is over")
        process.exit(0)
    }
}

Player.prototype.currentTrade = null
Player.prototype.playerList = function() {return playerList}
Player.prototype.activePlayer = 0
Player.prototype.setIo = function(server) {io = server}

module.exports = Player