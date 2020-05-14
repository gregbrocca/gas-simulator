let firstChart = false;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let objArray = [];
let probArray = [];
let paused = false;
let lastTime = (new Date()).getTime();
let currentTime = 0;
let dt = 0;
let begin = true;
let temperature;
let background = document.getElementById("canvImg");
var myElementToCheckIfClicksAreInsideOf = document.querySelector('#dropDownP');
let arrow = false;
var myElementToCheckIfClicksAreInsideOf1 = document.querySelector('#dropDownC1');
let arrow1 = false;
var myElementToCheckIfClicksAreInsideOf2 = document.querySelector('#dropDownC2');
let arrow2 = false;
var myElementToCheckIfClicksAreInsideOf3 = document.querySelector('#dropDownD');
let arrow3 = false;
let N = 400;
let m = 2.66e-26;
let dV = 50;
let k = 1.38e-23;
let v = 50;
let balls;
let angolox;
let vel;
let color;

class Ball {
    
    constructor(x, y, dx, dy, radius, color){
        this.radius = radius;
        this.x = x;
        this.y = y;
        
        this.dx = dx;
        this.dy = dy;

        // mass is that of a sphere as opposed to circle
        // it *does* make a difference in how realistic it looks
        this.mass = this.radius * this.radius * this.radius;
        this.color = color;
    };    

    draw() {
        ctx.beginPath();
        ctx.arc(Math.round(this.x), Math.round(this.y), this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
       // ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();
    };

    speed() {
        // magnitude of velocity vector
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    };
    angle() {
        // velocity's angle with the x axis
        return Math.atan2(this.dy, this.dx);
    };
    onGround() {
        return (this.y + this.radius >= canvas.height)
    };
};

function randomX() {
    let x = Math.floor(Math.random() * canvas.width);
    if (x < 30) {
        x = 30;
    } else if (x + 30 > canvas.width) {
        x = canvas.width - 30;
    }
    return x;
}

function randomY() {
    let y = Math.floor(Math.random() * canvas.height);
    if (y < 30) {
        y = 30;
    } else if (y + 30 > canvas.height) {
        y = canvas.height - 30;
    }
    return y;
}

function distanceNextFrame(a, b) {
    return Math.sqrt((a.x + a.dx - b.x - b.dx)**2 + (a.y + a.dy - b.y - b.dy)**2) - a.radius - b.radius;
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}


document.addEventListener("keydown", keyDownHandler);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function keyDownHandler(event) {
    if (event.keyCode == 80) { // p
        if(!chart) paused = !paused;
    }
}


function canvasBackground() {
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, -2, 0, canvas.width + 4, canvas.height + 2); 
}

function wallCollision(ball) {
    if (ball.x - ball.radius + ball.dx < 0 ||
        ball.x + ball.radius + ball.dx > canvas.width) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius + ball.dy < 0 ||
        ball.y + ball.radius + ball.dy > canvas.height) {
        ball.dy *= -1;
    }
    if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
    }
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
    }
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
    }    
}

function ballCollision() {
    for (let i=0; i<objArray.length-1; i++) {
        for (let j=i+1; j<objArray.length; j++) {
            let ob1 = objArray[i]
            let ob2 = objArray[j]
            let dist = distance(ob1, ob2)

            if (dist < ob1.radius + ob2.radius) {              
                let theta1 = ob1.angle();
                let theta2 = ob2.angle();
                let phi = Math.atan2(ob2.y - ob1.y, ob2.x - ob1.x);
                let m1 = ob1.mass;
                let m2 = ob2.mass;
                let v1 = ob1.speed();
                let v2 = ob2.speed();

                let dx1F = (v1 * Math.cos(theta1 - phi) * (m1-m2) + 2*m2*v2*Math.cos(theta2 - phi)) / (m1+m2) * Math.cos(phi) + v1*Math.sin(theta1-phi) * Math.cos(phi+Math.PI/2);
                let dy1F = (v1 * Math.cos(theta1 - phi) * (m1-m2) + 2*m2*v2*Math.cos(theta2 - phi)) / (m1+m2) * Math.sin(phi) + v1*Math.sin(theta1-phi) * Math.sin(phi+Math.PI/2);
                let dx2F = (v2 * Math.cos(theta2 - phi) * (m2-m1) + 2*m1*v1*Math.cos(theta1 - phi)) / (m1+m2) * Math.cos(phi) + v2*Math.sin(theta2-phi) * Math.cos(phi+Math.PI/2);
                let dy2F = (v2 * Math.cos(theta2 - phi) * (m2-m1) + 2*m1*v1*Math.cos(theta1 - phi)) / (m1+m2) * Math.sin(phi) + v2*Math.sin(theta2-phi) * Math.sin(phi+Math.PI/2);

                ob1.dx = dx1F;                
                ob1.dy = dy1F;                
                ob2.dx = dx2F;                
                ob2.dy = dy2F;

                ob1.color = setColor(ob1.speed());
                ob2.color = setColor(ob2.speed());
          
                staticCollision(ob1, ob2);
                
            }            
        }
        wallCollision(objArray[i]);
    }

    if (objArray.length > 0)
        wallCollision(objArray[objArray.length - 1])
}

