var express = require('express'),
	routes = require('./routes/log'),
	routesnews = require('./routes/news'),
	// routesmonitor = require('./routes/monitorKafka')(),
	routescrawler = require('./routes/crawler'),
	http =require('http'),
	numCPUs = require('io').length,
	url = require('url'),
	qstr = require('querystring'),
	cluster = require('cluster'),
	mysql = require('mysql'),
	app = express(),
	server = http.createServer(app),
	//网站视频日志socket
	io = require('socket.io')(server);

	require('./routes/videolog')(io);

// 参数设置
// app.use(bodyParser.urlencoded({    
//   extended: true
// }));
app.all("*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

//咨询相关
app.get("/select/news",routesnews.news);

//网站视频日志socket
//io.on("connection" , function(socket){});

//接收app日志请求
app.get("/send/topic/log" , routes.log);
app.post("/send/topic/log" , routes.log);

//获取财经日历
app.get("/get/ec",routescrawler.main);

//静态访问文件 ： //http://127.0.0.1:3000/public/image/country/ios/a.png
app.use("/public" , express.static('static'));

//监听3000端口
server.listen(3000 , "0.0.0.0",function(){
	console.log("express server listening on port 3000");
});





