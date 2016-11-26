module.exports = {

  parseTracker: function(text) {
    var strings = text.split('\n')
    var tracker = {}
    for(var i = 0; i < 4; i++){
      var segments = strings[i].split(':')
      tracker[segments[0]] = segments[1]
    }
    tracker["peers"] = []
    var peer = {}
    for(var i = 0; i+4 < strings.length; i++){
      line = strings[i+4].split(':')
      peer["ip"] = line[0]
      peer["port"] = line[1]
      peer["start"] = line[2]
      peer["end"] = line[3]
      peer["timestamp"] = line[4]
      tracker.peers[i] = peer
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