const communityCards = require("./communityCards.js")
const chance = require("./chance.js");
const Parc = require("./Parc.js")
const Jail = require("./Jail.js")
const Auction = require("./Auction.js")
const log = require("./log.js")
const plateau = require("./plateau.js")

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

module.exports = Player