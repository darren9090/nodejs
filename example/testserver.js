// var server = require('http').createServer(),
	//io = require('socket.io')(server),
	// io = require('socket.io'),
	// redis = require('socket.io-redis');
var server = require('http').createServer();
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
io.adapter(redis({ host: '127.0.0.1', port: 6379 }));

io.on('connection', function(client){

  console.log("hello connection!!!"+client.id)
  client.emit('connection',"ok~~~~~id:"+client.id);

  client.on("send",function(msg){

  	console.log("=====send====");
  	console.log(msg);

  });

  client.on('disconnect', function(){

  	console.log("---------disconnect---------"+client.id);
  	

  });

});
server.listen(9000);