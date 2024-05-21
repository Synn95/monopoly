const plateau = require("./plateau.json")

function Tax(name, cost) {
    this.type = "tax"
    this.name = name
    this.cost = cost
    this.locator = null
}

Tax.prototype.toString = function() {
    let str = "Tax = " + this.name + " ; " + this.cost + "€ ; "

    if(this.locator != null) {
        str += "locator : " + this.locator.socket + "-" + this.locator.name
    }
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

module.exports = Tax