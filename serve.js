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
  count += 1
  if (count >= 1 && idCurRoom !== 0) {
    socket.room = JSON.stringify(idCurRoom)
    socket.join(JSON.stringify(idCurRoom));
    lstbeforeUser.push(socket.room + "_" + socket.id)
    idCurRoom = 0
    count = 0
    io.sockets.in(socket.id).emit('TypeChess', { text:"O", color: "red" })
    io.sockets.in(socket.room).emit('StartGame', {indexUser: 2, startGame: true })
  } else {
    do {
      idCurRoom = Math.floor(Math.random() * 999999)
    } while(idCurRoom === 3000 && lstUserInRoom.indexOf(idCurRoom) >= 0)
    socket.room = JSON.stringify(idCurRoom)
    socket.join(JSON.stringify(idCurRoom));
    lstUserInRoom.push(JSON.stringify(idCurRoom))
    io.to(socket.id).emit('TypeChess', { text:"X", color: "black"})
    io.sockets.in(socket.room).emit('StartGame', { indexUser: 1, startGame: false })
  }
  socket.on('message', (pos, text) => {
    //check if is user before then not hadling
    if (lstbeforeUser.length > 0 && lstbeforeUser.indexOf(socket.room + "_" + socket.id) >= 0 ){
      return
    }

    //upd user before by room 
    //room_idUser
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
    if (lstUserInRoom.indexOf(socket.room) >= 0){
      lstUserInRoom.splice(lstUserInRoom.indexOf(socket.room), 1)
    }
    io.sockets.in(socket.room).emit('OutGame', { indexUser: 1, startGame: false })
    socket.leave(socket.room);
    count-=1
    if (count < 0)
      count = 0
});

})

http.listen(3000, () => console.log('listening on port 3000'))
