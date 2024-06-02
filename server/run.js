const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const log = require("./log.js")
const ioConnection = require("./events.js")
const save = require("./save.js")
const load = require("./load.js")
const Player = require("./Player.js")
const Auction = require("./Auction.js")

const runtimeId = Math.floor(Math.random()*1000000)
let numberOfPlayers = 0

/*
function getPropertyByIdCase(id) {
    let res
    let i = 0
    while(id != plateau.case) {
        i++
    }

    return i
}
*/

let saveNum = -1

function endGame() {
    io.emit("gameOver")
    log("Game is over")
    fs.rm("saves/save"+saveNum+".json")
    process.exit(0)
}



const requestListener = function (req, res) {
    // log(req.url)
    // log(req.rawHeaders.slice(0,4))
    let fileContent;
    if(req.url == "/") {
        res.writeHead(301, {
            Location: "./index.html"
          }).end();
    } else {
        try {
            const data = fs.readFileSync(__dirname.slice(0, -6) + "client" + req.url);
            fileContent = data;
    
            switch(req.url.split(".")[1]) {
                case "html":
                    res.setHeader("Content-Type", "text/html");
                    break;
                case "css":
                    res.setHeader("Content-Type", "text/css");
                    break;
                case "js":
                    res.setHeader("Content-Type", " application/javascript");
                    break;
                case "png":
                    res.setHeader("Content-Type", " image/png");
                    break;
                case "jpg":
                    res.setHeader("Content-Type", " image/jpeg");
                    break;
                case "json":
                    res.setHeader("Content-Type", "application/json");
                    break;
                default:
                    res.setHeader("Content-Type", "text/plain");
            }
    
            res.writeHead(200);
            res.end(fileContent);
        } catch(err) {
            log(err);
            res.setHeader("Content-Type", "text/html");
            res.writeHead(404);
            res.end("Page not found");
        }
    }
}


const server = http.createServer(requestListener);
const io = new Server(server)

if(!fs.existsSync("./saves")) {
    fs.mkdirSync("saves")
}
let saveFiles = fs.readdirSync("saves")
if(saveFiles.length > 0) {
    console.log("Please choose a save file :")
    console.log("0 -> New Game")
    saveFiles.forEach(savePath => {
        let save = require("./saves/"+ savePath)
        let date = new Date(save.date)
        console.log(savePath.slice(4,5) + " -> " + date.toUTCString())
    });


    let answer = "-1"
    while(Number.parseInt(answer) < 0 || Number.parseInt(answer) > saveFiles.length) {
        answer = prompt()
    }

    if(answer == 0) {
        log("Loading new save")
        save(saveFiles.length)
        saveNum = saveFiles.length
    } else {
        log("Loading save n°" + answer-1)
        numberOfPlayers = load(answer-1)
        save(answer-1)
        saveNum = answer-1
    }
} else {
    log("Loading new save")
    save(0)
    saveNum = 0
}

while(numberOfPlayers < 2 || numberOfPlayers > 4) {
    numberOfPlayers = prompt("How many players will play ? (Choose a number between 2 and 4) ")
}

server.listen(port, host, () => {
    log(`Server is running on http://${host}:${port}`);
});


io.on("connection", (socket) => {
    Auction.prototype.setIo(io)
    Player.prototype.setIo(io)

    socket.emit("runtimeId", runtimeId)
    ioConnection(socket, io, numberOfPlayers)
})


module.exports = endGame