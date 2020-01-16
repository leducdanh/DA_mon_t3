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
var lstmanager = []
io.on('connection', (socket) => {
  io.to(socket.id).emit("lstIdRoomFromSV", lstIdRoom);
  socket.on('CreateRoom', (username) => {
    if (lstmanager.indexOf(socket.id) >= 0) {
      io.to(socket.id).emit("Existmanager");
      return
    }
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
    lstIdRoom.push(idCurRoom + "_" + socket.id + "_" + username)
    lstmanager.push(socket.id)
    socket.broadcast.emit("lstIdRoomFromSV", lstIdRoom);
    io.to(socket.id).emit("lstIdRoomFromSV", lstIdRoom);
    io.to(socket.id).emit('TypeChess', { text: "X", color: "black" })
    io.sockets.in(socket.room).emit('StartGame', { indexUser: 1, startGame: false })
  })


  socket.on('BeginGame', (idRoom) => {
    let index = -1
    for (let i = 0; i < lstRoom.length; i++) {
      if (lstRoom[i].idRoom == idRoom) {
        if (lstRoom[i].UserInRoom.length >= 2) { //full load
          io.sockets.in(socket.id).emit('ReceiveBeginGame', false)
          return
        }
        index = i
        break
      }
    }
    socket.room = idRoom
    socket.join(idRoom);
    lstRoom[index].UserInRoom.push(socket.id)
    lstbeforeUser.push(socket.room + "_" + socket.id)
    idCurRoom = 0
    io.sockets.in(socket.id).emit('TypeChess', { text: "O", color: "red" })
    io.sockets.in(socket.room).emit('StartGame', { indexUser: 2, startGame: true })
    io.sockets.in(socket.room).emit('ReceiveBeginGame', true)

    //remove lstbeforeUser
    for (let i = 0; i < lstbeforeUser.length; i++) {
      if (lstbeforeUser[i].split("_")[0] === socket.room) {
        lstbeforeUser.splice(i, 1)
        break
      }
    }
  })

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
    for (let i = 0; i < lstIdRoom.length; i++) {
      if (lstIdRoom[i].split("_")[1] === socket.id) {
        lstRoom.splice(i, 1)
        lstIdRoom.splice(i, 1)
        socket.leave(socket.room);
        break
      }
    };

    //remove user out room
    for (let i = 0; i < lstRoom.length; i++) {
      if (lstRoom[i].idRoom === socket.room) {
        if (lstRoom[i].UserInRoom[0].split("_")[1] !== socket.id)//is not manager
          lstRoom[i].UserInRoom.splice(1, 1)
        break
      }
    };
    // if (lstRoom.indexOf(socket.room) >= 0) {
    //   lstRoom.splice(lstRoom.indexOf(socket.room), 1)
    // }
    socket.broadcast.emit("lstIdRoomFromSV", lstIdRoom);
    if (socket.isGameOver !== true) {
      io.sockets.in(socket.room).emit('OutGame', { indexUser: 1, startGame: false })
    }
    count -= 1
    if (count < 0)
      count = 0
  });


  socket.on('timeStop', function () {
    for (let i = 0; i < lstRoom.length; i++) {
      if (lstRoom[i].UserInRoom.indexOf(socket.id) >= 0) {
        for (let j = 0; j < lstRoom[i].UserInRoom.length; j++) {
          if (lstRoom[i].UserInRoom[j] === socket.id) {
            io.to(lstRoom[i].UserInRoom[j]).emit('receiveTimeStop', false) //user lose
          } else {
            io.to(lstRoom[i].UserInRoom[j]).emit('receiveTimeStop', true) //user win
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
