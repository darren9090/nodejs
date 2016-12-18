var http = require("http");
var kafka = require('kafka-node'); 
var Producer = kafka.Producer;  
var KeyedMessage = kafka.KeyedMessage;  
var Client = kafka.Client;  
var client = new Client('127.0.0.1:2181'); 

//队列
var queue = {  
    topic: "log"  
};  
var topic = argv.topic;  
var p = argv.p || 0;  
var a = argv.a || 0;  


var producer = new Producer(client, {  
    requireAcks: 1  
});  


http.createServer(function(req,res){

	res.writeHead(200,{"content-Type":"text/plain"});


	producer.on('ready', function() {  
        var args = {  
            id: '1234567890',  
            name: 'darren',  
            datetime: '2016-11-17 13:45:00'  
        }; 
        // var keyedMessage = new KeyedMessage('keyed', 'a keyed message');  
        producer.send([{ 

            topic: topic,  
            partition: p,  
            messages: [JSON.stringify(args)],  
            attributes: a 

        }], function(err, result) { 

            console.log(err || result);  
            process.exit(); 

        });  
      
        //create topics  
        // producer.createTopics(['t1'], function (err, data) {  
        //     console.log(data);  
        // });  
    });

	res.write("------OK---------");
	res.end();

}).listen(80);


     
    
  
