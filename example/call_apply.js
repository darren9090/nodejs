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

pet.speak.call(dog,"Smis","smis2");//call函数可以实现继承，第二个参数是于被继承的参数保持完全一致

// pet.speak.apply(dog,["sims1","smis2"]);apply函数可以实现继承，第一个参数意义完全一致，第二个参数相当于被继承函数的参数组成数组实现

