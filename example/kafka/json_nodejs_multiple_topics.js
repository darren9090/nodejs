
var http=require('http');
var querystring = require('querystring');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

//定义常量
var config = {

    kafkaurl : " 127.0.0.1:2181"

};

//输出结果
var fun = {

    writeOut:function(response,str){
        console.log("sendRequestToKafKaQueue result >>>>>>> " + JSON.stringify(str))
        response.end(JSON.stringify(str));
    },
    isUndefined:function(str){
        return str?null:str;
    },
    getClientIp:function (req) {
        return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    },
    checkParams:function (request,response,resultObj) {
        
        var data = {
            retCode:1,
            msg:""
        };
        if(resultObj.platform!='web' && resultObj.platform!='androd' && resultObj.platform!='ios' ){
            data.msg = "platform paramter error";
            fun.writeOut(response,data);
            return false;
        }

        if(resultObj.logtype!='click' && resultObj.logtype!='in' && resultObj.logtype!='out' && resultObj.logtype!='heart' ){
            data.msg = "logtype paramter error";
            fun.writeOut(response,data);
            return false;
        }
        if((resultObj.platform!='androd' && resultObj.appKey!='agg_android') ||
           (resultObj.platform!='ios' && resultObj.appKey!='agg_ios' ) ){
            data.msg = "appKey paramter error";
            fun.writeOut(response,data);
            return false;
        }

        return true;

    }
}


//启动多线程
if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++){
        cluster.fork();//子线程开始工作
    }


    cluster.on('exit', function(worker, code, signal){
        console.log('worker ' + worker.process.pid + ' died');
    });


} else {

    //请求开始工作
    console.log("The Server start working .........");
    console.log("The Server numCPUs:>>>>> "+numCPUs);
    //发送消息给Kafka队列
    sendRequestToKafKaQueue()

}


/*
    Function to start the server and do all the heavy lifting.

    Accept : JSON
    Listen Port : 8125
    URL :   /send/topic/log ：接收日志处理请求
            /send/topic/B
            /send/topic/C

*/
function sendRequestToKafKaQueue(){
    
    var server_start = http.createServer(function(request, response){

        console.log("sendRequestToKafKaQueue request.method>>>>>>"+request.method);
        console.log("sendRequestToKafKaQueue request.url>>>>>>"+request.url);

        response.writeHeader(200, {"Content-Type": "application/json"});

        if(request.method === "POST"){
            
            var kafka = require('kafka-node'),
            Producer = kafka.Producer,
            client = new kafka.Client(config.kafkaurl),
            producer = new Producer(client);

            var retJSON = {
                retCode:0,
                msg:"success" 
            };

            if (request.url.indexOf("/send/topic/log") > -1){

                
                request.on('data', function (chunk){

                    
                    console.log("sendRequestToKafKaQueue data before >>>>>>>" + chunk.toString('utf8'))
                    var result = querystring.parse(chunk.toString('utf8'));
                    console.log("result:"+JSON.stringify(result));
                    //判断数据，并组织数据
                    if(!fun.checkParams(request,response,result)){
                        return;
                    }

                    //ip
                    result.ip = fun.getClientIp(request);

                    payloads = [
                        { 
                            topic: 'log', 
                            messages: JSON.stringify(result),//JSON.toString(result), 
                            partition: 0 
                        },
                    ];
                    producer.on('ready', function(){

                    
                        console.log("sendRequestToKafKaQueue kafka producer>>>>>>");
                        producer.send(payloads, function(err, data){
                            console.log("sendRequestToKafKaQueue kafka producer data>>>>>>>"+JSON.stringify(data))
                        });
                        
                    });

                    producer.on('error', function(err){
                        console.log("sendRequestToKafKaQueue kafka producer error:"+err);
                        retJSON = {
                            retCode:1,
                            msg:"error:"+ err
                        };

                    })

                });
                request.on("end",function(){
                    fun.writeOut(response,retJSON);
                });

            } else {

                var chunk = "";
                request.on('data', function (chunk){
                    
                    chunk += chunk;
                    
                });
                retJSON = {
                    retCode:1,
                    msg:"ERROR: Could not Process this URL :" + request.url + ",data : " + chunk.toString('utf8') 
                }
                fun.writeOut(response,retJSON);
            }
        }else{
            retJSON = {
                retCode:1,
                msg:"ERROR: Could not Process Get request :" + request.url
            }
            fun.writeOut(response,retJSON);
        }


    });

    server_start.listen(8125);
    // server_start.on('connection',function(connectionListener){
    //     console.log("+++++++++++++++++++++++++++++++++++");
    //     console.log(connectionListener);
    // });
    server_start.on('request',function(obj){
        console.log("+++++++++++++++++++++++++++++++++++");
        
    });
}
