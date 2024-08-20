const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require('socket.io')(server);
const path = require('path');


server.listen(8001);

app.use(express.static('public'));

app.get('/:room',(req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'meet.html')); 
})