var express = require('express'),
	config = require('./config.js'),
	socket = require('./socket.js');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);


app.get("*",socket)

io.sockets.on('connection', socket);

//Start Server
server.listen(5000);