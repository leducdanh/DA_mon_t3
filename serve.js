const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/style', express.static(__dirname + '/style'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

var lstRoom = []
var lstIdRoom = []
var count = 0 //count user in room
var idCurRoom = 0
var lstbeforeUser = []
io.on('connection', (socket) => {
  let index = -1
  for (let i = 0; i < lstRoom.length; i++) {
    if (lstRoom[i].UserInRoom.length < 2) {
      index = i
      break
    }
  }

  if (index > -1) {
    socket.room = lstRoom[index].idRoom
    socket.join(lstRoom[index].idRoom);
    lstRoom[index].UserInRoom.push(socket.id)
    lstbeforeUser.push(socket.room + "_" + socket.id)
    idCurRoom = 0
    io.sockets.in(socket.id).emit('TypeChess', { text: "O", color: "red" })
    io.sockets.in(socket.room).emit('StartGame', { indexUser: 2, startGame: true })
  } else {
    do {
      idCurRoom = Math.floor(Math.random() * 999999)
    } while (idCurRoom === 3000 && lstIdRoom.indexOf(idCurRoom) >= 0)
    socket.room = JSON.stringify(idCurRoom)
    socket.join(JSON.stringify(idCurRoom));
    let roomInfo = {
      idRoom: JSON.stringify(idCurRoom),
      UserInRoom: [socket.id]
    }
    lstRoom.push(roomInfo)
    lstIdRoom.push(idCurRoom)
    io.to(socket.id).emit('TypeChess', { text: "X", color: "black" })
    io.sockets.in(socket.room).emit('StartGame', { indexUser: 1, startGame: false })
  }
  //////////////////////////////
  // count += 1
  // if (count >= 1 && idCurRoom !== 0) {
  //   socket.room = JSON.stringify(idCurRoom)
  //   socket.join(JSON.stringify(idCurRoom));
  //   lstbeforeUser.push(socket.room + "_" + socket.id)
  //   idCurRoom = 0
  //   count = 0
  //   io.sockets.in(socket.id).emit('TypeChess', { text: "O", color: "red" })
  //   io.sockets.in(socket.room).emit('StartGame', { indexUser: 2, startGame: true })
  // } else {
  //   do {
  //     idCurRoom = Math.floor(Math.random() * 999999)
  //   } while (idCurRoom === 3000 && lstRoom.indexOf(idCurRoom) >= 0)
  //   socket.room = JSON.stringify(idCurRoom)
  //   socket.join(JSON.stringify(idCurRoom));
  //   lstRoom.push(JSON.stringify(idCurRoom))
  //   io.to(socket.id).emit('TypeChess', { text: "X", color: "black" })
  //   io.sockets.in(socket.room).emit('StartGame', { indexUser: 1, startGame: false })
  // }
  socket.isGameOver = false
  socket.on('message', (pos, text) => {
    //check if is user before then not hadling
    if (lstbeforeUser.length > 0 && lstbeforeUser.indexOf(socket.room + "_" + socket.id) >= 0) {
      return
    }

    //upd user before by room 
    //room_idUser
    for (let i = 0; i < lstbeforeUser.length; i++) {
      if (lstbeforeUser[i].split("_")[0] === socket.room) {
        lstbeforeUser.splice(i, 1);//remove user before
        break;
      }
    };
    lstbeforeUser.push(socket.room + "_" + socket.id)

    io.sockets.in(socket.room).emit('message', { 'pos': pos, 'text': text })
    beforeUser = socket.id
    beforeRoom = socket.room
  })

  socket.on('disconnect', function () {
    for (let i = 0; i < lstRoom.length; i++) {
      if (lstRoom[i].idRoom === socket.room) {
        lstRoom.splice(i, 1)
        break
      }
    };
    // if (lstRoom.indexOf(socket.room) >= 0) {
    //   lstRoom.splice(lstRoom.indexOf(socket.room), 1)
    // }
    if (socket.isGameOver !== true) {
      io.sockets.in(socket.room).emit('OutGame', { indexUser: 1, startGame: false })
    }
    socket.leave(socket.room);
    count -= 1
    if (count < 0)
      count = 0
  });


  socket.on('timeStop', function () {
    for (let i = 0; i < lstRoom.length; i++) {
      if (lstRoom[i].UserInRoom.indexOf(socket.id) >= 0) {
        for (let j = 0 ; j< lstRoom[i].UserInRoom.length ; j++){
          if (lstRoom[i].UserInRoom[j] === socket.id){
            io.to(lstRoom[i].UserInRoom[j]).emit('receiveTimeStop', false ) //user lose
          } else{
            io.to(lstRoom[i].UserInRoom[j]).emit('receiveTimeStop', true ) //user win
          }
        }
        break
      }
    }
  });

  socket.on('GameOver', function (isGameOver) {
    socket.isGameOver = isGameOver
  });

})

http.listen(3000, () => console.log('listening on port 3000'))
