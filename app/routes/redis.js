/*****

测试使用

******/
var redis   = require('redis');
var client  = redis.createClient('6379', '127.0.0.1');

client.get("VIDEO_LOG_iCf4VaH7RfXq8Yd9AAAV",function(err,res){  
   if(err){  
       console.log(err);  
   } else{  
       console.log(res);  
   }  
});
