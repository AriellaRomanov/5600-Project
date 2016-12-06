var utils = require('./utils')
var path = require('path')
var fs = require('fs')
var net = require('net')
var config = require('./sconfig.json')

var port = config.trackerPort
var ip = config.trackerUrl

module.exports = {

  connect: function() {
    this.socket = new net.Socket()

    this.socket.on('end', this.socket.end)

    this.socket.on('error', console.log)
    
    this.socket.connect(port, ip)
  },

  requestList: function(cb) {
    this.connect()    

    this.socket.once('data', function(data){
      var text = data.toString()
      var lines = text.split('\n')
      lines = text.split('\n').slice(1, lines.length - 2)
      var list = utils.parseList(lines)
      cb(list)
    })

    this.socket.write("REQ LIST\n")

  },

  getTracker: function(file, cb) {
    this.connect()

    this.socket.once('data', function(data){
      var text = data.toString()
      var lines = text.split('\n')
      lines = text.split('\n').slice(1, lines.length - 2)
      var tracker = utils.parseTracker(lines)
      utils.splitToSegments(tracker)
      cb(tracker)
    })

    this.socket.write("GET " + file + ".track\n")
  },

  updateTracker: function(update, cb) {
    this.connect()
    
    this.socket.once('data', function(data) {
      cb(data.toString())
    })

    this.socket.write("updatetracker " + update + "\n")
  },

  createTracker: function(tracker, cb) {
    this.connect()

    this.socket.once('data', function(data) {
      cb(data.toString())
    })

    this.socket.write("createtracker " + tracker+ "\n")
  }

}