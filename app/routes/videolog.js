var redis = require('redis');
//定义常量
var config = {

    kafkaurl : "127.0.0.1:2181",
    prefixKey : 'VIDEO_LOG_',
    redisurl : '127.0.0.1',
    redisport : '6379'

};

//输出结果
var fun = {

    getInnerClientIp:function (clientSocket) {

        var ipAddress = "";
        if (clientSocket.handshake.address) {
            ipAddress = clientSocket.handshake.address;
        }else if (clientSocket.connection.socket.remoteAddress) {
            ipAddress = clientSocket.connection.socket.remoteAddress;
        }else if (clientSocket.handshake.headers['x-forwarded-for']) {
            ipAddress = clientSocket.handshake.headers['x-forwarded-for'];
        }

        console.log(">>>>ip2>>>>"+ipAddress);
        return ipAddress;
    },
    getOutClientIp:function (clientSocket) {

        var ipAddress = "";
        if (clientSocket.handshake.headers['x-forwarded-for']){
            //ipAddress = clientSocket.handshake.headers['x-forwarded-for'];
            var forwardIpStr = clientSocket.handshake.headers['x-forwarded-for'];
            if (forwardIpStr) {
                var forwardIp = forwardIpStr.split(',');
                ipAddress = forwardIp[0];
            }
        }else if (clientSocket.handshake.address) {
            ipAddress = clientSocket.handshake.address;
        }else if (clientSocket.connection.socket.remoteAddress) {
            ipAddress = clientSocket.connection.socket.remoteAddress;
        }

        console.log(">>>>ip>>>>"+ipAddress);
        return ipAddress;
    }
}

function videoLog(io){

	var socketioredis = require('socket.io-redis'),
	// sub = redis.createClient(config.redisport, config.redisurl , {return_buffers:true}),
	// pub = redis.createClient(config.redisport, config.redisurl , {return_buffers:true}),
	redisclient = redis.createClient(config.redisport, config.redisurl , {return_buffers:true});


	io.adapter(socketioredis({ host: config.redisurl , port: config.redisport /*, pubClient: pub, subClient: sub */}));
	io.on('connection',function(clientSocket){

		console.log("socket connection .................");
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

			console.log("The connection socket id:" + clientSocket.id + " is sending ......"+data);
	        if(data != null && data != 'null'){

	        	var message = eval("(" + data + ")");
	        	var date = new Date();
				message["date"] = date.Format("yyyyMMdd");
				message["time"] = date.Format("hhmmss");

				message["ip"] = fun.getOutClientIp(clientSocket);
				message["ip2"] = fun.getInnerClientIp(clientSocket);

	        	payloads = [
		            { 
		                topic : 'log', 
		                messages : JSON.stringify(message),
		                partition : 0 
		            }
		        ];
		        
		        //Kafka
				// var kafka = require('kafka-node'),
				// Producer = kafka.Producer,
				// client = new kafka.Client(config.kafkaurl),
				// producer = new Producer(client);

				var kafka = require('kafka-node');
			    var HighLevelProducer = kafka.HighLevelProducer;
			    var Client = kafka.Client;
			    var client = new Client(config.kafkaurl);
			    var producer = new HighLevelProducer(client);

		        producer.on('ready', function(){

		            console.log("kafka producer>>>>>>"+JSON.stringify(payloads));
		            producer.send(payloads, function(err, data){
		            	producer.close();
		            	client.close();
		                console.log("send kafka data>>>>>>>"+JSON.stringify(data))
		            });
		            
		            //写入redis临时存储
		            //Redis
					//var redisclient  = redis.createClient(config.redisport, config.redisurl);

		   			//redisclient.on('error', function (err) {
					//     console.log('error event - ' + redisclient.host + ':' + redisclient.port + ' - ' + err);
					// });
		            redisclient.set(fn , payloads[0].messages, redis.print);
		            
		        });

		        producer.on('error', function(err){
		            console.log("send kafka error:" + err);
	            	producer.close();
	            	client.close();
		            retJSON.retCode = 1;
			        retJSON.msg = "error:" + err;

		        })
	        }else{
	        	retJSON.retCode = 1;
	        	retJSON.msg = "data is null";
	        }

			clientSocket.emit("send_complete",JSON.stringify(retJSON));
		});

		clientSocket.on("disconnect", function(){

			//clientSocket.emit("disconnect",JSON.stringify(retJSON));
			console.log("The disconnect socket id:" + clientSocket.id + " disconnected successfully!");


			//获取redis临时存储
            //Redis
			//var redisclient  = redis.createClient(config.redisport, config.redisurl);
			// redisclient.on('error', function (err) {
			//     console.log('error event - ' + redisclient.host + ':' + redisclient.port + ' - ' + err);
			// });

	    	redisclient.get(fn , function(err, reply){
		        console.log("disconnect redis reply : "+reply);
		        
			    //var message = JSON.parse(reply);
			    var message = eval("(" + reply + ")");
			    if(message != null && message != 'null'){

					var extendstr = message["extend"].split("|");
			    	if(extendstr != null && extendstr.length > 1){

			    		var actiontemp = extendstr[1];
			    		if(actiontemp!=null && actiontemp.indexOf('out:mz_out_page') > -1){
			    			message["logtype"] = actiontemp.split(":")[0];
			    			message["actionId"] = actiontemp.split(":")[1];
			    		}else if(actiontemp!=null && actiontemp.indexOf('mz_click') > -1){
							message["actionId"] = actiontemp;
			    		}

			    	}

			    	var date = new Date();
				    message["date"] = date.Format("yyyyMMdd");
				    message["time"] = date.Format("hhmmss");
				    
				    //console.log(message);

					payloads = [
			            { 
			                topic: 'log', 
			                messages : JSON.stringify(message),
			                partition : 0 
			            }
			        ];

			        //Kafka
					// var kafka = require('kafka-node'),
					//     Producer = kafka.Producer,
					//     client = new kafka.Client(config.kafkaurl),
					//     producer = new Producer(client);

					var kafka = require('kafka-node');
				    var HighLevelProducer = kafka.HighLevelProducer;
				    var Client = kafka.Client;
				    var client = new Client(config.kafkaurl);
				    var producer = new HighLevelProducer(client);
				    
				    producer.on('ready', function(){

			            console.log("kafka producer>>>>>>"+JSON.stringify(payloads));
			            producer.send(payloads, function(err, data){
			                console.log("disconnect kafka data>>>>>>>"+JSON.stringify(data))
			            	producer.close();
			            	client.close();
			            });
			            
			            //删除redis
			            redisclient.del(fn,redis.print);
			        });

			        producer.on('error', function(err){
			            console.log("disconnect kafka error:"+err);
		            	producer.close();
		            	client.close();
			        })
			    }
		    });
	        
		})
	});
}


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


module.exports = function(io){
	
	videoLog(io);

}
