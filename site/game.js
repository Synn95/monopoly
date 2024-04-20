let player = null

function sleep(ms) { //Use : await sleep(ms);
    return new Promise(resolve => setTimeout(resolve, ms));
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
    document.getElementById("confirmButton").style.display = "none"
    document.getElementById("denyButton").style.display = "none"
    cartes.style.display = "none"
    cartes.style.height = "355px"
    cartes.style.width = "220px"
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
}

async function movePlayer(playerId, caseDest, backward) {
    let player = playerList[playerId]
    let pion = document.querySelector("[data-num='"+playerId+"'].pion")
    console.log(player.pos, caseDest)

    if(!backward) {
        if(player.pos < caseDest) {
            for(let i = player.pos ; i <= caseDest ; i++) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else if(player.pos > caseDest) {
            for(let i = player.pos ; i < cases.length ; i++) {
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
        if(player.pos > caseDest) {
            for(let i = player.pos ; i >= caseDest ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else if(player.pos < caseDest){
            for(let i = player.pos ; i > 0 ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
    
            for(let i = cases.length ; i >= caseDest ; i--) {
                document.querySelector("#case-"+i +" .casePion").appendChild(pion)
                await sleep(100)
            }
        } else {
            document.querySelector("#case-"+caseDest +" .casePion").appendChild(pion)
        }
    }

    player.pos = caseDest
} 

socket.on("activePlayer", function(id, hasRolledDices) {
    console.log("activePlayer : " + id, hasRolledDices)
    document.querySelector(".active").classList.remove("active")
    document.querySelector("[data-num='"+id+"']").classList.add("active")
    if(id == numPlayer) {
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
    movePlayer(activePlayer.id, idCaseDest, false)
})

socket.on("movePlayer", movePlayer)

socket.on("earn", function(playerId, amount) {
    console.log("earn : " + playerList[playerId].pseudo + " - " + amount)
})

socket.on("pay", function(playerId, amount) {
    console.log("pay : " + playerList[playerId].pseudo + " - " + amount)
})

socket.on("chance", function(description) {
    player = getActivePlayer()
    console.log("chance : " + player.pseudo + " - " + description)
})

socket.on("community", function(description) {
    player = getActivePlayer()
    console.log("community : " + player.pseudo + " - " + description)
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

    if(getActivePlayer().id == numPlayer) {
        confirmButton.dataset.num = idProperty
        denyButton.dataset.num = idProperty
        confirmButton.style.display = ""
        denyButton.style.display = ""
    }
})

socket.on("changeOwner", function(idPlayer, idProperty) {
    console.log("changeOwner", playerList[idPlayer].pseudo, cases[idProperty])
    cases[idProperty].dataset.owner = idPlayer
    closeMenu()
})

socket.on("sendToJail", movePlayer)