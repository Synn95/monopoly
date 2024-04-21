const plateau = require("./plateau.json")


let lastRandomPropertyId = 0
let lastRandomTaxId = 0
let jailIdCase = -1
let jailedList = new Array()
let idParc = 0


function Property(property) {
    this.type = property.type
    this.name = property.name
    //this.case = idCase
    this.nbBuilds = 0
    this.owner = null
    this.locator = null

    switch(this.type) {
        case "property":
            this.color = property.color
            this.cost = property.cost
            this.rent = property.rent
            break
        case "station":
            this.color = "station"
            this.cost = 200
            this.rent = null
            break
        case "company":
            this.color = "company"
            this.cost = 150
            this.rent = null
            break
    }
}

Property.prototype.getRent = function() {
    let rent = 0
    let tauxPossede = this.owner.colorGroup(this.color)
    console.log("Taux possede : " + tauxPossede)

    switch(this.color) {
        case "station":
            rent = tauxPossede[0] * 4
            break
        case "company":
            if(tauxPossede[0] == 1) {
                rent = this.locator.getTotalLastScore() * 4
            } else {
                rent = this.locator.getTotalLastScore() * 10
            }

            break
        default:
            if(this.nbBuilds > 0) {
                rent = this.rent[this.nbBuilds+1]
            } else if(tauxPossede[0] == tauxPossede[1]) {
                rent = this.rent[1]
            } else {
                rent = this.rent[0]
            }
    }

    return rent
}

Property.prototype.getRandomProperty = function() {
    let idRandProp = 0;
    while(plateau[idRandProp].type != "property" && plateau[idRandProp].type != "station" && plateau[idRandProp].type != "company") {
        idRandProp = Math.floor(Math.random() * plateau.length)
    }
    console.log("randomProperty : " + plateau[idRandProp])

    lastRandomPropertyId = idRandProp;
    return plateau[idRandProp].name;
}

Property.prototype.getLastRandomPropertyId = function() {
    console.log("lastRandomPropertyId :", lastRandomPropertyId)
    return lastRandomPropertyId
}



function Tax(name, cost) {
    this.type = "tax"
    this.name = name
    this.cost = cost
    this.locator = null
}

Tax.prototype.getRent = function(){
    return this.cost
}

Tax.prototype.getLastRandomTaxId = function() {return lastRandomTaxId}

Tax.prototype.getRandomTaxCase = function() {
    let idRandTax = 0
    while(plateau[idRandTax].type != "tax") {
        // console.log("randomTax : " + plateau[idRandTax].type)
        idRandTax = Math.floor(Math.random() * plateau.length)
    }

    lastRandomTaxId = idRandTax
    return plateau[idRandTax]
}


function Jail(idCase) {
    this.type = "jail"
    jailIdCase = idCase
}

Jail.prototype.sendToJail = function(player) {
    if(jailIdCase != -1) {
        player.idCase = jailIdCase
        jailedList.push(player)
    }
}

Jail.prototype.getJailId = function() {return jailIdCase}


function Parc(id) {
    this.type = "parc"
    this.name = "Parc Gratuit"
    this.balance = 0

    idParc = id
}

Parc.prototype.incrementParcBalance = function(amount) {
    this.balance += amount
}

Parc.prototype.transferParcBalance = function(player) {
    player.earn(this.balance)
    this.balance = 0
}

Parc.prototype.getParcId = function() {
    return idParc
}

module.exports = {Property, Tax, Jail, Parc}