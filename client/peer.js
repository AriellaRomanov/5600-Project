var Socket = require('net').Socket
var crypto = require('crypto')
var config = require('./sconfig.json')
var tracker = require('./tracker')
var utils = require('./utils')
var fs = require('fs')
var path = require('path')

var numPeers = 0
var socketsOpen = 0
setInterval(function(){
  console.log(socketsOpen, 'peer sockets open')
}, 30000)
module.exports = function(){
  return {
    name: 'Peer' + ++numPeers,

    fileLocation: function(filename) {
      return path.join('./', this.name, filename)
    },

    hasFile: function(filename) {
      return fs.existsSync(this.fileLocation(filename))
    },

    //pick random segment to download from a peer
    pickRandomSegment: function(gaps, peer) {
      //upper bound for index
      var upperBound = gaps.length - 1
      var i = Math.floor(Math.random() * upperBound) + 1
      var gap = gaps[i]

      return utils.chooseRandomSegment(gap, peer)
    },

    getFile: function(tracker, cb){
      var me = this
      //keep track of gaps in file (segments we currently need)
      var gaps = [{
        start: 0,
        end: tracker.filesize - 1
      }]

      var segments = []
      var socket = new Socket()
      var peer = tracker.peers[0]
      var filename = tracker.filename
      var filesize = tracker.filesize

      socket.on('connect', function(){
        //choose random segment to request
        var segment = utils.chooseRandomSegment(gap[0])
        //request it
        socket.write('GET ' + filename + ' ' + segment.start + ':' + segment.end)
      })

      socket.on('data', function(buffer){
        var msg = buffer.toString().split(config.delimiter)
        var segmentInfo = msg[0].split(':')
        var start = segmentInfo[0]
        var end = segmentInfo[1]
        var segment = utils.createSegment(start, end)
        segment.contents = msg[1]
        segments.push(segment)
        gaps = utils.recalculateGaps(gaps, segment, filesize)

        if(gaps.length > 0) {
          var nextSegment = me.pickRandomSegment(gaps, peer)
          socket.write('GET ' + filename + ' ' + nextSegment.start + ':' + nextSegment.end)
        } else {
          socket.end()
          me.stitchSegments(tracker, segments, cb)
        }
      })

    },

    stitchSegments: function(tracker, segments, cb) {
      //sort segments so they stitch together properly
      var segments = segments.sort(function(a, b) {
        if(a.start < b.start) {
          return -1
        } else {
          return 1
        }
      })

      var file = segments.map(function(segment){ return segment.contents }).join('')
      //generate md5 of combined data
      var md5 = crypto.createHash('md5').update(file).digest('hex')
      //compare to md5 provided by tracker
      if(md5 === tracker.md5) {
        //write to file if they match
        console.log(this.name, 'downloaded file', tracker.filename)
        var dir = './' + this.name
        if(!fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        fs.writeFile(dir + '/' + tracker.filename, file, cb)
      } else {
        console.log(this.name, 'md5 of', tracker.filename, 'did not match')
      }
    },

    end: function() {
      console.log(this.name + 'terminating')
    },

    connect: function(cb){
      var peer = this
      var port = config[peer.name + "Port"]
      this.server = require('./server')(peer)

      this.server.listen(port, function(){
        var files = fs.readdirSync(peer.name)
        var count = 0
        files.forEach(function(filename){
          peer.createTracker(filename, function(){
            count++
            console.log(peer.name, 'tracker created for', filename)
            if(count === files.length) cb()
          })
        })
        if(files.length === 0) cb()
      })
    },

    createTracker: function(filename, cb){
       var location = './' + this.name + '/' + filename
       var ip = config.peerIp
       var port = this.server.address().port
       var md5 = crypto.createHash('md5')
       var size = 0
       var stream = fs.createReadStream(location)

       stream.on('data', function(data) {
        md5.update(data)
        size += data.length
       })

       stream.on('end', function(){
         var command = filename + " " + size + " description " + md5.digest('hex') + " " + ip + " " + port
         tracker.createTracker(command, cb)
       })
    },

    getList: function(cb) {
      console.log(this.name, 'requesting tracker list')
      tracker.requestList(cb)
    },

    getTracker: function(name, cb) {
      console.log(this.name, 'getting tracker for', name)
      tracker.getTracker(name, cb)
    }
  }
}