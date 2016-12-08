var config = require('./sconfig.json')

module.exports = {

  parseTracker: function(strings) {
    var tracker = {}
    var currentLine = strings.shift()

    while(currentLine[0] !== '#') {
      var segments = currentLine.split(': ')
      tracker[segments[0].toLowerCase()] = segments[1]
      currentLine = strings.shift()
    }
    currentLine = strings.shift()
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

  //create segment data structure
  //contains start byte, end byte and size
  createSegment: function(start, end) {
    var utils = this
    return {
      start: start,
      end: end,
      size: utils.segmentSize(start, end)
    }
  },

  segmentSize: function(start, end) {
    return end - start + 1
  },

  //determine if outer segment contains inner
  segmentContains: function(outer, inner) {
    return (outer.start <= inner.start) &&
           (outer.end >= inner.end)
  },

  //calculate new array of gaps when given segment is attained
  recalculateGaps: function(gaps, segment) {
    var utils = this
    var newGaps = []
    gaps.forEach(function(gap){
      //make sure gap contains segment
      if(utils.segmentContains(gap, segment)) {
        //calculate the 2 new gaps created
        var newEnd = segment.start - 1
        var newStart = segment.end + 1        
        newGaps.push(utils.createSegment(gap.start, newEnd))
        newGaps.push(utils.createSegment(newStart, gap.end))
      } else {
        //keep this gap in array
        newGaps.push(gap)
      }
    })
    return newGaps
  },

  //choose a random segment within provided gap that peer has
  chooseRandomSegment: function(gap, peer) {
    //keep start in first third of gap
    var startUpperBound = gap.start + (gap.size/3)
    var startLowerBound = gap.start
    var start = Math.floor(Math.random() * (startUpperBound - startLowerBound + 1) + startLowerBound)

    //pick end that is within peer segment boundaries and segment size
    var end = Math.min(peer.end, start + 10 - 1)


    return this.createSegment(start, end)
  }

}