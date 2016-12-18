

var mysql = require('mysql'),
	querystring = require('querystring'),
	url = require('url'),
	redis = require('redis');

//配置信息
var config = {

	mysql_uri : '127.0.0.1',//本次测试数据库
	mysql_port: 3306 ,
	user_name : 'root',
	pass_word : 'root',
	database  : 'crawl_news',
    redisurl  : '127.0.0.1',
    redisport : '6379',
    redis_list_ecs_key : 'ec_list_key_',
    redis_detail_ec_key : 'ec_detail_key_',
    expire : 60 * 2 //单位：秒

}

//redis创建连接
var redisclient = redis.createClient(config.redisport, config.redisurl , {return_buffers:true});
//建立数据库连接
var connection = mysql.createConnection({
			        host : config.mysql_uri ,
			        user : config.user_name ,  
			        password : config.pass_word , 
			        database : config.database
			    });

var fun = {

    writeOut:function(response,str,callback){
        if(callback && callback!=null){

            response.end(callback + "(" + JSON.stringify(str) + ")" );

        }else{

            response.end(JSON.stringify(str));

        }
    }
}

/**
	获取爬取的数据列表
**/
function selectCrawlerList (param , request , response){
		
	console.log(" selectCrawlerList into...");
	request.on('data', function (chunk){});
    request.on("end",function(){

    	redisclient.get(config.redis_list_ecs_key + "" + param.date , function(err, reply){

    		var result = {};
			result.retCode = 0;
			result.msg = "成功";

    		if(err != null && err != ""){
    			console.log("selectCrawlerList redis get err:" + err);
    			result.retCode = 1;
				result.msg = "err : " + err;
    			fun.writeOut(response , result , param.callback);
    			return;
    		}
    		
    		if(reply!=null){

    			console.log("selectCrawlerList reply");
				result.data = eval("(" + reply + ")");
				fun.writeOut(response , result , param.callback);

    		}else{

    			console.log("selectCrawlerList not reply")
    			_mysqlQueryList(response , result , param);


    		}


    	});

    	
    });


}
/**
* 数据库查询日历列表
*/
function _mysqlQueryList(response , result , param){
	
	console.log(" _mysqlQueryList into...");

	var sql = "select * from ec where date = ? order by time asc ";
	connection.query(sql , [param.date],function (err, rows, fields) {

		console.log("mysql ec list length : " + rows + "  err:" + err);
		if ((err === null) && (typeof(rows[0]) != 'undefined')) {

			var datas = new Array();
			for (var i = 0; i < rows.length; i++) {

				var data = {};
				data['id'] = rows[i].id;
				data['time'] = rows[i].date.substring(rows[i].date.indexOf("-") + 1 , rows[i].date.length) + " " + rows[i].time;
				data['country'] = rows[i].country;
				data['event'] = rows[i].event;
				data['score'] = rows[i].score;
				data['beforeval'] = rows[i].beforeval.trim().enter();
				data['forecast'] = rows[i].forecast.trim().enter();
				data['publish'] = rows[i].publish.trim().enter();
				data['impression'] = rows[i].impression;

				datas.push(data);
			}

			result.data = datas;
			redisclient.set(config.redis_list_ecs_key + "" + param.date , JSON.stringify(datas) , redis.print)
			redisclient.expire(config.redis_list_ecs_key + "" + param.date , config.expire);
			
		}else if(rows == null || typeof(rows[0]) == undefined){

			result.retCode = 0;
			result.msg = "成功";
			result.data = new Array();
			
		}else{

			result.retCode = 1;
			result.msg = "err : " + err;

		}

		fun.writeOut(response , result , param.callback);
		console.log(" _mysqlQueryList quit...");
	});

}


/**
	获取爬取的详细
**/
function selectCrawlerDetail (param , request , response){
	
	console.log(" selectCrawlerDetail into...");
	request.on('data', function (chunk){});
    request.on("end",function(){

    	redisclient.get(config.redis_detail_ec_key + "" + param.id , function(err, reply){

    		var result = {};
			result.retCode = 0;
			result.msg = "成功";

    		if(err != null && err != ""){
    			console.log("selectCrawlerDetail redis get err:" + err);
    			result.retCode = 1;
				result.msg = "err : " + err;
    			fun.writeOut(response , result , param.callback);
    			return;
    		}

    		if(reply!=null){

    			console.log("selectCrawlerDetail reply");
				result.data = eval("(" + reply + ")");
				fun.writeOut(response , result , param.callback);

    		}else{

    			console.log("selectCrawlerDetail not reply");
    			_mysqlQueryDetail(response , result , param);

    		}
    		
    		console.log(" selectCrawlerDetail quit...");
    	})
    	
    });

}

/**
* 数据库查询日历详情
*/
function _mysqlQueryDetail(response , result , param){

	console.log(" _mysqlQueryDetail into...");
	var sql = "select * from ec where id = ? ";
	connection.query(sql , [param.id],function (err, rows, fields) {

		
		console.log("mysql ec detail length: " + rows + "  err:" + err);
		if ((err === null) && (typeof(rows[0]) != 'undefined')) {

			var data = {};
			data['title'] = rows[0].title;		//标题
			data['title1'] = rows[0].title1;	//下次公布时间
			data['title2'] = rows[0].title2;	//数据公布机构
			data['title3'] = rows[0].title3;	//发布频率
			data['title4'] = rows[0].title4;	//统计方法
			data['impress'] = rows[0].impress;	//数据影响
			data['explanation'] = rows[0].explanation;//数据释义
			data['readhappy'] = rows[0].readhappy;		//趣味解读

			result.data = data;
			redisclient.set(config.redis_detail_ec_key + "" + param.id , JSON.stringify(data) , redis.print)
			redisclient.expire(config.redis_detail_ec_key + "" + param.id , config.expire);
			
		}else if(typeof(rows[0]) == 'undefined'){

			result.retCode = 0;
			result.msg = "成功";
			result.data = {};

		}else {

			result.retCode = 0;
			result.msg = "err : " + err;
		}

		fun.writeOut(response , result , param.callback);
		console.log(" _mysqlQueryDetail quit...");

	});

}



function select(request , response){

	var param = url.parse(request.url).query;
	/*
	* category : 
			list : 财经日历列表；
			detail : 详情
	  date : 日期
	  id	: 数据id
	*/
	var paramjson = querystring.parse(param);
	var category = paramjson.category;
	console.log(">>>>>> select >>>>>>> param: "+param);

	if(category == "list"){

		selectCrawlerList(paramjson , request , response);

	}else if(category == "detail"){

		selectCrawlerDetail(paramjson , request , response);

	}else {

		//返回结果
		var result = {};
		result.retCode = 1;
		result.msg = "category 参数错误";
		fun.writeOut(response , result);

	}

}

String.prototype.trim = function() {
  return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
String.prototype.enter = function() {
	return this.replace(/[\r\n]/g, "");
}

exports.main = function (request , response) {
	
	select(request , response);

}


