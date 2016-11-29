var path = require('path')
var fs = require('fs')
var net = require('net')
var config = require('./sconfig.json')

var port = config.trackerPort
var ip = config.trackerUrl

module.exports = {

  connect: function() {
    this.socket.connect(port, ip)

    this.socket.on('end', this.socket.end)
  },

  requestList: function() {
    this.connect()    
    this.socket.once('data', function(data){
      console.log(data.toString())
      //parse message
    })

    this.socket.write("REQ LIST\n")
  },

  getTracker: function(file) {
    this.connect()
    this.socket.once('data', function(data){
      var tracker = data.slice(14, data.length - 17 - file.length).toString()
      console.log(tracker)
    })

    this.socket.write("GET " + file + ".track\n")
  },

  updateTracker: function(update) {
    this.connect()
    this.socket.once('data', function(data) {
      console.log("Updated")
    })

    this.socket.write("updatetracker " + update + "\n")
  },

  createTracker: function(tracker) {
    this.connect()
    this.socket.once('data', function(data) {
      console.log("created")
    })

    this.socket.write("createtracker " + tracker+ "\n")
  }

}