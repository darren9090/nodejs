var ioc = require('socket.io-client');

var clientSocket = ioc('http://127.0.0.1');



clientSocket.on('connect', function () {
    console.log("connect-----");

	clientSocket.emit("send","playing");
	clientSocket.on('send_complete', function (msg) {
      // my msg
      console.log("send_complete!!!!");
      console.log(msg);
      clientSocket.emit('woot');
    });
});
clientSocket.on('disconnect', function () {
    console.log("disconnect-----");
});