const {Property, Tax, Jail, Parc} = require("./classes.js")

function initPlateau() {
    let plateauJson = require("./plateau.json")
    let arrayRet = new Array()

    plateauJson.forEach(casePlateau => {
        try {

            switch(casePlateau.type) {
                case "property":
                    arrayRet.push(new Property(casePlateau))
                    break
                case "station":
                    arrayRet.push(new Property(casePlateau))
                    break
                case "company":
                    arrayRet.push(new Property(casePlateau))
                    break
                case "start":
                    arrayRet.push(casePlateau)
                    break
                case "tax":
                    arrayRet.push(new Tax(casePlateau.name, casePlateau.cost))
                    break
                case "community":
                    arrayRet.push(casePlateau)
                    break
                case "chance":
                    arrayRet.push(casePlateau)
                    break
                case "jail":
                    arrayRet.push(new Jail(arrayRet.length))
                    break
                case "parc":
                    arrayRet.push(new Parc(arrayRet.length))
                    break
                case "gotojail":
                    arrayRet.push(casePlateau)
                    
                    break
            }
        } catch(e) {
            console.log(e)
        }
    });
    
    return arrayRet
}

const plateau = initPlateau();

module.exports = plateau