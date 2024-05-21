const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const host = '0.0.0.0';
const port = 8000;

const log = require("./log.js")
const ioConnection = require("./events.js")
const Player = require("./Player.js");
const Auction = require("./Auction.js");

const plateau = require("./plateau.js")


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


// ------------Scenario de test--------------
let test = new Player(null, "Nathan", 0)
let testPropArray = [1,3,5,6,8,9,11,12,13,14,15,16,18,19,21,23,24,25,26,27,28,29,31,32,34,35,37,39]
testPropArray.forEach(element => {
    log(plateau[element])

    if(plateau[element].type == "property") {
        plateau[element].nbBuilds = 5
    }
    plateau[element].owner = test
    test.deck.push(plateau[element])
});
log(test)




const server = http.createServer(requestListener);
const io = new Server(server)


server.listen(port, host, () => {
    log(`Server is running on http://${host}:${port}`);
});


io.on("connection", (socket) => {
    Auction.prototype.setIo(io)
    Player.prototype.setIo(io)
    ioConnection(socket, io)
})