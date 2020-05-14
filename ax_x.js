let canvas2 = document.getElementById("textCanvas_x");
let ctx2 = canvas2.getContext("2d");

ctx2.font = "12px URW Chancery L";
ctx2.fillStyle = 'white';

let x = 10;

for (let num = 0; num < 2050; num += 50) {
	let strNum = ""; 
	strNum += num;
	ctx2.fillText(strNum, x - 8, canvas2.height);
	x += 30;
}
