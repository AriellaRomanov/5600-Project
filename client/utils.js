module.exports = {

  parseTracker: function(text) {
    //example of parsed tracker file
    return {
      filename: 'name',
      filesize: 123,
      description: 'text',
      md5: '123',
      peers: [
        { ip:'123', port: 1, start: 0, end: 10, timestamp: '...'},
        { ip:'123', port: 1, start: 0, end: 10, timestamp: '...'},
        { ip:'123', port: 1, start: 0, end: 10, timestamp: '...'},
      ]
    }
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