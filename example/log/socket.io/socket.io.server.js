var server = require('http').createServer();
var kafka = null;

var io = require('socket.io')(server);
io.on('connection', function(client){

  client.emit('event',"ok~~~~~");
  console.log("connection.........");

  client.on("play",function(msg){

  	console.log("=====play====");
  	console.log(msg);
  });

  client.on('disconnect', function(){

  	console.log("---------disconnect---------");
  	

  });

});
server.listen(3000);