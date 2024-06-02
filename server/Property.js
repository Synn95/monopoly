const plateau = require("./plateau.json")
const log = require("./log.js")

let lastRandomPropertyId = 0
let lastRandomTaxId = 0

function Property(property) {
    this.type = property.type
    this.name = property.name
    //this.case = idCase
    this.nbBuilds = 0
    this.canBuild = false
    this.owner = null
    this.locator = null

    switch(this.type) {
        case "property":
            this.color = property.color
            this.cost = property.cost
            this.rent = property.rent
            this.mortgage = property.mortgage
            break
        case "station":
            this.color = "station"
            this.cost = 200
            this.rent = null
            this.mortgage = 100
            break
        case "company":
            this.color = "company"
            this.cost = 150
            this.rent = null
            this.mortgage = 75
            break
    }
}

Property.prototype.toString = function() {
    let str = "Property = " + this.type + " ; " + this.name + " ; "

    if(this.owner != null) {
        str += "owner : " + this.owner.socket + "-" + this.owner.name  + " ; "
    }
    if(this.locator != null) {
        str += "locator : " + this.locator.socket + "-" + this.locator.name + " ; "
    }
    str += this.nbBuilds + " build ; " 
        + this.color + " ; "
        + "cost: " + this.cost + " ; "
        + "rent: " + this.rent + " ; "
        + "mortgage: " + this.mortgage

    return str
}

Property.prototype.getRent = function() {
    let rent = 0
    let tauxPossede = this.owner.colorGroup(this.color)
    log("Taux possede : " + tauxPossede)

    switch(this.color) {
        case "station":
            switch(tauxPossede[0]) {
                case 1:
                    rent = 25
                    break
                case 2:
                    rent = 50
                    break
                case 3:
                    rent = 100
                    break
                case 4:
                    rent = 100
                    break

            }
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
    log("randomProperty : " + plateau[idRandProp])

    lastRandomPropertyId = idRandProp;
    return plateau[idRandProp].name;
}

Property.prototype.getLastRandomPropertyId = function() {
    log("lastRandomPropertyId :", lastRandomPropertyId)
    return lastRandomPropertyId
}

module.exports = Property