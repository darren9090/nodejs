var pet = {

	words:"...",
	speak:function(words,name){
		this.words = words;
		console.log(this.words+"===="+name);
	}

}


var dog = {

	words:"I'm dog"
}

pet.speak.call(dog,"Smis","smis2");//call函数可以实现继承，但是是单独参数

// pet.speak.apply(dog,["sims1","smis2"]);

