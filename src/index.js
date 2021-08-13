const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicPath = path.join(__dirname, '../public');
const port = process.env.port || 3000;

app.use(express.static(publicPath));


io.on('connection', (socket) => {
  console.log('New web socket conn');

  socket.on('join', ({username, room}, callback) => {
    const {error, user} = addUser({id: socket.id, username, room});

    if(error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit('message', generateMessage('Sys', 'Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Sys', `${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback();
  })

  socket.on('sendMessage', (message, callback) => {
    const filter = new Filter();

    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed!')
    }

    const user = getUser(socket.id);
    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback();
  })

  socket.on('sendLocation', ({long, lat}, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${long}`));
    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('Sys',`${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log('Server listening on ' +port)
})