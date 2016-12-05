var utils = require('./client/utils')
var fs = require('fs')
var peer = require('./client/peer')()
var server = require('./client/server')

var trackerFile = fs.readFileSync('test_tracker.txt').toString()
var text = trackerFile.toString()
var lines = text.split('\n')

//parse tracker
var tracker = utils.parseTracker(lines)
//split
utils.splitToSegments(tracker)

server.listen(3003)

peer.getFile(tracker)

// var trackerList = fs.readFileSync('test_list.txt').toString()
// var list = utils.parseList(trackerList)

// console.log(list)