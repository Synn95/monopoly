let player = null

function sleep(ms) { //Use : await sleep(ms);
    return new Promise(resolve => setTimeout(resolve, ms));
}

function afficherCarte(idProperty, canClose) {
    let idCarte = idProperty
    console.log(idCarte)

    let carteProp = document.getElementById("carteProp")
    let carteStation = document.getElementById("carteStation")
    let carteCompany = document.getElementById("carteCompany")

    if(!canClose) {
        let cartes = document.getElementById("cartes")
        cartes.style.height = "100%"
        cartes.style.width = "100%"
        cartes.style.left = ""

        cartes.style.backgroundColor = "rgba(0,0,0,0.4)"
        document.getElementById("fermerCarte").style.display = "none"
        document.getElementById("mortgageButton").style.display = "none"
    }

    if(document.getElementById("case-" + idCarte).dataset.owner == numPlayer && getActivePlayer().id == numPlayer) {
        console.log(true)
        document.getElementById("mortgageButton").style.display = ""
        if(document.getElementById("case-" + idCarte).dataset.isMortgage == true) {

        } else {
            document.getElementById("mortgageButton").dataset.idCarte = idCarte
        }
    } else {
        document.getElementById("mortgageButton").style.display = "none"
    }

    switch(casesPlateau[idCarte].type)  {
        case "property":
            let headProp = carteProp.children.item(0)
            let prix = Array.from(carteProp.querySelectorAll(".prix"))
            
            headProp.style.backgroundColor = casesPlateau[idCarte].color
            headProp.innerHTML ="<h1>" + casesPlateau[idCarte].name + "</h1>"

            prix.forEach(unPrix => {
                switch(unPrix.dataset.type) {
                    case "cost":
                        unPrix.innerText = casesPlateau[idCarte].cost + "€"
                        break
                    case "mortgage":
                        unPrix.innerText = casesPlateau[idCarte].mortgage + "€"
                        break
                    case "rent":
                        unPrix.innerText = casesPlateau[idCarte].rent[unPrix.dataset.rent] + "€"
                        break
                    case "prixMaison":
                        if(idCarte < 10) {
                            unPrix.innerText = "50€"
                        } else if(idCarte < 20) {
                            unPrix.innerText = "100€"
                        } else if(idCarte < 30) {
                            unPrix.innerText = "150€"
                        } else {
                            unPrix.innerText = "200€"
                        }
                        break
                }
            });

            carteCompany.style.display = "none"
            carteStation.style.display = "none"
            carteProp.style.display = ""
            break
        case "station":
            let headStation = carteStation.children.item(0)
            headStation.children.item(1).innerText = casesPlateau[idCarte].name

            carteStation.querySelector("[data-type='mortgage']").innerText = "100€"

            carteCompany.style.display = "none"
            carteProp.style.display = "none"
            carteStation.style.display = ""
            break
        case "company":
            let headCompany = carteCompany.children.item(0)
            headCompany.children.item(0).src = "img/" + casesPlateau[idCarte].src
            headCompany.children.item(1).innerText = casesPlateau[idCarte].name

            carteCompany.querySelector("[data-type='mortgage']").innerText = "75€"

            carteProp.style.display = "none"
            carteStation.style.display = "none"
            carteCompany.style.display = ""
            break
    }

    document.getElementById("carteChance").style.display = "none"
    document.getElementById("carteCommunity").style.display = "none"
    document.getElementById("cartes").style.display = ""
}

function afficherCarteChance(description) {
    carteProp.style.display = "none"
    carteStation.style.display = "none"
    carteCompany.style.display = "none"

    document.getElementById("mortgageButton").style.display = "none"
    document.getElementById("carteChance").style.display = ""
    document.querySelector("#carteChance .text").innerText = description

    document.getElementById("cartes").style.display = ""
}

function afficherCarteCommunity(description) {
    carteProp.style.display = "none"
    carteStation.style.display = "none"
    carteCompany.style.display = "none"

    document.getElementById("mortgageButton").style.display = "none"
    document.getElementById("carteCommunity").style.display = ""
    document.querySelector("#carteCommunity .text").innerText = description

    document.getElementById("cartes").style.display = ""
}

function showNewGameWindow(window) {
    let newGame = document.getElementById("newGame")
    Array.from(newGame.children).forEach(element => {
        element.style.display = "none"
    })

    window.style.display = ""
    newGame.style.display = ""
}

