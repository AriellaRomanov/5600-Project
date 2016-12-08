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

    var count = 0
    downloadAll(peer1, function(){
      count++
      if(count === 2) secondPeers()
    })   

    downloadAll(peer2, function(){
      count++
      if(count === 2) secondPeers()
    })
  

  })
  })


}

function secondPeers() {
  console.log('executing more peers')
  return
  var second = peers.slice(2, 8)
  second.forEach(function(peer){
    peer.connect(function(){
      downloadAll(peer, function(){
        console.log('done')
      })
    })
  })
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
  })
}

function downloadAll(peer, completedCb) {
  var count = 0
  peer.getList(function(list){  
    list.forEach(function(item){
       if(!peer.hasFile(item.name)) {
         peer.getTracker(item.name, function(tracker){
           // fs.writeFile(peer.name + '.' + tracker.filename + '.track', JSON.stringify(tracker), function(){})
           peer.getFile(tracker, function(){
            count++
            if(count === list.length) completedCb()
           })
         })
       } else {
        count++
        if(count === list.length) completedCb()
        console.log(peer.name, 'already has file', item.name)
       }
    })
  })

}