function staticCollision(ob1, ob2, emergency = false)
{
    let overlap = ob1.radius + ob2.radius - distance(ob1, ob2);
    let smallerObject = ob1.radius < ob2.radius ? ob1 : ob2;
    let biggerObject = ob1.radius > ob2.radius ? ob1 : ob2;

    if (emergency) [smallerObject, biggerObject] = [biggerObject, smallerObject]
    
    let theta = Math.atan2((biggerObject.y - smallerObject.y), (biggerObject.x - smallerObject.x));
    smallerObject.x -= overlap * Math.cos(theta);
    smallerObject.y -= overlap * Math.sin(theta); 

    if (distance(ob1, ob2) < ob1.radius + ob2.radius) {
        // we don't want to be stuck in an infinite emergency.
        // so if we have already run one emergency round; just ignore the problem.
        if (!emergency) staticCollision(ob1, ob2, true)
    }
}

function moveObjects() {
    for (let i=0; i<objArray.length; i++) {
        let ob = objArray[i];
        ob.x += ob.dx * dt;
        ob.y += ob.dy * dt;
    }    
}

function drawObjects() {
    for (let obj in objArray) {
        objArray[obj].draw();
    }
}

document.getElementById("temp").style.background = '#5561ED';

function setColorSlider(t) {
    switch(t) {
        case 50:
            return '#0013E5';
        case 150:
            return '#1C2DE7';
        case 250:
            return '#3847EA';
        case 350:
            return '#5561ED';
        case 450:
            return '#717BF0';
        case 550:
            return '#8D96F3';
        case 650:
            return '#AAB0F6';
        case 750:
            return '#C6CAF9';
        case 850:
            return '#E2E4FC';
        case 950:
            return '#FDE9E7';
        case 1050:
            return '#FCD3D0';
        case 1150:
            return '#FABDB8';
        case 1250:
            return '#F9A7A1';
        case 1350:
            return '#F79189';
        case 1450:
            return '#F67B72';
        case 1550:
            return '#F4655A';
        case 1650:
            return '#F34F43';
        case 1750:
            return '#F1392B';
        case 1850:
            return '#F1392B';
        case 1950:
            return '#F02414';
        case 2050:
            return '#F02414';
    }
}

document.getElementById("displayTemp").innerHTML = 400; 

document.getElementById("temp").oninput = function()
{
    temperature = parseInt(document.getElementById("temp").value);
    generateBalls(temperature);
    if(chart) {
        drawChart(temperature);   
    }
    document.getElementById("temp").style.background = setColorSlider(temperature);
    if(temperature == 50) document.getElementById("displayTemp").innerHTML = 1; 
    else document.getElementById("displayTemp").innerHTML = temperature - 50; 
}

function drawChart(T) 
{
    document.getElementById("textCanvas_x").style.visibility = "visible";
    generateBalls(T);
    let index = 0 
    let cx = 10 , cy;
    for(let i = 0; i < 59; i++) {
        cy = canvas.height - 10;
        if(probArray[i] != 0) {
            n = 0;
            while(n < probArray[i]) {
                objArray[index + n].x = cx;
                objArray[index + n].y = cy;
                cy -= 12;
                n++;
            }
            index += n;
        }
        cx += 30;
    }
}

function drawXY() {
    ctx.beginPath(); 
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    //x-axis
    ctx.moveTo(canvas.width - 1, canvas.height - 2);
    ctx.lineTo(canvas.width - 15, canvas.height - 12);
    ctx.font = "18px URW Chancery L";
    ctx.fillStyle = 'black';
    ctx.fillText("x(m/s)", canvas.width - 70, canvas.height - 6);

    //y-axis
    ctx.moveTo(1, 0);
    ctx.lineTo(12, 15);
    ctx.font = "18px URW Chancery L";
    ctx.fillStyle = 'black';
    ctx.fillText("y(#molecules)", 12, 13);


    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 1;   
}

function draw() {
    
    currentTime = (new Date()).getTime();
    dt = (currentTime - lastTime) / 1000;
    
    dt *= 30;

    if(begin) {
        generateBalls(300);
        begin = false;
    }

    //work in progress
    if(chart && firstChart) { 
        drawChart(parseInt(document.getElementById("temp").value));
        firstChart = false;
    }

    canvasBackground();

    if(chart) drawXY();
    
    if (!paused) {
        moveObjects();
        ballCollision();
    }
    
    drawObjects();
    
    lastTime = currentTime;
    window.requestAnimationFrame(draw);
}

