var http = require('http');
var querystring = require('querystring');
var logger = require('./base').logger;

var MIN_NOTIFY_SEC = 3600;
var users = new Map();
setInterval(clearTimeout, 30 * 60 * 1000);

function sendSMS(from, to, toMobile){
    var tm = users.get(to);
    var now = (new Date().getTime()) / 1000;
    if(tm && ((now - tm) < MIN_NOTIFY_SEC)){
        return;
    }
    users.set(to, now);

    var obj = {
        action: 'send',
        userid: 12835,
        account: '就找我APP',
        password: '123456',
        mobile: toMobile,
        content: "【光合网】尊敬的用户，您有来自 " + from + " 的新消息，请登录guanghw.com查看详情。",
        sendTime: '',
        taskName: 'notify',
        checkcontent: 1,
        mobilenumber: 1,
        countnumber: 1,
        telephonenumber: 1
    }

    var opt = {
        method: "POST",
        host: "www.qf106.com",
        port: 80,
        path: "/sms.aspx?" + querystring.stringify(obj),
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": 0
        }
    };

    var req = http.request(opt, function (res) {
        res.on('data', function(data){
            if(data.toString().indexOf('>Success<') < 0){
                logger.error(data.toString());
            }
        });
    });

    req.on('error', function(err){
        logger.error(err);
    });

    req.write("\n");
    req.end();
}

function clearTimeout(){
    var now = (new Date().getTime()) / 1000;
    var arr = [];
    for (var key of users.keys()) {
        var tm = parseInt(users.get(key));
        if((now - tm) > MIN_NOTIFY_SEC){
            arr.push(key);
        }
    }

    for(var i in arr){
        users.delete(arr[i]);
    }
}

module.exports = sendSMS;