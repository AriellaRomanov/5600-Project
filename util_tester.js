var utils = require('./client/utils')
var fs = require('fs')
var peer = require('./client/peer')
var server = require('./client/server')
var trackerFile = fs.readFileSync('test_tracker.txt').toString()

//parse tracker
var tracker = utils.parseTracker(trackerFile)

//split
utils.splitToSegments(tracker)

console.log(tracker)

server.listen(3000)

peer.getFile(tracker)

var trackerList = fs.readFileSync('test_list.txt').toString()
var list = utils.parseList(trackerList)

console.log(list)