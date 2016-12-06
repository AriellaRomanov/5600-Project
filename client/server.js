var net = require('net')
var fs = require('fs')
var config = require('./sconfig.json')

module.exports = function(peer) {
  var server = net.createServer()
  server.on('listening', function(){
  })

  var files = {}

  server.on('connection', function(socket){
    // console.log('connection received')

    socket.on('data', function(buffer){
      var command = buffer.toString('utf8', 0, 3)
      var segmentInfo = buffer.toString('utf8', 4, buffer.length).split(':')
      var filename = segmentInfo[0]
      var start = Number(segmentInfo[1])
      var end = Number(segmentInfo[2])
      var segmentSize = end - start - 1
      // console.log(buffer.toString())

      if(!files[filename]) {
        files[filename] = fs.readFileSync('./' + peer.name + '/' + filename)
      }

      if(command === 'GET' && segmentSize <= config.segmentSize) {
        var file = files[filename].slice(start, end + 1)
        socket.write(file)

      }
      socket.end()
    })

    socket.on('end', socket.end)
  })

  return server 
}