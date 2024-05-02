let player = null
let timeoutFunction = null

function sleep(ms) { //Use : await sleep(ms);
    return new Promise(resolve => setTimeout(resolve, ms));
}

function afficherCarte(idProperty) {
    let idCarte = idProperty
    console.log(idCarte)

    let carteProp = document.getElementById("carteProp")
    let carteStation = document.getElementById("carteStation")
    let carteCompany = document.getElementById("carteCompany")

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
            let prix = Array.from(document.getElementsByClassName("prix"))
            
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
            headCompany.children.item(0).src = casesPlateau[idCarte].src
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

    document.getElementById("carteChance").style.display = ""
    document.querySelector("#carteChance .text").innerText = description

    document.getElementById("cartes").style.display = ""
}

function afficherCarteCommunity(description) {
    carteProp.style.display = "none"
    carteStation.style.display = "none"
    carteCompany.style.display = "none"

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
    cartes.style.backgroundColor = ""
}

function rollDices() {
    socket.emit("rollDices"); 
    document.getElementById("rollDices").style.display = "none";
    document.getElementById("endTurn").style.display = ""
}

function endTurn() {
    socket.emit("endTurn");
    document.getElementById("endTurn").style.display = "none";
    document.getElementById("buttons").style.display = "none"
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
    displayCard.classList.add("event")
    displayCard.innerHTML = innerHTML
    document.getElementById("eventsTransparency").appendChild(displayCard)

    if(timeoutFunction == null) {
        timeoutFunction = setInterval(showHideDisplayCard, 1200)
    }
}

async function showHideDisplayCard() {
    if(document.getElementById("eventsTransparency").children.length == 1) {
        clearInterval(timeoutFunction)
        timeoutFunction = null
    } else {
        await sleep(1000)
        document.querySelector(".event").classList.add("hideEvent") 
        await sleep(200)
        document.querySelector(".event").remove()
    }
}

function mortgage() {
    socket.emit("clientMortgage", document.getElementById("mortgageButton").dataset.idCarte, numPlayer)
}

function buildMode(mode) {
    document.getElementById("addBuild").style.background = ""
    document.getElementById("removeBuild").style.background = ""
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
            uneCase.classList.add("canBuyBuild")
            uneCase.addEventListener("click", function() {
                console.log("sell build", uneCase)
            })
        } else {
            uneCase.addEventListener("click", function() {
                console.log("buy build", uneCase)
            })

        }
    }
}

socket.on("activePlayer", function(id, hasRolledDices) {
    console.log("activePlayer : " + id, hasRolledDices)
    document.querySelector(".active").classList.remove("active")
    document.querySelector("[data-num='"+id+"'].player").classList.add("active")
    if(id == numPlayer) {
        document.getElementById("buttons").style.display = ""
        if(hasRolledDices) {
            document.getElementById("endTurn").style.display = ""
        } else {
            document.getElementById("rollDices").style.display = ""
        }
    }
})

socket.on("resultRollDice", function(score) {
    let activePlayer = getActivePlayer()
    let idCaseDest = score[0] + score[1] + activePlayer.pos
    console.log("ResultRollDice : " + score, activePlayer)

    if(idCaseDest < 0) {
        idCaseDest += cases.length
    } else if(idCaseDest >= cases.length) {
        idCaseDest -= cases.length
    } 
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

    
    afficherCarte(idProperty)
    cartes.style.height = "100%"
    cartes.style.width = "100%"
    cartes.style.backgroundColor = "rgba(0,0,0,0.4)"
    document.getElementById("fermerCarte").style.display = "none"
    document.getElementById("mortgageButton").style.display = "none"

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

socket.on("addBuild", function(idProperty) {
    console.log("addbuild :", cases[idProperty])
    let build = document.createElement("div")
    let headerCase = cases[idProperty].children[1]
    if(headerCase.children.length == 4) {
        Array.from(headerCase.children).forEach(build => {
            build.remove()
        })
        build.classList.add("hotel")
    } else {
        build.classList.add("house")
    }
    headerCase.appendChild(build)
})

socket.on("removeBuild", function(idProperty) {
    console.log("removebuild :", cases[idProperty])
    let headerCase = cases[idProperty].children[1]
    if(headerCase.firstChild.classList.contains("hotel")) {
        
        for(let i = 0 ; i < 4 ; i++) {
            let build = document.createElement("div")
            build.classList.add("house")
            headerCase.appendChild(build)
        }
    } 
    headerCase.firstChild.remove()
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