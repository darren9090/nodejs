var server = require('http').createServer();
var io = require('socket.io')(server);
var redis   = require('redis');
var redisclient  = redis.createClient('6379', '127.0.0.1');

//定义常量
var config = {

    kafkaurl : "127.0.0.1:2181",
    prefixKey : 'VIDEO_LOG_',
    code : 'UTF-8'

};


io.on('connection',function(clientSocket){

	console.log("server start ......");
	//结果信息
	var retJSON = {
        retCode:0,
        msg:"success" 
    };
    //名字
    var fn = config.prefixKey + clientSocket.id;

	//响应给客户端
	clientSocket.emit("connection",JSON.stringify(retJSON));

	//处理客户端发过来的数据
	clientSocket.on("send",function(data){

		console.log("this socket id:" + clientSocket.id + " is sending ......");

		var kafka = require('kafka-node'),
        Producer = kafka.Producer,
        client = new kafka.Client(config.kafkaurl),
        producer = new Producer(client);

        payloads = [
            { 
                topic: 'log', 
                messages:data,
                partition: 0 
            }
        ];
        
        producer.on('ready', function(){

            console.log("kafka producer>>>>>>"+JSON.stringify(payloads));
            producer.send(payloads, function(err, data){
                console.log("kafka producer data>>>>>>>"+data)
            });
            
            //写入redis临时存储
            redisclient.on('error', function (err) {
			    console.log('error event - ' + redisclient.host + ':' + redisclient.port + ' - ' + err);
			});
            redisclient.set(fn , payloads[0].messages, redis.print);
            
        });

        producer.on('error', function(err){
            console.log("kafka producer error:"+err);
            retJSON = {
                retCode:1,
                msg:"error:"+ err
            };

        })

		clientSocket.emit("send_complete",JSON.stringify(retJSON));
	});

	clientSocket.on("disconnect", function(){

		//clientSocket.emit("disconnect",JSON.stringify(retJSON));
		console.log("send socket id:"+clientSocket.id + " disconnect successfully!");


		//获取redis临时存储
		redisclient.on('error', function (err) {
		    console.log('error event - ' + redisclient.host + ':' + redisclient.port + ' - ' + err);
		});

    	redisclient.get(fn , function(err, reply){
	        console.log("redis::::"+reply.toString());

	        //发送给Kafka
		    var kafka = require('kafka-node'),
	        Producer = kafka.Producer,
	        client = new kafka.Client(config.kafkaurl),
	        producer = new Producer(client);
	        
	        
		    //var message = JSON.parse(reply);
		    var message = eval("(" + reply + ")");
		    var date = new Date();
		    message["date"] = date.Format("yyyyMMdd");
		    message["time"] = date.Format("hhmmss");
		    message["logtype"] = "out";//断开
		    //console.log(message);

			payloads = [
	            { 
	                topic: 'log', 
	                messages:JSON.stringify(message),
	                partition: 0 
	            }
	        ];

		    producer.on('ready', function(){

	            console.log("kafka producer>>>>>>"+JSON.stringify(payloads));
	            producer.send(payloads, function(err, data){
	                console.log("kafka producer data>>>>>>>"+data)
	            });
	            
	            //删除文件临时存储
	            fs.unlinkSync(fn , function(err) {
				    if (err) {
				        console.log("delete file error:"+err);
				        return;
				    }
				    console.log('delete file :' + fn);
				});
	        });

	        producer.on('error', function(err){
	            console.log("kafka producer error:"+err);
	            retJSON = {
	                retCode:1,
	                msg:"error:"+ err
	            };

	        })
	    });
        
	})

});

server.listen(3000);

Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
