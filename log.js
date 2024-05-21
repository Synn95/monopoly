const fs = require("fs");

function initiateLog() {
    if(fs.existsSync("logs/log-latest.txt")) {
        let data = fs.readFileSync("logs/log.txt", 'utf8')
        let previousDate = data.slice(0, data.indexOf("\n"))
        console.log(previousDate)
        fs.renameSync("logs/log-latest.txt", "logs/log-" + previousDate + ".txt")
        let date = new Date()
        let dateString = date.toString()
        fs.writeFileSync("logs/log-latest.txt", dateString.slice(0, dateString.indexOf(" GMT")).replaceAll(" ", "-").replaceAll(":","-") + "\n")
    }
}

function log() {
    let date = new Date()
    let timecode = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    let string = "[" + timecode + "] "

    Array.from(arguments).forEach(arg => {
        if(typeof(arg) == "string") {
            string += arg + " "
        } else {
            string += arg.toString() + "\n\t "
        }
    });
    console.log(string)

    fs.appendFileSync("logs/log-latest.txt", string + "\n")
}

initiateLog()

module.exports = log