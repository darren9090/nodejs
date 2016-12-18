var server = require('http').createServer();
var io = require('socket.io')(server);
var fs = require('fs');

//定义常量
var config = {

    kafkaurl : "127.0.0.1:2181",
    filename : '/Users/depengzou/Desktop/videoLogTmp/',
    code : 'UTF-8'

};


io.on('connection',function(clientSocket){

	console.log("server start ......");
	//结果信息
	var retJSON = {
        retCode:0,
        msg:"success" 
    };
    //文件名字
    var fn = config.filename + clientSocket.id;

	//响应给客户端
	clientSocket.emit("connection",JSON.stringify(retJSON));

	//处理客户端发过来的数据
	clientSocket.on("send",function(data){

		console.log("this socket is sending ......");
		console.log("send socket id:"+clientSocket.id);

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
            
            //写入文件临时存储
            fs.writeFile(fn , payloads[0].messages,function(err){

            	if(err){
            		console.log("write file error:"+err);
            		return;
            	}
            	console.log("write file ：" + fn);

            });
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

		console.log("this socket is disconnect successfully!");
		//clientSocket.emit("disconnect",JSON.stringify(retJSON));
		console.log("send socket id:"+clientSocket.id);
		//写入文件临时存储
        fs.readFile(fn , function(err,data){
        	// 读取文件失败/错误
		    if (err) {
		        console.log("readFile error:"+err);
		        return;
		    }
		    // 读取文件成功
		    console.log("readFile data:" + data);

		    //发送给Kafka
		    var kafka = require('kafka-node'),
	        Producer = kafka.Producer,
	        client = new kafka.Client(config.kafkaurl),
	        producer = new Producer(client);
	        
	        
		    //var message = JSON.parse(data);
		    var message = eval("(" + data + ")");
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
