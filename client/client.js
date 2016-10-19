var path = require('path')
var fs = require('fs')
var net = require('net')
var readline = require('readline')
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var sock = new net.Socket()
var currentAction, filename


sock.connect(4321, "rc13xcs213.managed.mst.edu", function() {
    console.log("New socket")

    sock.on('data', function(data){
      var msg = data.toString("utf8")

      switch(currentAction){
        case "REQ":
          console.log(msg)
          break;
        case "GET":
          fs.writeFileSync('./files/' + filename,  data.slice(14, data.length - 14).toString("utf8"))
          console.log("Saved file")
          break;
        case "update":
          console.log("Updated")
          break;
        case "create":
          console.log("Created")
          break;
      }
    })

})

function requestList() {
  currentAction = "REQ"
  sock.write("REQ LIST")
}

function getFile(file) {
  filename = file
  currentAction = "GET"
  sock.write("GET " + file)
}

function updateTracker(data) {
  currentAction = "update"
  sock.write("updatetracker " + data)
}

function createTracker(data) {
  currentAction = "create"
  sock.write("createtracker " + data)
}

rl.question(" 1) REQ LIST\n 2) GET FILE\n 3) UPDATE TRACKER\n 4) CREATE TRACKER\n", function(choice) {
  switch(Number(choice)){
    case 1:
      requestList()
      rl.close()
      break;
    case 2:
      rl.question("Type filename: ", function(file) { getFile(file); rl.close() })
      break;
    case 3:
      rl.question("Type info: ", function(data){ updateTracker(updateTracker(data)); rl.close() })
    case 4:
      rl.question("Type info: ", function(data){ createTracker(createTracker(data)); rl.close() })
      break;
    default:
      console.log("Goodbye")
      rl.close()
  }
})