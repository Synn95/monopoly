const Property = require("./Property.js")
const Tax = require("./Tax.js")
const Jail = require("./Jail.js")
const plateau = require("./plateau.js")
const log = require("./log.js")


const chance = [
    {
        "description": function() {
            return "Avancer jusqu'à la case Départ"
        },
        "action": function(player) {
            player.goTo(0)
            player.actionCase(plateau[0])
        }
    },
    {
        "description": function() {
            return "Avancez jusqu'à la case " + Property.prototype.getRandomProperty() + ". Si elle appartient déjà à quelqu'un, payer deux fois le loyer"
        },
        "action": function(player) {
            let property = plateau[Property.prototype.getLastRandomPropertyId()]
            log(property)
            player.goTo(Property.prototype.getLastRandomPropertyId())

            if(property.owner === null) {
                player.buy(property, 0)
            } else if(property.owner != player) {
                player.pay(property.rent()*2)
                property.owner.earn(property.rent()*2)
            }
        }
    },
    {
        "description": function() {
            return "Rendez-vous à " + Property.prototype.getRandomProperty() + ". Si vous passez par la case Départ, recevez 200 $"
        },
        "action": function(player) {
            let propId = Property.prototype.getLastRandomPropertyId()
            player.goTo(propId)
            player.actionCase(plateau[propId])
        }
    },
    {
        "description": function() {
            return "Avancez jusqu'à la case " + Tax.prototype.getRandomTaxCase().name + ". Si vous passez par la case Départ, recevez 200€"
        },            
        "action": function(player) {
            let taxId = Tax.prototype.getLastRandomTaxId()
            player.goTo(taxId)
            player.actionCase(plateau[taxId])
        }
    },
    {
        "description": function() {
            return "Payez les frais de scolarité : 50€"
        },
        "action": function(player) {
            player.pay(50)
        }
    },
    {
        "description": function() {
            return "Allez en prison. Ne franchissez pas la case Départ. Ne recevez pas 200€"
        },
        "action": function(player) {
            Jail.prototype.sendToJail(player)
            return "gotojail"
        }
    },
    {
        "description": function() {
            return "Vous avez gagné le prix de mots croisés : 100€"
        },
        "action": function(player) {
            player.earn(100)
        }
    },
    {
        "description": function() { 
            return "Payez à l'hôpital : 100 $"
        },
        "action": function(player) {
            player.pay(100)
        }
    }
]

module.exports = chance