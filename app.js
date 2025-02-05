const mysql = require('mysql2');
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3501;
const server = app.listen(PORT, () => console.log(`Server on port ${PORT}`));

const io = require('socket.io')(server);


app.use(express.static(path.join(__dirname, 'public')));

let socketsConnected = new Set();


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sumit@123',
    database: 'chatapp'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});


io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socketsConnected.add(socket.id);
    io.emit('clients-total', socketsConnected.size);


    db.query("SELECT sender, message, timestamp FROM messages ORDER BY timestamp ASC", (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
        } else {
            socket.emit('chatHistory', results);
        }
    });


    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        socketsConnected.delete(socket.id);
        io.emit('clients-total', socketsConnected.size);
    });


    socket.on('message', (data) => {
        const sql = "INSERT INTO messages (sender, message) VALUES (?, ?)";
        db.query(sql, [data.sender, data.message], (err, result) => {
            if (err) {
                console.error('Error saving message:', err);
            } else {
                console.log('Message saved to DB');
            }
        });


        socket.broadcast.emit('chat-message', data);
    });


    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });
});
