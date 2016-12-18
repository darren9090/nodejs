var http = require("http");
var cheerio = require("cheerio");//npm install cheerio命令 (或npm install --verbose --registry=https://registry.npm.taobao.org cheerio)
var url = "http://www.imooc.com/learn/348";


function filterChapters(html){


	var $ = cheerio.load(html);//类似于jquery
	var chapters = $(".chapter")

	var courseData = [];
	chapters.each(function(item){

		var chapter = $(this);
		var chapterTitle = chapter.find("strong").text().trim();
		var videos = chapter.find(".video").children("li");
		console.log("title:"+chapterTitle);
		//定义返回结构
		var chapterData = {
			chapterTitle:chapterTitle,
			videos:[]
		}

		videos.each(function(item){
			var video = $(this).find(".J-media-item");

			var videoTitle = video.text().trim();
			var id = video.attr("href").split("video/")[1].trim();

			chapterData.videos.push({
				title:videoTitle,
				id:id
			});
		})
		courseData.push(chapterData);

	});

	return courseData;
}


function printRSInfo(rs){
	rs.forEach(function(item){
		var chapterTitle = item.chapterTitle;
		console.log(" "+chapterTitle+"\n");

		item.videos.forEach(function(video){
			console.log("["+video.id+"]"+video.title+"\n");
		});
	});

}

http.get(url,function(res){

	var html = "";

	res.on("data",function(data){
		html += data;
	});

	res.on("end",function(){
	
		var rs = filterChapters(html);

		printRSInfo(rs);
	});


}).on("error",function(){
	console.log("获取课程内容错误");
}).on("socket",function(socket){
	console.log(socket);
});

// http.get()自动封装了end()
// http.request() 需要手动调用end()

