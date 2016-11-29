var net = require('net')
var fs = require('fs')
var server = net.createServer()

server.on('listening', function(){
  console.log('Waiting for peers to connect')
  console.log('listening on port',
               server.address().port)
})

server.on('connection', function(socket){
  console.log('connection received')

  socket.on('data', function(buffer){
    var command = buffer.toString('utf8', 0, 3)
    var segmentInfo = buffer.toString('utf8', 4, buffer.length).split(':')
    var filename = segmentInfo[0]
    var start = Number(segmentInfo[1])
    var end = Number(segmentInfo[2])
    console.log(buffer.toString())

    if(command === 'GET') {
      socket.write('GET valid')
      console.log('piping', filename)
      var file = fs.createReadStream(filename, { start: start, end: end })
      file.on('end', function(){
        socket.end()
      })
      file.pipe(socket)
    } else {
      socket.write('GET invalid')
    }
  })
})

module.exports = server