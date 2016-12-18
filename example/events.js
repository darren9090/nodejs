var EventEmitter = require("events").EventEmitter

var life = new EventEmitter()

function play(who){
console.log("给"+who+ "玩");
}

life.on("go",play);

life.emit("go","汉子");//return boolean

//移除监听函数通过具名函数方式
life.removeListener("go",play);