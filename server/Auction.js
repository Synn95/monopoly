const log = require("./log.js")
const plateau = require("./plateau.js")

let io = null

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

Auction.prototype.awaitAuctionEnd = async function() {
    log("start timer")
    this.timer().then(() => {
        log("end of timer")
    
        if(this.lastPlayer != null) {
            this.lastPlayer.pay(this.bid).then(function() {
                this.property.owner = this.lastPlayer
            }).catch(this.lastPlayer.bankrupcy)

            log("End of auction :", this)
            io.emit("endAuction", this.lastPlayer.getId(), plateau.indexOf(this.property), this.bid)
            io.emit("changeOwner", this.lastPlayer.getId(), plateau.indexOf(this.property), true)
            console.log("test")
        } else {
            io.emit("endAuction", null, plateau.indexOf(this.property), 0)
        }
    
        Auction.prototype.currentAuction = null
    })
}

Auction.prototype.setIo = function(server) {io = server}

module.exports = Auction