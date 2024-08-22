const express = require('express');
const app = express();
const server = require("http").Server(app);
const path = require('path');
const port = 8010;

server.listen(port,() => {
    console.log("Server is Running on port :: ",port);
});

app.use(express.static('public'));

app.get('/:room',(req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'meet.html')); 
});