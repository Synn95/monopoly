const plateauJson = require("./plateau.json")
const {Property, Tax, Jail, Parc} = require("./classes.js")
const Player = require("./run.js")
const plateau = require("./plateau.js")

const communityCards = [
    {
       "description": "Avancer jusqu'à la case Départ",
       "action": function(player) {
            player.goTo(0)
            player.actionCase(plateau[0])
       }
    },
    {
        "description": "Rendez-vous à la case Départ, mais ne recevez pas votre salaire.",
        "action": function(player) {
            player.idCase = 0
            return "start"
        }
    },
    {
        "description": "Erreur de la banque en votre faveur. Recevez 200€",
        "action": function(player) {
            player.earn(200)
        }
    },
    {
        "description": "Payez la note du médecin : 50€",
        "action": function(player) {
            player.pay(50)
        }
    },
    {
        "description": "Payez l'assurance de votre voiture : 50€",
        "action": function(player) {
            player.pay(50)
        }
    },
    {
        "description": "Les frais de scolarité sont dus. Payez 50€",
        "action": function(player) {
            player.pay(50)
        }
    },
    {
        "description": "Payez à l'hôpital : 100€",
        "action": function(player) {
            player.pay(100)
        }
    },
    {
        "description": "La vente de votre stock vous rapporte 50€",
        "action": function(player) {
            player.earn(50)
        }
    },
    {
        "description": "Vous avez gagné le prix de mots croisés : 100€",
        "action": function(player) {
            player.earn(100)
        }
    },
    {
        "description": "Vous avez gagné le deuxième prix dans un concours de beauté, recevez 10€",
        "action": function(player) {
            player.earn(10)
        }
    },
    {
        "description": "Vous êtes libéré de prison. Cette carte peut être conservée jusqu’à ce qu’elle soit utilisée ou vendue.",
        "action": function(player) {
            player.nbFreePrisonCards += 1
            return "addNbFreePrisonCard"
        }
    },
    {
        "description": "Aller en prison. Rendez-vous directement à la prison. Ne franchissez pas par la case départ, ne touchez pas 200€",
        "action": function(player) {
            Jail.prototype.sendToJail(player)
            return "gotojail"
        }
    },
    {
        "description": "Vous héritez de 100€",
        "action": function(player) {
            player.earn(100)
        }
    },
    {
        "description": "Vous êtes imposé pour les réparations de voirie : 40€ par maison, 115€ par hôtel",
        "action": function(player) {
            let totalHouses = 0
            let totalHotels = 0
            player.deck.forEach(prop => {
                if(prop.type == "property") {
                    if(prop.nbBuilds < 5) {
                        totalHouses += prop.nbBuilds
                    } else {
                        totalHotels += 1
                    }
                }
            });

            player.pay(totalHouses * 40 + totalHotels * 115)
        }
    },
    {
        "description": "Vous avez été élue président du comité. Payez à chaque joueur 50€",
        "action": function(player) {
            player.pay(50 * player.playerList.length)
            player.playerList.forEach(element => {
                element.earn(50)
            });
        }
    },
    {
        "description": "C'est votre anniversaire ! Recevez 10€ de chaque joueur",
        "action": function(player) {
            player.playerList.forEach(element => {
                element.pay(10)
            });

            player.earn(player.playerList.length * 10)
        }
    }
]

module.exports = communityCards