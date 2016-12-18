var ioc = require('socket.io-client');
var clientSocket = ioc('http://127.0.0.1:3001');

clientSocket.on('connect', function () {
    console.log("connect-----");

    //发送给服务器
	clientSocket.emit("send","{'tp':'4','platform':'web'}");


	clientSocket.on('send_complete', function (msg) {
      
      console.log("client send_complete!!!!");
      console.log(msg);
      
    });
});
clientSocket.on('disconnect', function () {
    console.log("disconnect-----");
});