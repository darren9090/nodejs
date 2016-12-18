var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.Client("127.0.0.1:2181"),
    producer = new Producer(client);

//exports listening to socket
module.exports = function(socket){

	console.log("---------------socket----------------");
	socket.on('create',function(data){

		console.log("---------------connect----------------");

		var msg = {
			id:"10101010",
			time:"20161126164900",
			type:1
		};
		payloads = [
            { 
                topic: config.config.videotopic, 
                messages:JSON.stringify(msg),
                partition: 0 
            }
        ];

        
        producer.on('ready', function(){

            console.log("connect kafka producer>>>>>>");
            producer.send(payloads, function(err, data){
                console.log("connect kafka producer data>>>>>>>"+data)
            });
            
        });

        producer.on('error', function(err){
            console.log("connect kafka producer error:"+err);
            retJSON = {
                retCode:1,
                msg:"error:"+ err
            };

        })
        sock.write('You said :"' + data + '"');
	});


	socket.on('stop',function(data){

		console.log("---------------disconnect-----------------");

		var msg = {
			id:"10101010",
			time:"20161126174900",
			type:0
		};
		payloads = [
            { 
                topic: config.config.videotopic, 
                messages:JSON.stringify(msg),
                partition: 0 
            }
        ];

        
        producer.on('ready', function(){

            console.log("connect kafka producer>>>>>>");
            producer.send(payloads, function(err, data){
                console.log("connect kafka producer data>>>>>>>"+data)
            });
            
        });

        producer.on('error', function(err){
            console.log("connect kafka producer error:"+err);
            retJSON = {
                retCode:1,
                msg:"error:"+ err
            };
        })

	});

}