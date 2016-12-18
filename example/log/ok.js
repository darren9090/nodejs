var url = require('url');
var http = require('http');
var qstr = require('querystring');
var mysql = require('mysql');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var topic = require('./send_topic.js');

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
    startServer()

}


/****
** 开启服务
**/
function startServer(){

    var connection = mysql.createConnection({ //建立数据库连接
        host:'127.0.0.1',  
        user:'root',  
        password:'zj@r00t-2015.', 
        database: 'crawl_news' 
    });
    http.createServer(function (req, res) {

        var arg = url.parse(req.url).query;
        var data = [];
        var rest={};
        var tp=qstr.parse(arg).tp;
        var callback=qstr.parse(arg).callback;
        console.log(tp);
        if(typeof(tp)=='undefined'){
            console.log('tp cant be null');
            
            data[0]={
                  error : 'tp cant be null'
            }
            rest={
                    state : 1,
                    data : data
            }
            sendSms(req,res,rest);
        }if("1"==tp){
                    
            data=[
               {"id":111,"name":"最新文章","src":"华尔街见闻"},
               {"id":222,"name":"贵金属头条","src":"FX168"},
               {"id":333,"name":"进阶视角","src":"FX168"}
            ]
                
            rest={
                state : 0,
                data : data
            }
            sendSms(req,res,rest);          
        }else if ("2"==tp){
            var siteid = qstr.parse(arg).siteid;
            var page = qstr.parse(arg).page;
            var pageHas = page*10;
            var tt=0;

            //下面是数据库查询，很简单
            connection.query('select count(newsid) as ct from news join newsimg on news.linkurl=newsimg.linkurl  where siteid= ?',[siteid],function (err, rows, fields) {
                if ((err === null) && (typeof(rows[0]) != 'undefined')) {  
                    console.log(rows);
                    tt=rows[0].ct;
                }
            });
            connection.query("SELECT news.newsid,news.source,news.title,newsimg.imgsrc,date_format(news.pubtime,'%Y-%m-%d %T') as pubtime,newsimg.textbref,news.siteid FROM news  join newsimg on newsimg.linkurl = news.linkurl where siteid = ? ORDER BY news.pubtime desc limit ?,10",[siteid,pageHas],function (err, rows, fields) {
                console.log(err);
                if ((err === null) && (typeof(rows[0]) != 'undefined')) {           
                        console.log(rows.length);
                        for(var i=0; i < rows.length; i++) {
                            var first=rows[i];
                            data[i] = {
                                newsid : rows[i].newsid,
                                title: rows[i].title,
                                imgsrc: rows[i].imgsrc,
                                textbref: rows[i].textbref,
                                siteid: rows[i].siteid,
                                pubtime : rows[i].pubtime
                            }
                        }
                        rest={
                            state : 0,
                            total:tt,
                            data : data
                        }
                        sendSms(req,res,rest);
                    } else {
                        console.log(siteid);
                        if((siteid === null)){
                            data[0]={
                              error : 'siteid cant be null'
                            }
                        }else{
                            data[0]={
                                error : 'data is null'
                            }
                        }
                                
                        rest={
                            state : 1,
                            data : data
                        }
                        sendSms(req,res,rest);
                    }
            });
        }else if ("3"==tp){
            var newsid = qstr.parse(arg).newsid;
            //下面是数据库查询，很简单
                connection.query("SELECT news.title,news.content,date_format(news.pubtime,'%Y-%m-%d %T') as pubtime,newsimg.textbref,newsimg.imgsrc,case news.siteid  when '111' then '华尔街见闻' when '222' then 'FX168' when '333' then 'FX168' else ''  end as siteid FROM news join newsimg on newsimg.linkurl = news.linkurl where news.newsid = ? ",[newsid],function (err, rows, fields) {
            if ((err === null) && (typeof(rows[0]) != 'undefined')) {           
                    console.log(rows.length);
                    for(var i=0; i < rows.length; i++) {
                        var first=rows[i];
                            data[i] = {
                            title: rows[i].title,
                            content : rows[i].content,
                            textbref : rows[i].textbref,
                            imgsrc : rows[i].imgsrc,
                            siteid : rows[i].siteid,
                            pubtime : rows[i].pubtime
                        }
                    }
                            
                    rest={
                        state : 0,
                        data : data
                    }

                    sendSmsNew(req,res,rest,callback);
                } else {
                    console.log(newsid);
                    if((newsid === null)){
                            data[0]={
                              error : 'newsid cant be null'
                            }
                    }else{
                        data[0]={
                              error : 'data is null'
                            }
                    }
                    rest={
                        state : 1,
                        data : data
                    }
                    sendSms(req,res,rest,callback);
                }
                });
        }else if("4"==tp){
            topic.sendRequestToKafKaQueue(req,res);
        }
    }).listen(3000);
}



function sendSms(req,res,rest) {
	var body =rest;
	//HTTP请求参数	
    var options = {
        host: '10.99.12.208',
            port: 3000,
            path: '/response_logic',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': body.length
            } 
    };

    var buf_list = new Array();
    req.on('data',function(data1){
            buf_list.push(data1);
    });

    req.on('error', function (e) {
        //throw e.message;
    });

    // write data to request body
    res.write(JSON.stringify(body),'utf-8');
    res.end();

}

function sendSmsNew(req,res,rest,callback) {
	var body =rest;
	//HTTP请求参数	
    var options = {
        host: '10.99.12.207',
        port: 3000,
        path: '/response_logic',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': body.length
        }
    };

    var buf_list = new Array();
    req.on('data',function(data1){
        buf_list.push(data1);
    });

    req.on('error', function (e) {
        //throw e.message;
    });

    // write data to request body
    if(callback){
        var str =  callback + '(' + JSON.stringify(body) + ')';//jsonp
		res.write(str,'utf-8');
	}else{
	   res.write(JSON.stringify(body),'utf-8');   
	}
    res.end();

}