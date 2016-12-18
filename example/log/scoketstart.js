var express = require('express'),
	socket = require('./socket.js');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);


//config info
var config = {
	port : process.env.PORT || 5000;	
}

app.get("*",)

io.sockets.on('connection', socket);

//Start Server
server.listen(config.port);