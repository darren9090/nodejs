var http = require("http");

http.createServer(function(req,res){

	res.writeHead(200,{"content-Type":"text/plain"});
	res.write("hello world nodejs");
	res.end();

}).listen(2015);


//使用Apache ab 测试性能
// ab -n1000 -c10 http://127.0.0.1:2015/

// -n1000  	总请求数
// -c10  	总并发数
//http:127.0.0.1:2015/  测试请求地址

//........ -t 