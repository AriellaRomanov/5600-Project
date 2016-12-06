var fs = require('fs')
var peerGen = require('./client/peer')
var peers = []
for(var i = 0; i < 13; i++){
  peers.push(peerGen())
}

firstPeers()
// setTimeout(secondPeers, 120*1000)
// setTimeout(thirdPeers, 260*1000)
// setTimeout(function(){
//   peers.forEach(function(peer){
//     peer.end()
//   })
// }, 500*1000)

function firstPeers(){
  var peer1 = peers[0]
  var peer2 = peers[1]

  peer1.connect(function(){
  peer2.connect(function(){
  peer1.createTracker('file1', function(resp1){
    console.log(peer1.name + 'creating tracker for file1')
  peer2.createTracker('file2', function(resp2){
    console.log(peer2.name + 'creating tracker for file2')

    peer1.getList(function(list){
      console.log(peer1.name + 'requesting list')
       list.forEach(function(item){
          if(!fs.existsSync('./Peer1/' + item.name)) {
            peer1.getTracker(item.name, function(tracker){
              console.log(peer1.name + 'getting file' + tracker.filename)
              peer1.getFile(tracker, function(){
              })
            })
          }
       })
    })

    peer2.getList(function(list){
       console.log(peer2.name + 'requesting list')
       list.forEach(function(item){
          if(!fs.existsSync('./Peer2/' + item.name)) {
            peer2.getTracker(item.name, function(tracker){
              console.log(peer2.name + 'getting file' + tracker.filename)
              peer2.getFile(tracker, function(){
                secondPeers()
              })
            })
          }
       })
    })

  })
  })
  })
  })


}

function secondPeers() {
  var second = peers.slice(2, 8)
  second.forEach(function(peer){
    if(!fs.existsSync('./' + peer.name)) {
      fs.mkdirSync('./' + peer.name)
    }
    peer.getList(function(list){
      console.log(peer.name + 'requesting list')
       list.forEach(function(item){
          peer.getTracker(item.name, function(tracker){
            console.log(peer.name + 'getting file' + tracker.filename)
            peer.getFile(tracker, function(){})
          })
       })
    }) 
  } )
}

function thirdPeers() {
  var third = peers.slice(8, 13)
  third.forEach(function(peer){
    if(!fs.existsSync('./' + peer.name)) {
      fs.mkdirSync('./' + peer.name)
    }
    peer.getList(function(list){
      console.log(peer.name + 'requesting list')
       list.forEach(function(item){
          peer.getTracker(item.name, function(tracker){
            console.log(peer.name + 'getting file' + tracker.filename)
            peer.getFile(tracker, function(){})
          })
       })
    }) 
  } )
}

