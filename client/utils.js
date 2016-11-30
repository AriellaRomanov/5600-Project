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

      tracker.peers.push({
        ip: line[0],
        port: Number(line[1]),
        start: Number(line[2]),
        end: Number(line[3]),
        timestamp: line[4]
      })

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
    var numSegments = 10
    var segmentSize = Math.ceil(tracker.filesize/numSegments)
    var segmentsCreated = 0
    var currentPeerIndex = 0
    var segmentStart = segmentsCreated * segmentSize
    var segmentEnd = (segmentStart + segmentSize) - 1
    var peers = tracker.peers
    tracker.segments = []

    while(segmentsCreated < numSegments) {
      var selectedPeer = peers[currentPeerIndex]

      //make sure peer has segment before adding them
      if((selectedPeer.start <= segmentStart) && 
         (selectedPeer.end >= segmentEnd)) {

        tracker.segments.push({ ip: selectedPeer.ip,
                                port: selectedPeer.port,
                                start: segmentStart,
                                end: segmentEnd })

        segmentStart = (segmentsCreated*segmentSize)+1
        segmentEnd = Math.min(segmentStart+segmentSize-1, tracker.filesize-1)
        segmentsCreated += 1
      }

      currentPeerIndex = (currentPeerIndex+1)%peers.length

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