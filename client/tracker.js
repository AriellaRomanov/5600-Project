var path = require('path')
var fs = require('fs')
var net = require('net')

module.exports = {

  socket: new net.Socket(),

  connect: function(port, ip, cb) {
    this.socket.connect(port, ip, cb)

    this.socket.on('end', function() { console.log('Tracker socket closing')})
  },

  requestList: function() {
    
    this.socket.once('data', function(data){
      console.log(data.toString())
      //parse message
    })

    this.socket.write("REQ LIST\n")
  },

  getFile: function(file) {

    this.socket.once('data', function(data){
      fs.writeFileSync('./files/' + file,  data.slice(14, data.length - 17 - file.length).toString("utf8"))
    })

    this.socket.write("GET " + file + ".track\n")
  },

  updateTracker: function(update) {

    this.socket.once('data', function(data) {
      console.log("Updated")
    })

    this.socket.write("updatetracker " + update + "\n")
  },

  createTracker: function(tracker) {

    this.socket.once('data', function(data) {
      console.log("created")
    })

    this.socket.write("createtracker " + tracker+ "\n")
  }

}