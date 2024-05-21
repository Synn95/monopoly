let idParc = 0

function Parc(id) {
    this.type = "parc"
    this.name = "Parc Gratuit"
    this.balance = 0

    idParc = id
}

Parc.prototype.toString = function() {
    return "Parc = " + this.balance + "€"
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

module.exports = Parc