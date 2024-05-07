const http = new XMLHttpRequest()

let taillePlateau
let plateauPions
let plateau
let cases = Array()
let casesPlateau = Array()

let playerList = Array()
let numPlayer = -1

function initTaillePlateau() {
    if(window.innerHeight < window.innerWidth) {
        taillePlateau = parseInt(window.innerHeight/1.01)
    } else {
        taillePlateau = parseInt(window.innerWidth/1.01)
    }
    plateau = document.getElementById("plateau");
    plateau.style.height = taillePlateau + "px"
    plateau.style.width = taillePlateau + "px"
}

function creerPlateau() {
    initTaillePlateau()

    let i = 0;

    //ligne sud
    for(j = 0 ; j < 10; j++) {
        //Creation des cases du plateau
        let casePlateau = document.createElement("div");
        casePlateau.classList.add("case")
        casePlateau.classList.add("sud")
        casePlateau.id = "case-" + i

        casePlateau.style.gridArea = " -1 / " + (-j-1) + " / -2 / " + (-j-2) 
        // casePlateau.style.gridRow = "-1 / -2"
        // casePlateau.style.gridColumn = (-j-1) + " / " + (-j-2)
        
        //creation des div pour les pions
        
        let casePlateauPion = document.createElement("div")
        casePlateauPion.classList.add("casePion")
        
        casePlateau.appendChild(casePlateauPion)
        
        plateau.appendChild(casePlateau)
        cases.push(casePlateau)
        
        i++;

    }

    //ligne ouest
    for(j = 0 ; j < 10 ; j++) {
        let casePlateau = document.createElement("div");
        casePlateau.classList.add("case")
        casePlateau.classList.add("ouest")
        casePlateau.id = "case-" + i

        casePlateau.style.gridArea = (-j-1) + " / 1 / " + (-j-2) + " / 2"
        // casePlateau.style.gridColumn = "0 / 1"
        // casePlateau.style.gridRow = (-j-1) + " / " + (-j-2)
        
        
        //creation des div pour les pions
        
        let casePlateauPion = document.createElement("div")
        casePlateauPion.classList.add("casePion")
        
        casePlateau.appendChild(casePlateauPion)
        
        plateau.appendChild(casePlateau)
        cases.push(casePlateau)
        i++;
    }
    
    //ligne nord
    for(j = 0 ; j < 10 ; j++) {
        let casePlateau = document.createElement("div");
        casePlateau.classList.add("case")
        casePlateau.classList.add("nord")
        casePlateau.id = "case-" + i

        casePlateau.style.gridArea = " 0 / " + (j+1) + " / 1 / " + (j+2) 
        // casePlateau.style.gridRow = "0 / 1"
        // casePlateau.style.gridColumn = (j+1) + " / " + (j+2)
        
        
        //creation des div pour les pions
        
        let casePlateauPion = document.createElement("div")
        casePlateauPion.classList.add("casePion")
        
        casePlateau.appendChild(casePlateauPion)
        
        plateau.appendChild(casePlateau)
        cases.push(casePlateau)
        i++;
    }

    //ligne est
    for(j = 0 ; j < 10 ; j++) {
        let casePlateau = document.createElement("div");
        casePlateau.classList.add("case")
        casePlateau.classList.add("est")
        casePlateau.id = "case-" + i

        casePlateau.style.gridArea = (j+1) + " / -1 / " + (j+2) + " / -2"
        // casePlateau.style.gridColumn = "-1 / -2"
        // casePlateau.style.gridRow = (j+1) + " / " + (j+2)
        
        
        //creation du div pour les pions
        
        let casePlateauPion = document.createElement("div")
        casePlateauPion.classList.add("casePion")
        
        casePlateau.appendChild(casePlateauPion)
        
        plateau.appendChild(casePlateau)
        cases.push(casePlateau)
        i++;
    }

    cases[0].classList.add("coin")
    cases[10].classList.add("coin")
    cases[20].classList.add("coin")
    cases[30].classList.add("coin")

    Array.from(document.getElementsByClassName("coin")).forEach(coin => {
        coin.classList.remove("ouest")
        coin.classList.remove("nord")
        coin.classList.remove("sud")
        coin.classList.remove("est")
    });

    Array.from(document.getElementsByClassName("pion")).forEach(pion => {
        document.querySelector("#case-0 .casePion").appendChild(pion)
    })
}

