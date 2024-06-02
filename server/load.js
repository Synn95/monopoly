const Player = require("./Player.js")
const plateau = require("./plateau.js")
const log = require("./log.js")

function load(num) {
    let save = require("./saves/save"+num+".json")

    Player.prototype.activePlayer = save.activePlayer
    save.players.forEach(player => {
        let p = new Player(null, player.name, Player.prototype.playerList().length)

        p.money = player.money
        p.lastScore = player.lastScore
        p.numberOfDoubles = player.numberOfDoubles
        p.idCase = player.idCase
        p.nbFreePrisonCards = player.nbFreePrisonCards
        p.isJailed = player.isJailed
        p.currentAction = player.currentAction
        p.hasRolledDices = player.hasRolledDices
        p.isBankrupt = player.isBankrupt
    });

    save.plateau.forEach(aCase => {
        plateau[aCase.idCase].nbBuilds = aCase.nbBuilds
        plateau[aCase.idCase].canBuild = aCase.canBuild 

        if(aCase.owner == -1) {
            plateau[aCase.idCase].owner = null
        } else {
            plateau[aCase.idCase].owner = Player.prototype.getPlayerById(aCase.owner)
            Player.prototype.getPlayerById(aCase.owner).deck.push(plateau[aCase.idCase])
        }
        if(aCase.locator == -1) {
            plateau[aCase.idCase].locator = null
        } else {
            plateau[aCase.idCase].locator = Player.prototype.getPlayerById(aCase.locator)
        }
    })
}


module.exports = load