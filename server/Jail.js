let jailIdCase = -1
let jailedList = new Array()

function Jail(idCase) {
    this.type = "jail"
    jailIdCase = idCase
}

Jail.prototype.toString = function() {
    return "Jail = " + this.name + " ; id: " + this.idCase
}

Jail.prototype.sendToJail = function(player) {
    if(jailIdCase != -1) {
        player.idCase = jailIdCase
        player.isJailed = 3
        jailedList.push(player)
    }
}

Jail.prototype.getJailId = function() {return jailIdCase}

module.exports = Jail