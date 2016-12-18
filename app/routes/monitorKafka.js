module.exports = function(){

	var http = require('http');
	var querystring = require('querystring');
	var redis = require('redis');
	var kafka = require('kafka-node');
	var HighLevelProducer = kafka.HighLevelProducer;
	var Client = kafka.Client;


	var config = {

	    kafka_1_url : "127.0.0.1:2181" ,
	    kafka_2_url : "127.0.0.1:2181" ,
	    kafka_3_url : "127.0.0.1:2181" ,
	    redisurl : '127.0.0.1',
	    redisport : '6379',
	    timeunit : 1000 * 60 * 30 ,	//每三十分钟 
	    topic : 'monitorkafka',	//kafka监控
	    kafkaKey : 'Kafka_SMS_STATUS',
	    pass : 'xxxxxxxx',
	    username : 'xxxxxxx',
	    // mobile:"xxxxxxxxx,xxxxxxxx"
	    mobile:"xxxxxxxxxx"

	};

	//redis
	var redisclient  = redis.createClient(config.redisport, config.redisurl , {return_buffers:true});

	//消费者
	var kafkac = require('kafka-node');
	var HighLevelConsumer = kafkac.HighLevelConsumer;
	var Clientc = kafkac.Client;
	var topics = [{ topic: config.topic }];
	var options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };

	var clientc1 = new Client(config.kafka_1_url);
	var consumer1 = new HighLevelConsumer(clientc1, topics, options);

	// var clientc2 = new Client(config.kafka_2_url);
	// var consumer2 = new HighLevelConsumer(clientc2, topics, options);

	// var clientc3 = new Client(config.kafka_3_url);
	// var consumer3 = new HighLevelConsumer(clientc3, topics, options);


	//生产者
	var redisclient  = redis.createClient(config.redisport, config.redisurl , {return_buffers:true});
	var client1 = new Client(config.kafka_1_url);
	var producer1 = new HighLevelProducer(client1);
	

	// var client2 = new Client(config.kafka_2_url);
	// var producer2 = new HighLevelProducer(client2);
	// producer2.createTopics([config.topic], true, function (err, data) {});

	// var client3 = new Client(config.kafka_3_url);
	// var producer3 = new HighLevelProducer(client3);
	// producer3.createTopics([config.topic], true, function (err, data) {});


	setInterval(function() {
		console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>1");
		producer1.createTopics([config.topic], true, function (err, data) {
			console.log("err:" + err + " data:" + data);
			sendMonitorSMS("err:"+err);
		  	producer1.close();
		  	client1.close();
		});
		producer1.on('ready', function () {
			console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>1111");
		  	send1();
		});
		producer1.on('error', function (err) {
		  	var msg = config.kafka_1_url + err;
		  	sendMonitorSMS(msg);
		  	producer1.close();
		  	client1.close();
		});

		// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>2");
		// producer2.on('ready', function () {
		// 	console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>2222");
		//   	send2();
		// });
		// producer2.on('error', function (err) {
		//   	var msg = config.kafka_2_url + err;
		//   	sendMonitorSMS(msg);
		//   	producer2.close();
		//   	client2.close();
		// });

		// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>3");
		// producer3.on('ready', function () {
		// 	console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>3333");
		//   	send3();
		// });
		// producer3.on('error', function (err) {
		//   	var msg = config.kafka_3_url + err;
		//   	sendMonitorSMS(msg);
		//   	producer3.close();
		//   	client3.close();
		// });
	}, config.timeunit);


	setInterval(function() {

		console.log(">>>>>>>>>consumer1>>>>>>>>");
		consumer1.on('message', function (message) {
		  console.log(">>>>>>>>consumer1:"+message);
		});
		consumer1.on('offsetOutOfRange', function (err) {
			console.log('>>>>>>>>consumer1:offsetOutOfRange', err);
		})
		consumer1.on('error', function (err) {
		  console.log('>>>>>>>>consumer1:error', err);
		});


		// console.log(">>>>>>>>>consumer2>>>>>>>>");
		// consumer2.on('message', function (message) {
		//   console.log(">>>>>>>>consumer2:"+message);
		// });
		// consumer2.on('offsetOutOfRange', function (err) {
		// 	console.log('>>>>>>>>consumer2:offsetOutOfRange', err);
		// })
		// consumer2.on('error', function (err) {
		//   console.log('>>>>>>>>consumer2:error', err);
		// });

		// console.log(">>>>>>>>>consumer3>>>>>>>>");
		// consumer3.on('message', function (message) {
		//   console.log(">>>>>>>>consumer3:"+message);
		// });
		// consumer3.on('offsetOutOfRange', function (err) {
		// 	console.log('>>>>>>>>consumer3:offsetOutOfRange', err);
		// })
		// consumer3.on('error', function (err) {
		//   console.log('>>>>>>>>consumer3:error', err);
		// });

	}, config.timeunit);


	
	function send1(){

		var message = new Date().Format("yyyy-MM-dd hh:mm:ss");
		producer1.send([
		    {topic: config.topic, messages: message + " - 1 - " + config.topic}
		], function (err, data) {
			console.log(">>>>>>>>>"+data+" err:"+err);
		  	var msg = config.kafka_1_url + err + " at " + message;
		  	sendMonitorSMS(msg);
		  	producer1.close();
		  	client1.close();
		});

	}


	function send2(){

		var message = new Date().Format("yyyy-MM-dd hh:mm:ss");
		producer2.send([
		    {topic: config.topic, messages: message + " - 2 - " + config.topic}
		], function (err, data) {
		  	var msg = config.kafka_2_url + err + " at " + message;
		  	sendMonitorSMS(msg);
		  	producer2.close();
		  	client2.close();
		});

	}


	function send3(){

		var message = new Date().Format("yyyy-MM-dd hh:mm:ss");
		producer3.send([
		    {topic: config.topic, messages: message + " - 3 - " + config.topic}
		], function (err, data) {
		  	var msg = config.kafka_3_url + err + " at " + message;
		  	sendMonitorSMS(msg);
		  	producer3.close();
		  	client3.close();
		});

	}


	function sendMonitorSMS(message){

		var date = new Date().Format("yyyyMMdd");
		redisclient.get(config.kafkaKey + date, function(err, reply){

			console.log("sendMonitorSMS get SMS send status: " + reply);

			if(!reply || reply==null || reply == "0"){
				var data = {
					user: config.username,
			        pass: config.pass,
			        mobile: config.mobile.split('|')[0],
			        content: "[消息来自：kafka连接状态监控-]" + message + "，请及时修复"
			    };
				var option = {
					method: "GET",  
			        host: "sms.xxxxxxx.com",  
			        port: 80,  
			        path: "/SMS/send.jsp?" + querystring.stringify(data)
				}

				
				var req = http.get(option , function(resp){

					console.log("result statusCode : "+resp.statusCode);
					var body = "";
					resp.on("data",function(d){
						body += d;
					});
					resp.on("end",function(){
						console.log(">>>>>end:"+body);

						var result = eval("(" + body + ")");
						if(result.code == 0){
							redisclient.set(config.kafkaKey  + date , "1" , redis.print);//保存状态成功1
						}

					});
				});
				req.end();
			}
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
}