function applicationDonnees() {
    for(let i = 0 ; i < casesPlateau.length ; i++) {
        switch(casesPlateau[i].type) {
            case "property":
                let headProperty = document.createElement("div")
                let bodyProperty = document.createElement("div")
                let propertyName = document.createElement("h1")
                let propertyCost = document.createElement("h2")
        
                headProperty.style.backgroundColor = casesPlateau[i].color
                headProperty.classList.add("headerCase")

                bodyProperty.classList.add("bodyCase")
                bodyProperty.appendChild(propertyName)
                bodyProperty.appendChild(propertyCost)

                propertyName.innerText = casesPlateau[i].name
                propertyCost.innerText = casesPlateau[i].cost + "€"

                cases[i].appendChild(headProperty)
                cases[i].appendChild(bodyProperty)
                cases[i].classList.add("property")
                cases[i].dataset.color = casesPlateau[i].color

                cases[i].addEventListener("click", function() {
                    if(cases[i].classList.contains("canBuyBuild")) {
                        console.log("buy build")
                        socket.emit("buyBuild", i)
                    } else if(cases[i].classList.contains("canSellBuild")) {
                        console.log("sell build")
                        socket.emit("sellBuild", i)
                    } else {
                        afficherCarte(i)
                    }
                })

                
                break
            
            case "station":
                let bodyStation = document.createElement("div")
                let stationName = document.createElement("h1")
                let stationCost = document.createElement("h2")
                let stationImg = document.createElement("img")
                
                stationImg.src = "/station.png"
        
                
                bodyStation.classList.add("bodyCase")

                bodyStation.appendChild(stationName)
                bodyStation.appendChild(stationImg)
                bodyStation.appendChild(stationCost)

                stationName.innerText = casesPlateau[i].name
                stationCost.innerText = "200€"


                cases[i].appendChild(bodyStation)
                cases[i].classList.add("station")

                cases[i].addEventListener("click", function() {
                    afficherCarte(i)
                })

                
                break
            case "company":
                let bodyCompany = document.createElement("div")
                let companyName = document.createElement("h1")
                let companyCost = document.createElement("h2")
                let companyImg = document.createElement("img")

                bodyCompany.classList.add("bodyCase")

                companyName.innerText = casesPlateau[i].name
                companyCost.innerText = "150€"
                companyImg.src = casesPlateau[i].src

                bodyCompany.appendChild(companyName)
                bodyCompany.appendChild(companyImg)
                bodyCompany.appendChild(companyCost)

                cases[i].appendChild(bodyCompany)
                cases[i].classList.add("company")

                cases[i].addEventListener("click", function() {
                    afficherCarte(i)
                })

                
                break
            
            case "chance":
                let bodyChance = document.createElement("div")
                let chanceName = document.createElement("h1")
                let chanceImg = document.createElement("img")

                bodyChance.classList.add("bodyCase")

                chanceName.innerText = "Chance"
                chanceImg.src = "/chance.png"

                bodyChance.appendChild(chanceName)
                bodyChance.appendChild(chanceImg)
                bodyChance.appendChild(document.createElement("div"))

                cases[i].appendChild(bodyChance)
                cases[i].classList.add("chance")
                break
            
            case "community":
                let bodyCommunity = document.createElement("div")
                let communityName = document.createElement("h1")
                let communityImg = document.createElement("img")

                bodyCommunity.classList.add("bodyCase")

                communityName.innerText = "Caisse de communauté"
                communityImg.src = "/community-chest.png"

                bodyCommunity.appendChild(communityName)
                bodyCommunity.appendChild(communityImg)
                bodyCommunity.appendChild(document.createElement("div"))

                cases[i].appendChild(bodyCommunity)
                cases[i].classList.add("community")
                break

            case "tax":
                let bodyTax = document.createElement("div")
                let taxName = document.createElement("h1")
                let taxCost = document.createElement("h2")

                bodyTax.classList.add("bodyCase")

                taxName.innerText = casesPlateau[i].name
                taxCost.innerText = casesPlateau[i].cost + "€"

                bodyTax.appendChild(taxName)
                bodyTax.appendChild(taxCost)

                cases[i].appendChild(bodyTax)
                cases[i].classList.add("tax")
                break

            case "start":
                let bodyStart = document.createElement("div")
                let startImg = document.createElement("img")

                startImg.src = "/depart.png"

                bodyStart.appendChild(startImg)
                bodyStart.classList.add("bodyCase")

                cases[i].appendChild(bodyStart)
                break
            
            case "jail":
                let bodyJail = document.createElement("div")
                let jailImg = document.createElement("img")

                jailImg.src = "/jail.png"

                bodyJail.appendChild(jailImg)
                bodyJail.classList.add("bodyCase")

                cases[i].appendChild(bodyJail)
                break

            case "parc":
                let bodyParc = document.createElement("div")
                let parcImg = document.createElement("img")

                parcImg.src = "/parc-gratuit.png"

                bodyParc.appendChild(parcImg)
                bodyParc.classList.add("bodyCase")

                cases[i].appendChild(bodyParc)
                break

            case "gotojail":
                let bodyGotojail = document.createElement("div")
                let gotojailImg = document.createElement("img")

                gotojailImg.src = "/officer.png"

                bodyGotojail.appendChild(gotojailImg)
                bodyGotojail.classList.add("bodyCase")

                cases[i].appendChild(bodyGotojail)
                break
        }
    }
}

function checkSubmit(e) { //Pour la validation du pseudo avec la touche entrée
    console.log(e)
    if(e && e.keyCode == 13) {
       enterPseudo()
    }
 }

document.addEventListener("DOMContentLoaded", function() {
    //création du plateau et des cases
    creerPlateau()

    //Récupération des données du plateau
    http.open("GET", "/plateau.json");
    http.send();
    http.responseType = "json";
    http.onload = () => {
        if (http.readyState == 4 && http.status == 200) {
            //application des données aux cases
            casesPlateau = http.response
            applicationDonnees()
        } else {
            console.log(`Error: ${http.status}`);
        }
    };
})

window.onresize = initTaillePlateau;