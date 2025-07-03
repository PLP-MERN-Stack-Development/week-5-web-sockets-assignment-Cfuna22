const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const app = express();

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

let users = {};
let rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('new-user', (username) => {
        users[socket.id] = { username, room: 'global' };
        socket.join('global');
        io.to('global').emit('chat-message', {
            username: 'System',
            message: `${username} joined the chat`,
            timestamp: new Date(),
        });
        io.emit('users-online', Object.values(users).map(u => u.username));
    });

    socket.on('send-message', ({ message, username }) => {
        const room = users[socket.id]?.room || 'global';
        io.to(room).emit('chat-message', {
            username,
            message,
            timestamp: new Date(),
        });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('user-typing', username);
    });

    socket.on('private-message', ({ toSocketId, from, message }) => {
        io.to(toSocketId).emit('private-message', {
            from,
            message,
            timestamp: new Date(),
        });
    });

    socket.on('switch-room', (roomName) => {
        const currentRoom = users[socket.id]?.room || 'global';
        socket.leave(currentRoom);
        socket.join(roomName);
        users[socket.id].room = roomName;
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.emit('chat-message', {
                username: 'System',
                message: `${user.username} left`,
                timestamp: new Date(),
            });
            delete users[socket.id];
        }
        io.emit('users-online', Object.values(users).map(u => u.username));
    });
});

server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});
