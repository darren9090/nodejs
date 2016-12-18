/*
    Function 

    Accept : JSON
    Listen Port : 8125
    URL :   /send/topic/log ：接收日志处理请求

*/

exports.log = function (request,response){
    var querystring = require('querystring'),url = require('url');


    //定义常量
    var config = {

        kafkaurl : "127.0.0.1:2181,127.0.0.1:2181,127.0.0.1:2181"

    };

    //输出结果
    var fun = {

        writeOut:function(response,str,callback){
            //console.log("sendRequestToKafKaQueue result >>>>>>> " + JSON.stringify(str));
            
            if(callback && callback!=null){
                response.end(callback + "(" + JSON.stringify(str) + ")");
            }else{
                response.end(JSON.stringify(str));
            }
        },
        getOutClientIp:function (req) {

            // return req.headers['x-forwarded-for'] ||
            // req.connection.remoteAddress ||
            // req.socket.remoteAddress ||
            // req.connection.socket.remoteAddress;
            var ipAddress;
            var forwardIpStr = req.headers['x-forwarded-for'];
            if (forwardIpStr) {
                var forwardIp = forwardIpStr.split(',');
                ipAddress = forwardIp[0];
            }
            if(!ipAddress){
                ipAddress = req.connection.remoteAdress;
            }
            if (!ipAddress) {
                ipAddress = req.socket.remoteAdress;
            }
            if (!ipAddress) {
                if (req.connection.socket) {
                    ipAddress = req.connection.socket.remoteAdress;
                }
                else if (req.headers['remote_addr']) {
                    ipAddress = req.headers['remote_addr'];
                }
                else if (req.headers['client_ip']) {
                    ipAddress = req.headers['client_ip'];
                }
                else {
                    ipAddress = req.ip;
                }
            }
            console.log(">>>>ip1>>>>" + ipAddress);
            return ipAddress;
        },
        getInnerClientIp:function (req) {

            // return req.headers['x-forwarded-for'] ||
            // req.connection.remoteAddress ||
            // req.socket.remoteAddress ||
            // req.connection.socket.remoteAddress;

            var ipAddress = req.connection.remoteAdress;
            if (!ipAddress) {
                ipAddress = req.socket.remoteAdress;
            }
            if (!ipAddress) {
                if (req.connection.socket) {
                    ipAddress = req.connection.socket.remoteAdress;
                }
                else if (req.headers['remote_addr']) {
                    ipAddress = req.headers['remote_addr'];
                }
                else if (req.headers['client_ip']) {
                    ipAddress = req.headers['client_ip'];
                }
                else {
                    ipAddress = req.ip;
                }
            }
            var forwardIpStr = req.headers['x-forwarded-for'];
            if (!ipAddress && forwardIpStr) {
                var forwardIp = forwardIpStr.split(',');
                ipAddress = forwardIp[0];
            }
            console.log(">>>>ip2>>>>" + ipAddress);
            return ipAddress;
        }
    }

    console.log("sendRequestToKafKaQueue request.method>>>>>>"+request.method);
    console.log("sendRequestToKafKaQueue request.url>>>>>>"+request.url);
    response.writeHeader(200, {"Content-Type": "application/json"});

        
    // var kafka = require('kafka-node'),
    // Producer = kafka.Producer,
    // client = new kafka.Client(config.kafkaurl),
    // producer = new Producer(client);

    var kafka = require('kafka-node');
    var HighLevelProducer = kafka.HighLevelProducer;
    var Client = kafka.Client;
    var client = new Client(config.kafkaurl);
    var producer = new HighLevelProducer(client);

    var retJSON = {
        retCode:0,
        msg:"success" 
    };

    var arg = url.parse(request.url).query;
    var param = querystring.parse(arg);
    var callback = param.callback;

    if(request.method === "POST"){
        request.on('data', function (chunk){

            if(chunk == null || chunk.toString('utf8') == null){
                return;
            }


            // console.log(chunk.toString('utf8'))
            // console.log(dataStr)

            // var result = querystring.parse(chunk);
            // result = (result == null?{}:result);
            // console.log(result);

            // var content = null;
            // var resultarr = null;
            // try{
            //     //content = eval("(" + result.content + ")");
            //     resultarr = result.data;
            // }catch(e){}
            var resultarr = null;
            var result = null;
            var dataStr = null;
            try{

                dataStr = decodeURIComponent(chunk.toString('utf8'));
                dataStr = dataStr.toString('utf8').substring(dataStr.indexOf("content=") + 8 , dataStr.toString('utf8').length);
                console.log("sendRequestToKafKaQueue data before >>>>>>>");
                console.log(dataStr);
                
                result = JSON.parse(dataStr);
                resultarr = result.data;
            }catch(e){}


            if(resultarr && resultarr!=null && resultarr.length > 0){
                console.log(">>>>>>>length:"+resultarr.length)
                for(var i = 0;i < resultarr.length;i++){
                    var resultitem = resultarr[i];
                    //外网ip
                    resultitem.ip = fun.getOutClientIp(request);
                    //内网ip
                    resultitem.ip2 = fun.getInnerClientIp(request);

                    var date = new Date();
                    resultitem.date = date.Format("yyyyMMdd");
                    resultitem.time = date.Format("hhmmss");

                    payloads = [
                        { 
                            topic: 'log', 
                            messages:JSON.stringify(resultitem),// JSON.toString(result), 
                            partition: 0 
                        },
                    ];
                    
                    producer.on('ready', function(){

                        console.log("POST send kafka");
                        producer.send(payloads, function(err, data){
                            producer.close();
                            client.close();
                            console.log("sendRequestToKafKaQueue kafka producer data>>>>>>>"+JSON.stringify(data))
                        });
                        
                    });

                    producer.on('error', function(err){
                        console.log("sendRequestToKafKaQueue kafka producer error:"+err);
                        producer.close();
                        client.close();
                        
                        retJSON.retCode = 1;
                        retJSON.msg = err;

                    })
                }
            }

        });
        request.on("end",function(){
            fun.writeOut(response , retJSON , callback);
        });
    }else if(request.method === "GET"){

        request.on('data', function (chunk){});
        request.on("end",function(){

            //ip
            param.ip = fun.getClientIp(request);
            var date = new Date();
            param.date = date.Format("yyyyMMdd");
            param.time = date.Format("hhmmss");
            
            payloads = [
                {
                    topic: 'log', 
                    messages:JSON.stringify(param),// JSON.toString(param), 
                    partition: 0 
                },
            ];

            producer.on('ready', function(){
                console.log("GET send kafka");
                producer.send(payloads, function(err, data){
                    producer.close();
                    client.close();
                    console.log("sendRequestToKafKaQueue kafka producer data>>>>>>>"+JSON.stringify(data))
                });
                
            });

            producer.on('error', function(err){
                console.log("sendRequestToKafKaQueue kafka producer error:"+err);

                producer.close();
                client.close();
                
                retJSON.retCode = 1;
                retJSON.msg = err;

            })
            fun.writeOut(response , retJSON , callback);
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
