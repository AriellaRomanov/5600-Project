var config = require('./sconfig.json')

module.exports = {

  parseTracker: function(strings) {

    //remove all comments
    strings = strings.filter(function(line) {
      return line[0] !== '#'
    })

    var tracker = {}
    var currentLine = strings.shift()

    while(isNaN(currentLine[0])) {
      var segments = currentLine.split(': ')
      tracker[segments[0].toLowerCase()] = segments[1]
      currentLine = strings.shift()
    }

    tracker["peers"] = []

    while(currentLine){
      var line = currentLine.split(':')
      var peer = {
        ip: line[0],
        port: Number(line[1]),
        start: Number(line[2]),
        end: Number(line[3]),
        timestamp: Number(line[4])
      }
      peer.size = peer.end - peer.start + 1
      peer.numSegments = Math.ceil(peer.size/config.segmentSize)
      tracker.peers.push(peer)

      currentLine = strings.shift()
    }

    return tracker
  },

  parseList: function(lines) {
    var trackerList = []
    for (var i = lines.length - 1; i >= 0; i--) {
      var line = lines[i].split(' ')
      trackerList.push({
        name: line[1],
        size: line[2],
        md5: line[3]
      })
    }

    return trackerList
  },

  splitToSegments: function(tracker) {
    var segmentSize = config.segmentSize
    var currentPeerIndex = 0
    var segmentStart = 0
    var segmentEnd = Math.min(segmentStart+segmentSize-1, tracker.filesize - 1)
    var peers = tracker.peers

    var segments = []
    tracker.segments = []

    peers.forEach(function(peer){
      var gaps = []
      if(segments.length > 0) {
        var startByte = -1
  
        segments.forEach(function(segment){
          var gapSize = segment.start - startByte - 1
          if(gapSize > 0) {
            gaps.push({
              start: startByte + 1,
              end: segment.end - 1,
              size: gapSize
            })

            startByte = segmend.end
          }

          var remainingSize = tracker.filesize - startByte - 2
          if(remainingSize >  0) {
            gaps.push({
              start: startByte + 1,
              end: tracker.filesize - 1,
              size: remainingSize
            })
          }

        })
      } else {
        gaps.push({
          start: 0,
          end: tracker.filesize - 1,
          size: tracker.filesize
        })
      }

      gaps.forEach(function(gap){
        var start = Math.max(peer.start, gap.start)
        var end = Math.min(peer.end, gap.end)
        if((peer.start <= start) &&
           (peer.end >= end)) {
          segments.push({
            start: start,
            end: end,
            size: end - start + 1,
            url: peer.ip,
            port: peer.port
          })
        }
      })
    })

    segments.forEach(function(segment){
      var numSegments = Math.ceil(segment.size/config.segmentSize)
      for (var i = 0; i < numSegments; i++) {
        var start = segment.start + segmentSize * i
        var end = Math.min(start + segmentSize - 1, segment.end)
        tracker.segments.push({
          start: start,
          end: end,
          url: segment.url,
          port: segment.port
        })
      };
    })

  }

}