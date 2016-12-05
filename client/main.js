var peer = require('./peer');
var tracker = require('./tracker');
var utils = require('./utils')

initialPeer(1, ip, 'junk.txt');
initialPeer(2, ip, 'junk2.txt');

setTimeout(newPeer.bind(null, 3, ip), 30000);
setTimeout(newPeer.bind(null, 4, ip), 30000);
setTimeout(newPeer.bind(null, 5, ip), 30000);
setTimeout(newPeer.bind(null, 6, ip), 30000);
setTimeout(newPeer.bind(null, 7, ip), 30000);

setTimeout(newPeer.bind(null, 8, ip), 90000);
setTimeout(newPeer.bind(null, 9, ip), 90000);
setTimeout(newPeer.bind(null, 10, ip), 90000);
setTimeout(newPeer.bind(null, 11, ip), 90000);
setTimeout(newPeer.bind(null, 12, ip), 90000);

setTimeout(end.bind(null, 1, ip), 90000);
setTimeout(end.bind(null, 2, ip), 90000);

function intitalPeer(port, ip, file) {
	tracker.connect(port, ip, function() {
		console.log()
	});
	tracker.createTracker(file, function(file) {
		console.log(file);
	});
}

function newPeer(port, ip) {
	tracker.connect(port, ip, function() {
		console.log()
	});
	tracker.requestList(function(list) {
		for(i=0; i < list.length; i++){
			var files[i] = list[i];
		}
	});
	tracker.getFile(files[0]);
	tracker.getFile(files[1]);
}