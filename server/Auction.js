const log = require("./log.js")

function Auction(property) {
    this.property = property
    this.lastPlayer = null
    this.bid = Math.floor(property.cost / 2)-1
    this.timeLeft = 10

    Auction.prototype.currentAuction = this
}

Auction.prototype.toString = function() {
    let str = "Auction = " + this.property.name + " ; " + this.bid + " ; "
    if(this.lastPlayer != null) {
        str += this.lastPlayer.socket + "-" + this.lastPlayer.name
    }

    return str
}

Auction.prototype.currentAuction = null

Auction.prototype.timer = async function() {
    while(this.timeLeft > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.timeLeft--
        log("time left :", this.timeLeft)
    }
    log("return")
    return new Promise(callback => {callback()})
}

module.exports = Auction