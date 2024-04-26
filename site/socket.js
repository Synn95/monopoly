const socket = io()

function enterPseudo() {
    let waiting= document.getElementById("waiting")
    let pseudo = document.getElementById("inputPseudo").value

    if(pseudo == "") {alert("Votre pseudo ne peut pas être vide")}
    else {
        socket.emit("pseudo", pseudo)
        showNewGameWindow(waiting)
    }
}

function setPlayerPseudo(numPlayer, pseudo) {
    document.querySelector('[data-num="' + numPlayer + '"] .pseudo').innerText = pseudo
}

function setPlayerBalance(numPlayer, balance) {
    document.querySelector("[data-num='"+numPlayer+"'].player .balance").innerText = balance + "€"
}

socket.on("numPlayer", function(num) {
    console.log("player number received : " + num)
    if(num != -1) {
        numPlayer = num
        
    } else {
        showNewGameWindow(document.getElementById("gameIsFull"))
    }
    
})

socket.on("askPseudo", function() {
    console.log("askPseudo")
    showNewGameWindow(document.getElementById("enterPseudo"))
})


socket.on("playerIsDisconnected", function(serverPlayerList) { //lors de la connexion, si un ou plusieurs joueurs ont précédemment été déconnecté
    console.log("there is at least one disconnected player")
    console.log(serverPlayerList)
    let playerIsDisconnected = document.getElementById("playerIsDisconnected")

    for(let i = 0 ; i < serverPlayerList.length ; i++) {
        let disconnectedPlayer = document.createElement("button")
        disconnectedPlayer.classList.add("disconnectedPlayer")
        disconnectedPlayer.innerText = playerList[serverPlayerList[i]].pseudo

        disconnectedPlayer.onclick = function () {
            socket.emit("numDisconnectedPlayer", serverPlayerList[i])
        }

        playerIsDisconnected.appendChild(disconnectedPlayer)
    }

    if(serverPlayerList.length < 4) {
        let disconnectedPlayer = document.createElement("button")
        disconnectedPlayer.classList.add("disconnectedPlayer")
        disconnectedPlayer.innerText = "Nouveau joueur"

        disconnectedPlayer.onclick = function () {
            socket.emit("numDisconnectedPlayer", -1)
        }

        playerIsDisconnected.appendChild(disconnectedPlayer)
    }

    showNewGameWindow(playerIsDisconnected)
}) 

socket.on("clientPlayerList", function(clientPlayerList) {
    console.log("clientPlayerList", clientPlayerList)
    playerList = clientPlayerList
    playerList.forEach(player => {
        setPlayerPseudo(player.id, player.pseudo)
        setPlayerBalance(player.id, player.balance)
        movePlayer(player.id, player.pos, false)
    })
})

socket.on("broadcastPseudo", function(numPlayer, pseudo) {
    console.log("pseudo received : " + numPlayer + " " + pseudo)
    let i = 0
    let trouve = false

    while(i < playerList.length && !trouve) {
        if(playerList[i].id == numPlayer) {
            playerList[i].pseudo = pseudo
            trouve = true
        }
        i++
    }

    setPlayerPseudo(numPlayer, pseudo)
    // createDisplayCard('<div class="pionDisplayCard" data-num="'+ numPlayer +'"></div><h1>' + playerList[numPlayer].pseudo + ' a rejoint la partie</h1>')
})

socket.on("playerDisconnected", function(serverPlayerList) { //Lorsqu'un joueur se déconnecte
    console.log("playerDisconnected")
    console.log(serverPlayerList)
    let playerNameListStr = Array()
    let isDisconnectedPlayer = false
    
    for(let i = 0 ; i < serverPlayerList.length ; i++) {
        isDisconnectedPlayer = true
        let j = 0
        let trouve = false
        while(j < playerList.length && !trouve) {
            if(playerList[j].id == serverPlayerList[i]) {
                playerNameListStr.push(playerList[j].pseudo)
            }
            j++
        }
    }

    document.querySelector("#playerDisconnected h1").innerText = "En attente d'une reconnexion de " + playerNameListStr.toString()

    if(isDisconnectedPlayer) {
        showNewGameWindow(document.getElementById("playerDisconnected"))
    } else if(playerList.length < 4) {
        showNewGameWindow(document.getElementById("waiting"))
    } else {
        document.getElementById("newGame").style.display = "none"
    }
})