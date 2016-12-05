var Socket = require('net').Socket
var crypto = require('crypto')
var fs = require('fs')

var numPeers = 0

module.exports = function(){
  return {
    name: 'Peer' + ++numPeers,

    getFile: function(tracker){
      var segments = tracker.segments
      //keep track of how many segments are completed
      tracker.completedSegments = 0

      var stitchSegments = this.stitchSegments.bind(this)

      segments.forEach(function(segment) {
        //create a socket to retrieve this segment
        segment.socket = new Socket()
        //create array to store chunks received over tcp
        segment.chunks = []

        //what to do when socket connects
        segment.socket.on('connect', function(){
          var socket = segment.socket
          //request segment
          socket.write('GET ' + tracker.filename + ':' + segment.start + ':' + segment.end)
          //define what to do when server responds
          socket.once('data', function(data){
            //response from the peers server
            var response = data.toString('utf8', 4, data.length) 
            //make sure response is valid
            if(response === 'valid') {
              //add any new data from server to chunks
              socket.on('data', function(data){
                segment.chunks.push(data)
              })
            } else {
              //close socket if error
              socket.end()
            }
          })
          })

        //define what happens when connection closes
        segment.socket.on('end', function(){
          //If we have all data, build file
          //else, get segment somewhere else

          //close socket
          segment.socket.end()
          delete segment.socket

          //combine chunks into a buffer
          var buffer = Buffer.concat(segment.chunks)
          //calculate length of segment
          var segmentLength = segment.end - segment.start + 1
          //make sure whe have as much data as expected
          if(buffer.length === segmentLength) {
            //store this buffer
            segment.bufferedData = buffer
            //increment completed segments
            tracker.completedSegments++
            //check if we completed all segments

            //remove unneeded attributes from segment
            delete segment.chunks
            if(tracker.completedSegments === segments.length) {
              //stitch all segments together
              stitchSegments(tracker)
            }
          }

        })

        //connect to peer that has this segment
        segment.socket.connect(segment.port, segment.url)
      })
    },

    stitchSegments: function(tracker) {
      //sort segments so they stitch together properly
      var segments = tracker.segments.sort(function(a, b) {
        if(a.start < b.start) {
          return -1
        } else {
          return 1
        }
      })

      //collect the raw data of each segment into array
      var buffers = segments.map(function(segment){ return segment.bufferedData })
      //combine all data
      var file = Buffer.concat(buffers)
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
        fs.writeFile(dir + '/' + tracker.filename, file)
      }
    },

    end: function() {
      console.log(this.name + 'terminating')
    }
  }
}