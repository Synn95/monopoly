const Player = require("./Player.js")
const plateau = require("./plateau.js")
const log = require("./log.js")
const fs = require("fs")

async function save(saveNum) {
    while(true) {
        await new Promise((resolve) => setTimeout(resolve, 120000))

        log("Saving game...")

        let savePlayerList = new Array()
        let plateauSave = new Array()
        Player.prototype.playerList().forEach(player => {
            savePlayerList.push({
                "name": player.name,
                "money": player.money,
                "lastScore": player.lastScore,
                "numberOfDoubles": player.numberOfDoubles,
                "idCase": player.idCase,
                "nbFreePrisonCards": player.nbFreePrisonCards,
                "isJailed": player.isJailed,
                "currentAction": player.currentAction,
                "hasRolledDices": player.hasRolledDices,
                "isBankrupt": player.isBankrupt
            })
        });

        plateau.forEach(aCase => {
            if(aCase.type == "property" || aCase.type == "station" || aCase.type == "company") {
                plateauSave.push({
                    "idCase": plateau.indexOf(aCase),
                    "nbBuilds": aCase.nbBuilds,
                    "canBuild": aCase.canBuild,
                    "owner": Player.prototype.playerList().indexOf(aCase.owner),
                    "locator": Player.prototype.playerList().indexOf(aCase.locator),
                })
            }
        })

        let saveJson = {
            "date": Date.now(),
            "activePlayer": Player.prototype.activePlayer,
            "players": savePlayerList,
            "plateau": plateauSave
        }
        fs.writeFileSync("saves/save"+saveNum+".json", JSON.stringify(saveJson))
        log("Game saved")
    }
}

module.exports = save