module.exports = {

  parseTracker: function(text) {
    var strings = text.split('\n')
    //remove all comments
    strings = strings.filter(function(line) {
      return line[0] !== '#'
    })

    var tracker = {}
    var currentLine = strings.shift()

    while(isNaN(currentLine[0])) {
      var segments = currentLine.split(': ')
      tracker[segments[0]] = segments[1]
      currentLine = strings.shift()
    }

    tracker["peers"] = []
    var peer = {}
    while(currentLine){
      var line = currentLine.split(':')
      peer["ip"] = line[0]
      peer["port"] = line[1]
      peer["start"] = line[2]
      peer["end"] = line[3]
      peer["timestamp"] = line[4]
      tracker.peers.push(peer)
      currentLine = strings.shift()
    }
    return tracker
  },

  splitToSegments: function(tracker) {
    var numSegments = 10
    var segmentSize = Math.floor(tracker.filesize/numSegments)
    tracker.segments = []

    for(var i = 0; i < numSegments; i++) {
      tracker.segments.push({ ip:'123', port: 1, start: 0, end: 10, timestamp: '...'})
    }

  },

  selectPeers: function(tracker) {

    var selectedPeers = []
    for (var i = tracker.peers.length - 1; i >= 0; i--) {
      var peer = tracker.peers[i]
      var selectThisPeer = true
      //make sure segment isnt already selected and any other conditions needed
      if(selectThisPeer) selectedPeers.push(peer)
    }
    
    return selectedPeers
  }
}