var net = require('net')
var fs = require('fs')
var config = require('./sconfig.json')
var utils = require('./utils')

module.exports = function(peer) {
  var server = net.createServer()
  server.on('listening', function(){
  })

  var files = {}

  server.on('connection', function(socket){

    socket.on('data', function(buffer){
      var msg = buffer.toString().split(' ')
      var command = msg[0]
      var filename = segmentInfo[1]
      var segmentInfo = msg[2].split(':')
      var start = Number(segmentInfo[1])
      var end = Number(segmentInfo[2])
      var segment = utils.createSegment(start, end)

      //cache file requested if not already cached
      files[filename] = files[filename] || fs.readFileSync('./' + peer.name + '/' + filename)

      //terminate if segment requested is too large
      if(segment.size > config.segmentSize) {
        socket.end()
        return
      }

      if(command === 'GET') {
        //grab file segment requested and send
        var fileSegment = files[filename].slice(start, end + 1)
        socket.write(fileSegment)
      }

    })

    socket.on('end', socket.end)
  })

  return server 
}