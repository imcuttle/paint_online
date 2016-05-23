/**
 * Created by Yc on 2016/5/17.
 */

var canvas = document.getElementsByTagName('canvas')[0],
    ctx = canvas.getContext('2d'),
    msg = document.getElementById('msg'),
    ranger = document.getElementById('ranger'),
    colors = document.getElementById('colors');

var input = document.getElementById('input-msg');
var socket = io.connect();
socket.on('server msg',function (data) {
    var ele = document.createElement('p');
    ele.innerHTML = data;
    msg.appendChild(ele);
})
socket.on('login',function () {
    socket.emit('login',prompt('输入你的姓名'));
});

socket.on('paint paths',function (paths) {
    paths = JSON.parse(paths)
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(var k in paths)
        Ctl.drawPts(ctx, paths[k]);
})
socket.on('paint pts',function (pts) {
    //canvas.paths = paths;
    pts = JSON.parse(pts)
    if(!pts) return;
    Ctl.drawPts(ctx, pts);
});
socket.on('cmd',function (data) {
    console.log(JSON.parse(data));
})

window.onload = function () {
    Ctl.init();
    function resize() {
        canvas.width = document.getElementsByClassName('col-7')[0].clientWidth;
        canvas.paths = canvas.pts = [];
        socket.emit('repaint');
    }
    this.addEventListener('resize',resize);
    resize();
    input.onkeydown = function (e) {
        if(e.keyCode === 13 && this.value!=''){
            socket.emit('client msg',this.value);
            this.value = '';
            msg.scrollTop = msg.scrollHeight;
        }
    }
}

canvas.addEventListener('mousemove',function (e) {
    if(e.buttons === 1) {
        var x = e.offsetX, y = e.offsetY;
        Ctl.addPos(x,y);
        Ctl.drawPts(ctx, this.pts);
        socket.emit('paint',JSON.stringify({data:new Path(this.pts),status:'ing'}))
    }
});

canvas.addEventListener('mouseup',function (e) {
    var x = e.offsetX,y = e.offsetY;
    Ctl.addPos(x,y);
    Ctl.addPath(this.pts);
    socket.emit('paint',JSON.stringify({data:new Path(this.pts),status:'end'}))
    Ctl.clearPos();
})

canvas.addEventListener('mousedown',function (e) {
    var x = e.offsetX,y = e.offsetY;
    Ctl.clearPos();
    Ctl.addPos(x,y);
});
colors.addEventListener('click',function (e) {
    var t = e.target;
    if(t.classList.contains('rect')){
        Array.prototype.slice.call(this.getElementsByClassName('active'))
            .forEach(v=>v.classList.remove('active'));
        t.classList.add('active');
        Ctl.setColor(t.style.backgroundColor);
    }
});
ranger.addEventListener('change',function (e) {
    this.nextElementSibling.innerText = this.value;
    Ctl.setLw(this.value);
});

// Controller
Ctl = {
    drawPts: function (ctx,pts) {
        if(pts instanceof Path || pts.pts){
            var color = pts.color,lw = pts.lw;
            pts = pts.pts;
        }
        var p1 = pts[0];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        pts.slice(1).forEach(v=>{
            ctx.lineTo(v.x,v.y);
        });
        ctx.lineWidth = lw || canvas.lw
        ctx.strokeStyle = color || canvas.color;
        ctx.stroke();
        ctx.restore();
    },
    init : function () {
        canvas.paths=[];
        canvas.pts=[];
        canvas.color = 'black';
        canvas.lw = 1;
        for(var i=0;i<20;i++)
            this.addColor();
    },
    setLw(lw){
        canvas.lw = lw;
    },
    setColor(c){
        canvas.color = c;
    },
    addPath : function (pts) {
        canvas.paths.push(new Path(pts,canvas.lw,canvas.color));
    },
    addPos : function (x,y) {
        canvas.pts.push(new Pos(x,y));
    },
    clearPos : function () {
        canvas.pts = []
    },
    addColor : function (active) {
        var rect = document.createElement('div'),r = this.random;
        rect.className = 'rect';
        if(active)
            rect.className+=' active';
        rect.style.backgroundColor = 'rgb('+[r(256),r(256),r(256)].join(',')+')';
        colors.appendChild(rect);
    },
    random : function (b) {
        return Math.floor(Math.random()*b);
    }
};

// webSocket
/*
var ws = WS({
    path:'ws',
    onOpen:function (e) {
        alert('OK');
    },
    onError:function (e) {
        // alert(e.message)
        alert('Error');
    },
    onReceive:function (data,t) {

    },
    onClose:function (e) {
        alert('Close');
    }
});*/



// model

function Pos(x,y) {
    this.x=x;this.y=y;
}

function Path(pts,lw,color) {
    this.pts = pts;
    this.lw = lw || canvas.lw;
    this.color = color || canvas.color;
}

