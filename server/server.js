/**
 * Created by Yc on 2016/5/21.
 */
var httpd = require('http').createServer(handler);
var io = require('socket.io').listen(httpd);
var fs = require('fs');

httpd.listen(80);

function handler(req,res) {
    fs.readFile(__dirname+'/static/'+(req.url==='/'?'index.html':req.url),
        function (err,data) {
            if(err){
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
            res.writeHead(200);
            res.end(data);
        }
    );
}

var paths = [];
function doCmd(msg,socket) {
    if(msg[0]==='#'){
        var msg = msg.substring(1),
            sockets = (function(s){
                var a = []
                for(var k in s)
                    a.push(s[k]);
                return a;
            })(socket.server.sockets.sockets);
        switch (msg) {
            case 'show paths':
                socket.emit('cmd',JSON.stringify(paths));
                socket.emit('server msg','指令操作成功！');
                break;
            case 'show users':
                socket.emit('cmd',JSON.stringify(sockets.map(x=>x=x.name)));
                socket.emit('server msg','指令操作成功！');
                break;
            case 'clear paths':
                paths = [];
                socket.emit('server msg','指令操作成功！');
                socket.emit('paint paths',JSON.stringify(paths));
                break;
            default: return false;
        }
        return true;
    }else{
        return false;
    }
}

function escapeHTML(data) {
    var s = '';
    for(var i = 0 ;i<data.length;i++){
        var d = data[i];
        switch (d){
            case '"':
                d = '&quot;'; break;
            case '&':
                d = '&amp;'; break;
            case '<':
                d = '&lt;'; break;
            case '>':
                d = '&gt;'; break;
            case ' ':
                d = '&nbsp;'; break;
            default:
                s+=d;
        }
    }
    return s;
}
io.sockets.on('connection',function (socket) {
    socket.on('login',function (name) {
        socket.name = name || socket.id;
        socket.emit('server msg','欢迎, '+name+' !');
        socket.broadcast.emit('server msg','欢迎, '+name+' !');
        socket.emit('paint paths',JSON.stringify(paths));

        socket.on('client msg',function (msg) {
            if(!doCmd(msg,socket)) {
                msg = escapeHTML(msg);
                var date = new Date().format('yyyy-MM-dd hh:mm:ss');
                socket.emit('server msg',date+'<br>'+ socket.name  + ' 说: ' + msg);
                socket.broadcast.emit('server msg',date+'<br>'+ socket.name  + ' 说: ' + msg);
            }
        });
        socket.on('disconnect',function () {
            socket.broadcast.emit('server msg','拜, '+socket.name +'。');
        });

        socket.on('paint',function (data) {
            data = JSON.parse(data);
            var pts = data.data;
            switch (data.status){
                case 'ing' :
                    socket.broadcast.emit('paint pts',JSON.stringify(pts));
                    break;
                case 'end' :
                    socket.broadcast.emit('paint pts',JSON.stringify(pts));
                    paths.push(pts);
                    break;
            }
        });
        socket.on('repaint',function () {
            socket.emit('paint paths',JSON.stringify(paths));
        })
    });
    socket.emit('login');
})

Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}