document.body.addEventListener('click', function (event) {
    if (myElementToCheckIfClicksAreInsideOf.contains(event.target)) {
        arrow = !arrow;
        if(arrow) {
            document.getElementById("dropDownP").innerHTML = '&#9660;';
            document.getElementById("dropDownC1").style.display = "inline";
            document.getElementById("dropDownP1").style.display = "inline";
            document.getElementById("dropDownC2").style.display = "inline";
            document.getElementById("dropDownP2").style.display = "inline";
            window.location.replace("#temp");
        }
        else {
            document.getElementById("dropDownP").innerHTML = '&#9658;';
            document.getElementById("dropDownC1").style.display = "none";
            document.getElementById("dropDownC1").innerHTML = '&#9658';
            document.getElementById("dropDownC2").innerHTML = '&#9658';
            document.getElementById("dropDownP1").style.display = "none";
            document.getElementById("dropDownC2").style.display = "none";
            document.getElementById("dropDownP2").style.display = "none";
            document.getElementById("expSIM").style.display = "none";
            document.getElementById("expMB").style.display = "none";
            window.location.replace("#title");
        }
    }
});

document.body.addEventListener('click', function (event) {
    if (myElementToCheckIfClicksAreInsideOf1.contains(event.target)) {
        arrow1 = !arrow1;
        if(arrow1) {
            document.getElementById("dropDownC1").innerHTML = '&#9660;';
            document.getElementById("dropDownC2").innerHTML = '&#9658;';
            document.getElementById("expMB").style.display = "inline";
            document.getElementById("expSIM").style.display = "none";
            arrow2 = !arrow2;
            window.location.replace("#dropDownP1");
        }
        else {
            document.getElementById("dropDownC1").innerHTML = '&#9658;';
            document.getElementById("expMB").style.display = "none";
            window.location.replace("#temp");
        }
    }
});

document.body.addEventListener('click', function (event) {
    if (myElementToCheckIfClicksAreInsideOf2.contains(event.target)) {
        arrow2 = !arrow2;
        if(arrow2) {
            document.getElementById("dropDownC2").innerHTML = '&#9660;';
            document.getElementById("dropDownC1").innerHTML = '&#9658;';
            document.getElementById("expMB").style.display = "none";
            document.getElementById("expSIM").style.display = "inline";
            arrow1 = !arrow1;
            window.location.replace("#dropDownC1");
        }
        else {
            document.getElementById("dropDownC2").innerHTML = '&#9658;';
            document.getElementById("expSIM").style.display = "none";
            window.location.replace("#temp");
        }
    }
});

document.body.addEventListener('click', function (event) {
    if (myElementToCheckIfClicksAreInsideOf3.contains(event.target)) {
        arrow3 = !arrow3;
        if(arrow3) {
            document.getElementById("dropDownD").innerHTML = '&#9660;';
            document.getElementById("moreData").style.display = "inline";
            window.location.replace("#temp");
        }
        else {
            document.getElementById("dropDownD").innerHTML = '&#9658;';
            document.getElementById("moreData").style.display = "none";
            window.location.replace("#title");
        }
    }
});


function setColor(vel)
{
    if(vel < 1)
        return '#FFF196';
    else if(vel < 2)
        return '#FFEB62';
    else if(vel < 3)
        return '#FFE748';
    else if(vel < 4)
        return '#FFE114';
    else if(vel < 5)
        return '#FFCC0F';
    else if(vel < 6)
        return '#FFB70B';
    else if(vel < 7)
        return '#FFA206';
    else if(vel < 8)
        return '#FF8D02';
    else if(vel < 9)
        return '#FF8300';
    else if(vel < 10)
        return '#F26200';
    else if(vel < 11)
        return '#EB5100';
    else if(vel < 12)
        return '#E54100';
    else if(vel < 13)
        return '#DF3100';
    else if(vel < 14)
        return '#DB2800';
    else if(vel < 15)
        return '#D82000';
    else if(vel < 16)
        return '#D21000';
    else if(vel < 17)
        return '#CF0800';
    else 
        return '#CC0000';
}

function generateBalls(T)
{
    v = 50;
    objArray = [];
    for(let i = 0; i < 59; i++) { //each 50m/s, with dv = 50, until 2000m/s
        //molecules number between v and v+50
        probArray[i] = Math.floor(4 * Math.PI * N * (((m) / (2 * Math.PI * k * T))**1.5) * (v**2) * Math.exp((-m) / (2 * k * T) * (v**2)) * dV);
        v += 50;
    }
    v = 50;
    let l;
    for(let i = 0; i < 59; i++) {
        let n = 0;
        balls = 0;
        while(n < probArray[i]) {
            angolox = ((Math.random() * 360) * Math.PI) / 180; //converted in radians;
            vel = Math.round((Math.random() * 50) + v) / 160;
            objArray[objArray.length] = new Ball(randomX(), randomY(), Math.cos(angolox) * vel, Math.sin(angolox) * vel, 5, setColor(vel));
            balls++;
            n++;
        }
    v += 50;
    }
}

let chart = false

function drawChart_bool() {
    if(chart) {
        generateBalls(parseInt(document.getElementById("temp").value));
        document.getElementById("textCanvas_x").style.visibility = "hidden";
        paused = false;
    }
    else {
        firstChart = true;
        paused = true;
    }
    chart = !chart;
}

draw();
































