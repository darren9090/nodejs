var http = require("http");
var querystring = require("querystring");
var eventer = require("events").EventEmitter;
var closedEventer = new eventer();

var postData = querystring.stringify({
	"type":"1",
	"mobile":"xxxxxxx",
	"category":"xxxxxxx"
});
var options = {
	hostname:"bj.xxxxxxx.com",
	port:80,
	path:"/app/sendcode.do",
	method:"POST",
	headers:{
		"connection":"keep-alive",
		"Content-Type": 'application/x-www-form-urlencoded', //必不可少，后台接收参数的时候需要通过键值对的形式
        "Content-Length": postData.length,  //必不可少，校验后台数据实际接收长度
		"Host":"bj.xxxxxxx.com:8080",
		"Referer":"http://bj.xxxxxxx.com",
		"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0"
	}
};



var response = "";
var req = http.request(options,function(res){

	console.log("state:"+res.statusCode + "\n");
	console.log("header:"+JSON.stringify(res.headers) + "\n");

	res.on("data",function(data){
		console.log(typeof data);
		response += data;
	});
	res.on("end",function(){
		console.log("response :"+response + "\n");

		//var result = JSON.parse(response);
	});

})

req.on("error",function(e){
	console.log("error:"+e.message + "\n");
});

//app.use(bodyParser.urlencoded({ extended: true }));
console.log(">>>>>>>>"+postData);
req.write(postData);

req.end();