function getActivePlayer() {
    let id = document.getElementsByClassName("active").item(0).dataset.num
    return playerList[id]
}

function confirmBuy() {
    let num = document.getElementById("confirmButton").dataset.num
    socket.emit("confirmBuying", numPlayer, num)
}

function denyBuy() {
    let num = document.getElementById("denyButton").dataset.num
    socket.emit("denyBuying", numPlayer, num)
}

function closeMenu() {
    let cartes = document.getElementById("cartes")
    document.getElementById("fermerCarte").style.display = ""
    document.getElementById("mortgageButton").style.display = "none"
    document.getElementById("confirmButton").style.display = "none"
    document.getElementById("denyButton").style.display = "none"

    document.getElementById("carteChance").style.display = "none"
    document.getElementById("carteCommunity").style.display = "none"
    cartes.style.display = "none"
    cartes.style.height = "355px"
    cartes.style.width = "355px"
    cartes.style.left = "calc(50% - 395px/2)"
    cartes.style.backgroundColor = ""
}

function rollDices() {
    socket.emit("rollDices"); 
}

function endTurn() {
    socket.emit("endTurn");
    document.getElementById("endTurn").style.display = "none"
    document.getElementById("buttons").style.display = "none"

    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
    closeMenu()
}

async function movePlayer(playerId, caseDest, backward) {
    let player = playerList[playerId]
    let pion = document.querySelector("[data-num='"+playerId+"'].pion")
    let oldPlayerPos = player.pos
    console.log(playerId, player.pos, caseDest)

    player.pos = caseDest

    if(!backward) {
        if(oldPlayerPos < caseDest) {
            for(let i = oldPlayerPos ; i <= caseDest ; i++) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else if(oldPlayerPos > caseDest) {
            for(let i = oldPlayerPos ; i < cases.length ; i++) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
    
            for(let i = 0 ; i <= caseDest ; i++) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else {
            document.querySelector("#case-"+caseDest +" .casePion").appendChild(pion)
        }
    } else {
        if(oldPlayerPos > caseDest) {
            for(let i = oldPlayerPos ; i >= caseDest ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else if(oldPlayerPos < caseDest){
            for(let i = oldPlayerPos ; i >= 0 ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
    
            for(let i = cases.length-1 ; i >= caseDest ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else {
            document.querySelector("#case-"+caseDest +" .casePion").appendChild(pion)
        }
    }
} 

function createDisplayCard(innerHTML) {
    let displayCard = document.createElement("div")
    let closeDisplayCard = document.createElement("img")
    let events = document.getElementById("events")

    displayCard.classList.add("event")
    displayCard.innerHTML = innerHTML

    closeDisplayCard.src = "img/icons8-close-48.png"
    closeDisplayCard.addEventListener("click", async function() {
        displayCard.classList.add("hideEvent") 
        await sleep(200)
        displayCard.remove()
    })

    displayCard.appendChild(closeDisplayCard)
    events.insertBefore(displayCard, events.firstChild)

}

function mortgage() {
    socket.emit("clientMortgage", document.getElementById("mortgageButton").dataset.idCarte, numPlayer)
}

function buildMode(mode) {
    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
    document.getElementById("trade").style.background = ""
    if(mode == 0) {
        document.getElementById("addBuild").style.background = "#06c100"
        
    } else if(mode == 1) {
        document.getElementById("removeBuild").style.background = "#06c100"
    }

    for(let i = 0 ; i < casesPlateau.length ; i++) {
        if(casesPlateau[i].type == "property") {
            socket.emit("askBuild", i, mode)
        }
    }
}

function answerBuild(idProperty, canBuild, buildPrice, buildMode) {
    console.log("answerBuild", idProperty, canBuild, buildPrice, buildMode)
    let uneCase = document.getElementById("case-" + idProperty)
    if(canBuild) {
        uneCase.setAttribute("buildPrice", buildPrice)  
        if(buildMode == 1) {
            uneCase.classList.add("canSellBuild")
        } else {
            uneCase.classList.add("canBuyBuild")

        }
    } else {
        uneCase.classList.remove("canSellBuild")
        uneCase.classList.remove("canBuyBuild")
    }
}

function closeTradeWin() {
    let tradeWin = document.getElementById("tradeWin")
    let choosePlayer = document.getElementById("choosePlayer")
    let choosePossessions = document.getElementById("choosePossessions")
    
    tradeWin.style.display = "none"
    choosePlayer.style.display = "none"
    choosePossessions.style.display = "none"

    Array.from(document.querySelectorAll("#choosePlayer .player")).forEach(i => {
        i.remove()
    })

    Array.from(document.querySelectorAll(".aPossession")).forEach(aPossession => {
        aPossession.remove()
    })

    document.getElementById("trade").style.background = ""
}

function tradeChoosePlayer() {
    let closeTradeWin = document.getElementById("closeTradeWin")
    let tradeWin = document.getElementById("tradeWin")
    let choosePlayer = document.getElementById("choosePlayer")

    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
    document.getElementById("trade").style.background = "#06c100"

    tradeWin.style.display = ""
    choosePlayer.style.display = ""
    closeTradeWin.style.display = ""

    playerList.forEach(player => {
        if(playerList.indexOf(player) != numPlayer) {
            let playerElement = document.createElement("div")
            playerElement.classList.add("player")
            playerElement.dataset.num = playerList.indexOf(player)
            playerElement.innerText = player.pseudo

            playerElement.addEventListener("click", function() {
                choosePlayer.style.display = "none"

                Array.from(document.querySelectorAll("#choosePlayer .player")).forEach(i => {
                    i.remove()
                })

                tradeChoosePossessions(playerElement.dataset.num, false, null)
            })

            choosePlayer.appendChild(playerElement)
        }
    })
}

function tradeChoosePossessions(idPlayer, isNewOffer, trade) {
    let tradeWin = document.getElementById("tradeWin")
    let choosePossessions = document.getElementById("choosePossessions")
    let initPlayerPosses = document.querySelector("[data-player=init].possessions")
    let otherPlayerPosses = document.querySelector("[data-player=other].possessions")

    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
    document.getElementById("trade").style.background = "#06c100"

    tradeWin.style.display = ""
    choosePossessions.style.display = ""
    if(isNewOffer) {
        document.getElementById("closeTradeWin").style.display = "none"
        document.querySelector("#choosePossessions #initPlayerBalance").value = trade.other.money
        document.querySelector("#choosePossessions #otherPlayerBalance").value = trade.init.money
    } else {
        document.getElementById("closeTradeWin").style.display = ""
    }

    otherPlayerPosses.querySelectorAll(".aPossession").forEach(element => {
        element.remove()
    })

    initPlayerPosses.querySelectorAll(".aPossession").forEach(element => {
        element.remove()
    })

    initPlayerPosses.querySelector(".player").dataset.num = numPlayer
    initPlayerPosses.querySelector(".player > div").innerText = playerList[numPlayer].pseudo
    otherPlayerPosses.querySelector(".player").dataset.num = idPlayer
    otherPlayerPosses.querySelector(".player > div").innerText = playerList[idPlayer].pseudo

    cases.forEach(uneCase => {
        if(uneCase.dataset.owner == numPlayer) {
            let property = document.createElement("div")
            
            property.classList.add("aPossession")
            if(uneCase.dataset.color) {
                property.style.borderColor = uneCase.dataset.color
            } else {
                property.style.borderColor = "black"
            }

            property.innerText = uneCase.querySelector("h1").innerText
            property.dataset.selected = "false"
            property.dataset.propId = uneCase.id.slice(5)

            if(isNewOffer && trade.other.properties.includes(property.dataset.propId)) {
                property.dataset.selected = "true"
            }

            property.addEventListener("click", function() {
                if(property.dataset.selected == "false") {
                    property.style.background = "green"
                    property.dataset.selected = "true"
                } else {
                    property.style.background = ""
                    property.dataset.selected = "false"
                }
            })

            initPlayerPosses.appendChild(property)
        } else if(uneCase.dataset.owner == idPlayer) {
            let property = document.createElement("div")
            
            property.classList.add("aPossession")
            if(uneCase.dataset.color) {
                property.style.borderColor = uneCase.dataset.color
            } else {
                property.style.borderColor = "black"
            }

            property.innerText = uneCase.querySelector("h1").innerText
            property.dataset.selected = "false"
            property.dataset.propId = uneCase.id.slice(5)

            if(isNewOffer && trade.init.properties.includes(property.dataset.propId)) {
                property.dataset.selected = "true"
            }

            property.addEventListener("click", function() {
                if(property.dataset.selected == "false") {
                    property.dataset.selected = "true"
                } else {
                    property.dataset.selected = "false"
                }
            })

            otherPlayerPosses.appendChild(property)
        }
    })
}

function checkTradeAmount(idPlayer, isInitPlayer) {
    if(isInitPlayer) {
        let initPlayerBlance = document.getElementById("initPlayerBalance")
        if(playerList[idPlayer].balance < initPlayerBlance.value) {
            initPlayerBlance.value = playerList[idPlayer].balance
        }
    } else {
        let otherPlayerBalance = document.getElementById("otherPlayerBalance")

        if(playerList[idPlayer].balance < otherPlayerBalance.value) {
            otherPlayerBalance.value = playerList[idPlayer].balance
        }
    }
}

function offerTrade() {
    let tradeWin = document.getElementById("tradeWin")
    let choosePossessions = document.getElementById("choosePossessions")

    let idPlayer = document.querySelector('[data-player=other].possessions .player').dataset.num
    
    let initPlayerProperties = Array()
    let otherPlayerProperties = Array()

    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
    document.getElementById("trade").style.background = "#06c100"

    tradeWin.style.display = ""
    choosePossessions.style.display = "none"
    

    Array.from(choosePossessions.querySelectorAll("[data-player=init].possessions [data-selected=true].aPossession")).forEach(prop => {
        initPlayerProperties.push(prop.dataset.propId)
    })
    Array.from(choosePossessions.querySelectorAll("[data-player=other].possessions [data-selected=true].aPossession")).forEach(prop => {
        otherPlayerProperties.push(prop.dataset.propId)
    })

    if(choosePossessions.querySelector("#initPlayerBalance").value == "") {
        choosePossessions.querySelector("#initPlayerBalance").value = 0
    }
    if(choosePossessions.querySelector("#otherPlayerBalance").value == "") {
        choosePossessions.querySelector("#otherPlayerBalance").value = 0
    }

    let trade = {
        "init": {
            "id": numPlayer,
            "money": choosePossessions.querySelector("#initPlayerBalance").value,
            "properties": initPlayerProperties
        },
        "other": {
            "id": idPlayer,
            "money": choosePossessions.querySelector("#otherPlayerBalance").value,
            "properties": otherPlayerProperties
        }
    }

    socket.emit("offerTrade", trade)
}

function showCurrentOffreTrade(trade) {
    let tradeWin = document.getElementById("tradeWin")
    let closeTradeWin = document.getElementById("closeTradeWin")
    let waitTradeAnswer = document.getElementById("waitTradeAnswer")
    let otherPlayerPseudoNode = waitTradeAnswer.querySelector("[data-player=other]#possessions div")
    let initPlayerPseudoNode = waitTradeAnswer.querySelector("[data-player=init]#possessions div")
    let otherPlayerMoneyNode = waitTradeAnswer.querySelector("#otherPlayerBalance")
    let initPlayerMoneyNode = waitTradeAnswer.querySelector("#initPlayerBalance")
    let otherPlayerPossesNode = waitTradeAnswer.querySelector("[data-player=other].possessions")
    let initPlayerPossesNode = waitTradeAnswer.querySelector("[data-player=init].possessions")

    let initPlayer = trade.init.id
    let otherPlayer = trade.other.id

    tradeWin.style.display = ""
    waitTradeAnswer.style.display = ""
    waitTradeAnswer.querySelector("h1").innerText = playerList[initPlayer].pseudo + " a propose un echange a " + playerList[otherPlayer].pseudo
    closeTradeWin.style.display = "none"
    
    otherPlayerPseudoNode = playerList[otherPlayer].pseudo
    otherPlayerMoneyNode.value = trade.other.money
    otherPlayerPossesNode.querySelector(".player").dataset.num = otherPlayer
    otherPlayerPossesNode.querySelector(".player > div").innerText = playerList[otherPlayer].pseudo

    initPlayerPseudoNode = playerList[initPlayer].pseudo
    initPlayerMoneyNode.value = trade.init.money
    initPlayerPossesNode.querySelector(".player").dataset.num = initPlayer
    initPlayerPossesNode.querySelector(".player > div").innerText = playerList[initPlayer].pseudo

    otherPlayerPossesNode.querySelectorAll(".aPossession").forEach(element => {
        element.remove()
    })

    initPlayerPossesNode.querySelectorAll(".aPossession").forEach(element => {
        element.remove()
    })

    trade.other.properties.forEach(propId => {
        let prop = casesPlateau[propId]
        let propertyDiv = document.createElement("div")
            
        propertyDiv.classList.add("aPossession")
        if(prop.color) {
            propertyDiv.style.borderColor = prop.color
        } else {
            propertyDiv.style.borderColor = "black"
        }

        propertyDiv.innerText = prop.name
    
        otherPlayerPossesNode.appendChild(propertyDiv)
    })

    trade.init.properties.forEach(propId => {
        let prop = casesPlateau[propId]
        let propertyDiv = document.createElement("div")
            
        propertyDiv.classList.add("aPossession")
        if(prop.color) {
            propertyDiv.style.borderColor = prop.color
        } else {
            propertyDiv.style.borderColor = "black"
        }

        propertyDiv.innerText = prop.name
    
        initPlayerPossesNode.appendChild(propertyDiv)
    })

    if(otherPlayer == numPlayer) {
        document.getElementById("tradeButtons").style.display = ""
    } else {
        document.getElementById("tradeButtons").style.display = "none"
    }
}

function acceptTrade() {
    socket.emit("acceptTrade")
}

function offerNewTrade() {
    socket.emit("offerNewTrade")
}

function denyTrade() {
    socket.emit("denyTrade")
}

function checkBidAmount() {

    // let currentBid = document.getElementById("currentBid").dataset.bid
    let inputtingBid = document.getElementById("inputBid").value
    if(inputtingBid <= currentBid) {
        inputtingBid = currentBid + 1
    }
}

function inputAuction() {
    socket.emit("inputAuction", document.getElementById("inputBid").value)
}

async function auctionTimer() {
    let timerNode = document.getElementById("auctionTimer")
    while(timerNode.dataset.time > 0) {
        await sleep(1000)
        timerNode.dataset.time--

        timerNode.innerText = timerNode.dataset.time + "s"
    }
}

async function deniedAuction() {
    console.log("deniedAuction")
    document.getElementById("deniedAuction").style.display = ""
    await sleep(3000)
    document.getElementById("deniedAuction").style.display = "none"
}

function payFreePrison() {
    socket.emit("payFreePrison")
}

socket.on("activePlayer", function(id, hasRolledDices, isJailed) {
    console.log("activePlayer : " + id, hasRolledDices)
    document.querySelector(".active").classList.remove("active")
    document.querySelector("[data-num='"+id+"'].player").classList.add("active")

    closeMenu()

    playerList[id].isJailed = isJailed

    if(id == numPlayer) {
        document.getElementById("buttons").style.display = ""
        if(hasRolledDices) {
            document.getElementById("endTurn").style.display = ""
            document.getElementById("rollDices").style.display = "none"
        } else {
            document.getElementById("rollDices").style.display = ""
            document.getElementById("endTurn").style.display = "none"
            if(isJailed > 0) {
                document.getElementById("payFreePrison").style.display = ""
                document.getElementById("addBuild").style.display = "none"
                document.getElementById("removeBuild").style.display = "none"
                if(playerList[id].nbFreePrisonCard > 0) {
                    document.getElementById("useFreeCard").style.display = ""
                }
            }
        }
    }
})

socket.on("resultRollDice", async function(score, canPlayAgain) {
    let activePlayer = getActivePlayer()
    console.log("ResultRollDice : " + score, activePlayer, canPlayAgain)

    let dices = document.getElementById("dices")
    let firstDice = document.getElementById("firstDice")
    let secondDice = document.getElementById("secondDice")

    firstDice.src = "img/icons8-dice" + score[0] + "-96.png"
    secondDice.src = "img/icons8-dice" + score[1] + "-96.png"

    if(!canPlayAgain) {
        document.getElementById("rollDices").style.display = "none";
        document.getElementById("endTurn").style.display = ""
    }

    dices.style.display = ""
    await sleep(2000)
    dices.style.display = "none"

})

socket.on("movePlayer", function(playerId, idCaseDest, backward) {
    console.log("movePlayer")
    movePlayer(playerId, idCaseDest, backward)
})

socket.on("earn", function(playerId, amount) {
    console.log("earn : " + playerList[playerId].pseudo + " - " + amount)
    let innerHTML = '<div class="pionDisplayCard" data-num="'+ playerId +'"></div><h1>' + playerList[playerId].pseudo + ' a gagne <span class="earn">' + amount + '€</span></h1>'
    createDisplayCard(innerHTML)

    let balanceNode = document.querySelector("[data-num='"+playerId+"'].player .balance")
    let balance = parseInt(balanceNode.innerText.slice(0,-1))
    balance += amount
    balanceNode.innerText = balance + "€"

    playerList[playerId].balance = balance
})

socket.on("pay", function(playerId, amount) {
    console.log("pay : " + playerList[playerId].pseudo + " - " + amount)
    let innerHTML = '<div class="pionDisplayCard" data-num="'+ playerId +'"></div><h1>' + playerList[playerId].pseudo + ' a paye <span class="pay">' + amount + '€</span></h1>'
    createDisplayCard(innerHTML)

    let balanceNode = document.querySelector("[data-num='"+playerId+"'].player .balance")
    let balance = parseInt(balanceNode.innerText.slice(0,-1))
    balance -= amount
    balanceNode.innerText = balance + "€"

    playerList[playerId].balance = balance
})

socket.on("notEnoughMoney", function() {
    createDisplayCard('<h1>Vous n\'avez pas assez d\'argent')
})

socket.on("gatherMoney", function(amount) {
    console.log("gatherMoney", amount)
    document.getElementById("buttons").style.display = "none"
    let gatherRemainAmount = document.getElementById("gatherRemainAmount")
    gatherRemainAmount.innerHTML = "<h1>Vous devez encore collecter " + amount + "€</h1>"
    gatherRemainAmount.style.display = ""
})

socket.on("moneyGathered", function() {
    console.log("moneyGathered")
    document.getElementById("buttons").style.display = ""
    document.getElementById("gatherRemainAmount").style.display = "none"
})

socket.on("freeFromJail", function(idPlayer, canBuild) {
    console.log("freeFromJail", idPlayer, canBuild)
    createDisplayCard('<div class="pionDisplayCard" data-num="'+ idPlayer +'"></div><h1>' + playerList[idPlayer].pseudo + ' est sorti de prison</h1>')
    playerList[idPlayer].isJailed = 0
    document.getElementById("payFreePrison").style.display = "none"

    if(canBuild) {
        document.getElementById("addbuild").style.display = ""
        document.getElementById("removeBuild").style.display = ""
    }
})

socket.on("chance", function(description) {
    player = getActivePlayer()
    console.log("chance : " + player.pseudo + " - " + description)

    afficherCarteChance(description)
})

socket.on("community", function(description) {
    player = getActivePlayer()
    console.log("community : " + player.pseudo + " - " + description)

    afficherCarteCommunity(description)
})

socket.on("buy", function(idProperty) {
    let cartes = document.getElementById("cartes")
    let confirmButton = document.getElementById("confirmButton")
    let denyButton = document.getElementById("denyButton")
    player = getActivePlayer()
    console.log("buy", player.pseudo, idProperty)

    document.getElementById("cartesBoutons").style.display = ""
    afficherCarte(idProperty, false)
    

    if(getActivePlayer().id == numPlayer) {
        confirmButton.dataset.num = idProperty
        denyButton.dataset.num = idProperty
        confirmButton.style.display = ""
        denyButton.style.display = ""
    }
})

socket.on("changeOwner", function(idPlayer, idProperty, display) {
    console.log("changeOwner", playerList[idPlayer].pseudo, cases[idProperty])
    cases[idProperty].dataset.owner = idPlayer
    closeMenu()

    if(display) {
        createDisplayCard('<div class="pionDisplayCard" data-num="'+ idPlayer +'"></div><h1>' + playerList[idPlayer].pseudo + ' a acquit <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
    }
})

socket.on("sendToJail", function(playerId, caseDest, backward) {
    console.log("sendToJail", playerId)
    movePlayer(playerId, caseDest, backward)

    createDisplayCard('<div class="pionDisplayCard" data-num="'+ playerId +'"></div><h1>' + playerList[playerId].pseudo + ' est envoye en prison</h1>')
})

socket.on("updateFreePrisonCard", function(idPlayer, newCardCount) {
    console.log("updateFreePrisonCard", idPlayer, newCardCount)
    playerList[idPlayer].nbFreePrisonCard = newCardCount  
})

socket.on("tooManyDoubles", function() {
    console.log("tooManyDoubles")
    createDisplayCard('<div class="pionDisplayCard" data-num="'+ playerId +'"></div><h1>' + playerList[playerId].pseudo + ' a fait 3 doubles d\'affile</h1>')
})

socket.on("canBuild", function(canBuild) {
    console.log("canBuild", canBuild)
    if(canBuild) {
        document.getElementById("removeBuild").style.display = ""
        document.getElementById("addBuild").style.display = ""
    } else {
        document.getElementById("removeBuild").style.display = "none"
        document.getElementById("addBuild").style.display = "none"
    }
})

socket.on("answerBuild", answerBuild)

socket.on("addBuild", function(idProperty, isInit) {
    console.log("addbuild :", cases[idProperty])
    let build = document.createElement("div")
    let headerCase = cases[idProperty].children[1]
    let colorGroup = document.querySelectorAll("[data-color=" + document.getElementById("case-"+idProperty).dataset.color)


    if(headerCase.children.length == 4) {
        if(!isInit) {
            createDisplayCard('<div class="pionDisplayCard" data-num="'+ cases[idProperty].dataset.owner +'"></div><h1>' + playerList[cases[idProperty].dataset.owner].pseudo + ' a achete un hotel sur <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
        }

        Array.from(headerCase.children).forEach(build => {
            build.remove()
        })
        build.classList.add("hotel")
    } else {
        if(!isInit) {
            createDisplayCard('<div class="pionDisplayCard" data-num="'+ cases[idProperty].dataset.owner +'"></div><h1>' + playerList[cases[idProperty].dataset.owner].pseudo + ' a achete une maison sur <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
        }

        build.classList.add("house")
    }
    headerCase.appendChild(build)

    if(!isInit) {
        colorGroup.forEach(element => {
            socket.emit("askBuild", element.id.slice(5), 0)
        });
    }
})

socket.on("removeBuild", function(idProperty, isInit) {
    console.log("removebuild :", cases[idProperty])
    let headerCase = cases[idProperty].children[1]
    let colorGroup = document.querySelectorAll("[data-color=" + document.getElementById("case-"+idProperty).dataset.color)

    if(headerCase.firstChild.classList.contains("hotel")) {
        if(!isInit) {
            createDisplayCard('<div class="pionDisplayCard" data-num="'+ cases[idProperty].dataset.owner +'"></div><h1>' + playerList[cases[idProperty].dataset.owner].pseudo + ' a vendu un hotel sur <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
        }
        
        for(let i = 0 ; i < 4 ; i++) {
            let build = document.createElement("div")
            build.classList.add("house")
            headerCase.appendChild(build)
        }
    } else  if(!isInit) {
        createDisplayCard('<div class="pionDisplayCard" data-num="'+ cases[idProperty].dataset.owner +'"></div><h1>' + playerList[cases[idProperty].dataset.owner].pseudo + ' a vendu une maison sur <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
    }
    headerCase.firstChild.remove()

    if(!isInit) {
        colorGroup.forEach(element => {
            socket.emit("askBuild", element.id.slice(5), 1)
        });
    }
})

socket.on("mortgage", function(idCase, mortgage, display) {
    console.log("mortgage", idCase, mortgage)
    let casePlateau = document.getElementById("case-" + idCase)
    if(mortgage) {
        if(display) {
            createDisplayCard('<div class="pionDisplayCard" data-num="'+ casePlateau.dataset.owner +'"></div><h1>' + playerList[casePlateau.dataset.owner].pseudo + ' a hypotheque <span style="color: '+ casesPlateau[idCase].color + '">' + casesPlateau[idCase].name + '</span></h1>')
        }

        casePlateau.classList.add("mortgage")

        // let mortgageSign = document.createElement("div")
        // mortgageSign.classList.add("mortgage")
        // mortgageSign.style.gridArea = casePlateau.style.gridArea
        // mortgageSign.id = "mortgage-" + idCase
        // mortgageSign.style.zIndex = 1

        // let name = document.createElement("h1")
        // name.innerText = casesPlateau[idCase].name

        // let mortgageText = document.createElement("h2")
        // mortgageText.innerText = "HYPOTHEQUE"

        // mortgageSign.appendChild(name)
        // mortgageSign.appendChild(mortgageText)
        // document.getElementById("plateau").appendChild(mortgageSign)
    } else {
        // document.getElementById("mortgage-" + idCase).remove()
        casePlateau.classList.remove("mortgage")
        createDisplayCard('<div class="pionDisplayCard" data-num="'+ casePlateau.dataset.owner +'"></div><h1>' + playerList[casePlateau.dataset.owner].pseudo + ' a degage <span style="color: '+ casesPlateau[idProperty].color + '">' + casesPlateau[idProperty].name + '</span></h1>')
    }
})

socket.on("cannotMortgage", function() {
    createDisplayCard('<h1>Impossible d\'hypothequer : vous devez d\'abord vendre tous vos batiments</h1>')
})

socket.on("trade", function(trade) {
    console.log("trade", trade)
    showCurrentOffreTrade(trade)
})

socket.on("tradeAccepted", function(initPlayerId, otherPlayerId) {
    console.log("tradeAccepted", initPlayerId, otherPlayerId)
    let tradeWin = document.getElementById("tradeWin")
    let choosePlayer = document.getElementById("choosePlayer")
    let choosePossessions = document.getElementById("choosePossessions")

    document.getElementById("trade").style.background = ""

    tradeWin.style.display = "none"
    choosePlayer.style.display = "none"
    choosePossessions.style.display = "none"

    createDisplayCard('<div class="pionDisplayCard" data-num="'+ initPlayerId +'"></div> \
        <div class="pionDisplayCard" data-num="'+ otherPlayerId +'"></div> \
        <h1>' + playerList[otherPlayerId].pseudo + ' a accepte un echange avec ' + playerList[initPlayerId].pseudo + '</h1>'
    );
})

socket.on("tradeDenied", function(initPlayerId, otherPlayerId) {
    console.log("tradeDenied", initPlayerId, otherPlayerId)
    let tradeWin = document.getElementById("tradeWin")
    let choosePlayer = document.getElementById("choosePlayer")
    let choosePossessions = document.getElementById("choosePossessions")

    document.getElementById("trade").style.background = ""

    tradeWin.style.display = "none"
    choosePlayer.style.display = "none"
    choosePossessions.style.display = "none"

    createDisplayCard('<div class="pionDisplayCard" data-num="'+ initPlayerId +'"></div> \
        <div class="pionDisplayCard" data-num="'+ otherPlayerId +'"></div> \
        <h1>' + playerList[otherPlayerId].pseudo + ' a refuse l\'echange avec ' + playerList[initPlayerId].pseudo + '</h1>'
    );
})

socket.on("tradeForNewOffer", function(trade) {
    document.getElementById("waitTradeAnswer").style.display = "none"
    tradeChoosePossessions(trade.init.id, true, trade)
})

socket.on("tradeError", function() {
    let tradeWin = document.getElementById("tradeWin")
    let choosePlayer = document.getElementById("choosePlayer")
    let choosePossessions = document.getElementById("choosePossessions")

    document.getElementById("trade").style.background = ""

    tradeWin.style.display = "none"
    choosePlayer.style.display = "none"
    choosePossessions.style.display = "none"

    createDisplayCard('<h1>Une erreur s\'est produite lors de l\'echange. Veuillez reessayer.')
})

socket.on("initiateAuction", function(property, initialAmount) {
    document.getElementById("auctionTimer").dataset.time = 10
    auctionTimer()
    afficherCarte(property, false)
    document.getElementById("cartesEncheres").style.display = ""
    document.getElementById("cartesBoutons").style.display = "none"

    document.getElementById("currentBid").innerText = "Depart : " + initialAmount + "€"
    document.getElementById("currentBid").dataset.bid = initialAmount
})

socket.on("deniedAuction", deniedAuction)

socket.on("newAuction", function(idPlayer, amount) {
    console.log("newAuction", idPlayer, amount)
    document.getElementById("currentBid").innerText = playerList[idPlayer].pseudo + " : " + amount + "€"
    document.getElementById("currentBid").dataset.bid = amount
})

socket.on("syncAuctionTimer", function(time) {
    document.getElementById("auctionTimer").dataset.time = time
    console.log("syncAuctionTimer", time)
})

socket.on("endAuction", function(winningPlayerId, propertyId, amount) {
    console.log("endAuction", winningPlayerId, propertyId, amount)
    let property = casesPlateau[propertyId]

    closeMenu()
    document.getElementById("cartesEncheres").style.display = "none"
    document.getElementById("cartesBoutons").style.display = ""


    if(winningPlayerId != null) {
        createDisplayCard(
            '<div class="pionDisplayCard" data-num="'+ winningPlayerId +'"></div>\
            <h1>' + playerList[winningPlayerId].pseudo + ' a gagne l\'enchere de \
                <span style="color: ' + property.color + '">' + property.name +'</span> pour \
                <span class="earn">' + amount + '€</span>\
            </h1>'
        )
    } else {
        createDisplayCard(
            '<h1>Personne n\'a faut d\'enchere pour \
                <span style="color: ' + property.color + '">' + property.name +'</span>\
            </h1>'
        )
    }

    socket.on("bankrupcy", function(playerId) {
        console.log("bankrupcy", playerId)
    })

    socket.on("gameOver", function() {
        console.log("gameOver")
    })
})