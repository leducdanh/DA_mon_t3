const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/style', express.static(__dirname + '/style'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

var lstUserInRoom = []
var count = 0 //count user in room
var idCurRoom = 0
var lstbeforeUser = []
io.on('connection', (socket) => {
  if (count >= 1 && idCurRoom !== 0) {
    socket.room = JSON.stringify(idCurRoom)
    socket.join(JSON.stringify(idCurRoom));
    lstbeforeUser.push(socket.room + "_" + socket.id)
    idCurRoom = 0
    count = 0
    io.sockets.in(socket.id).emit('TypeChess', { text:"O", color: "red" })
  } else {
    do {
      idCurRoom = Math.floor(Math.random() * 999999)
    } while(idCurRoom === 3000 && lstUserInRoom.indexOf(idCurRoom) >= 0)
    socket.room = JSON.stringify(idCurRoom)
    socket.join(JSON.stringify(idCurRoom));
    lstUserInRoom.push(JSON.stringify(idCurRoom))
    io.to(socket.id).emit('TypeChess', { text:"X", color: "black" })
  }

  count += 1
  socket.on('message', (pos, text) => {
    //check if is user before then not hadling
    if (lstbeforeUser.length > 0 && lstbeforeUser.indexOf(socket.room + "_" + socket.id) >= 0 ){
      return
    }

    //upd user before by room
    for (let i = 0; i< lstbeforeUser.length ; i++) {
      if (lstbeforeUser[i].split("_")[0] === socket.room){
        lstbeforeUser.splice(i, 1);//remove user before
        break;
      }
    };
    lstbeforeUser.push(socket.room + "_" + socket.id)

    io.sockets.in(socket.room).emit('message', { 'pos': pos, 'text': text })
    beforeUser = socket.id
    beforeRoom = socket.room
  })

  socket.on('disconnect', function() {
    // if (socket_room) {
    //     socket.leave(socket_room);
    // }
    if (lstUserInRoom.indexOf(socket.room) >= 0){
      lstUserInRoom.splice(lstUserInRoom.indexOf(socket.room), 1)
    }
    socket.leave(socket.room);
    // console.log(io.sockets.adapter.rooms)
});

  // socket.on('join', (username) => {
  //   if (username != null) {
  //     socket.username = username
  //   }
  //   let fromID = lstUserInRoom[0] === socket.id ? lstUserInRoom[0]: lstUserInRoom[1]
  //   console.log(fromID)
  //   socket.broadcast.to(fromID).emit('message',
  //     { 'user': 'Server', 'message': socket.username + ' has joined!' })
  // })
})

http.listen(3000, () => console.log('listening on port 3000'))
