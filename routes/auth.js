var express = require('express');
var router = express.Router();
var logger = require('./base').logger;
var fs = require('fs');
var db = require('./db');
var request = require('request');
var yunso = require('./yunso');
var jwt = require('jsonwebtoken');
var config = require('./base').config;

var SECRET = 'Admin@Token@@A753907';
var EXPIRE = 1000 * 60 * 60 * 24;
var webHost = 'http://web.guanghw.com'
var adminPwd = JSON.parse(fs.readFileSync('admin.pwd').toString());

var noAuthPath = new Set();
noAuthPath.add('/auth/wx_oauth');
noAuthPath.add('/auth/token');
noAuthPath.add('/auth/admin_auth');
noAuthPath.add('/');

router.get('/wx_oauth', function(req, res, next) {
    if(!req.query.code || !req.query.state){
        logger.error("wrong wx oauth param: " + JSON.stringify(req.query));
        return res.json({code: 1, msg: 'wx system error, code=1'});
    }
    var arr = req.query.state.split('_');
    if(arr.length != 2 || (arr[0] != 'wx' && arr[0] != 'web')){
        logger.error("wrong wx state: " + req.query.state);
        return res.json({code: 1, msg: "wx login failed"});
    }
    var uaType = arr[0];
    var backUrl = arr[1];
    var now = parseInt(new Date().getTime() / 1000);

    getUserWxInfo(req.query.code, uaType, function(err, user){
        if(err){
            return res.json({code: 1, msg: 'wx system error, code=2'});
        }
        
        db.User.findOne({attributes: ['uid','name'], where: {wx_unionid: user.unionid}}).then(function(userx){
            if(userx){
                var token = jwt.sign({uid: userx.uid}, config.secret, { expiresIn: config.tokenExpire });
                log_login(userx.uid, {ip: req.headers['realip'], nickname: userx.name}, uaType);
                return res.json({code: 0, uid: userx.uid, token: token, jump: backUrl});
            }
            var newUser = {wx_unionid: user.unionid, name: user.nickname,  
                wx_sex: user.sex, prov: user.province, city: user.city, wx_country: user.country, 
                avatar: user.headimgurl, reg_time: now, reg_ip: req.headers['realip'], 
                reg_dev: uaType, usertype: 5, newOne: 1};
            logger.debug("Add New User : " + JSON.stringify(newUser));
            db.User.create(newUser).then(function(user){
                var token = jwt.sign({uid: user.uid}, config.secret, { expiresIn: config.tokenExpire });
                yunso.add(user.uid);
                log_login(user.uid, {ip: req.headers['realip'], nickname: newUser.name}, uaType);
                return res.json({code: 0, uid: user.uid, token: token, jump: backUrl});
            });
        });
    });
});

function getUserWxInfo(code, iface, call){
    var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx45de252db48d8d3d&secret=81d00b8700ca37bdba5ef08cfc095a9b&code=" + code + "&grant_type=authorization_code";
    if(iface != 'wx'){
        url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx3d191f2b6049a18d&secret=b5489a8d5822d6a5fe6d5912d7bb782f&code=" + code + "&grant_type=authorization_code";
    }

    request(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            logger.error("Get wx access token failed");
            logger.error(response.statusCode + " " + body);
            return call(1);
        }
        var token = JSON.parse(body);
        if(!token){
            logger.error("Pasre wx access token failed" + body);
            return call(1);
        }

        if(token.errcode || !token.access_token || !token.openid){
            logger.error("wrong token info from wx" + body);
            return call(1);
        }

        var url = `https://api.weixin.qq.com/sns/userinfo?access_token=${token.access_token}&openid=${token.openid}&lang=zh_CN`;
        request(url, function (error, response, body) {
            if (error || response.statusCode != 200) {
                logger.error("Get wx User info failed");
                logger.error(response.statusCode + " " + body);
                return call(1);
            }

            var user = JSON.parse(body);
            if(!user){
                return call(1);
            }
            call(0, user);
        });
    });
}

router.authSkip = function(path){
    if(noAuthPath.has(path) || path.indexOf('/user/info/') == 0) {
        return true;
    }
    return false;
}

router.get('/token', function(req, res, next) {
    var token = jwt.sign({uid: 963636}, config.secret, { expiresIn: config.tokenExpire });
    res.append('token', token);
    res.json({code: 0});
});


function log_login(uid, wx, ua){
    var now = new Date().format('yyyy-MM-dd hh:mm:ss');
    db.User.update({lastLogin: now}, {where: {uid: uid}}).then(function(u){});
    var url = 'http://apis.juhe.cn/ip/ip2addr?key=6cdabf4b88886406f84a51cd10f25dbe&dtype=json&ip=' + wx.ip;
    request(url, function (error, response, body) {
        var ipInfo = {area: '未知', location: '未知'};
        if (error || response.statusCode != 200) {
            logger.error("Get IP info failed");
        }
        else{
            var obj = JSON.parse(body);
            if(obj && obj.error_code == 0 && obj.result){
                ipInfo = {area: obj.result.area, location: obj.result.location};
            }
        }
        var info = {uid: uid, ip: wx.ip, ua: ua, nickname: wx.nickname, area: ipInfo.area, location: ipInfo.location};
        logger.debug("New Login log : " + JSON.stringify(info));
        db.Login.create(info);
    });
}

//admin auth
router.post('/admin_auth', function(req, res, next) {
    if(!req.body.username || !req.body.password 
    || req.body.username != adminPwd.user || req.body.password != adminPwd.pwd){
        return res.status(401).json({code: 1, msg: 'Auth Failed'});
    }
    var token = jwt.sign({uid: 963636, role: 'admin'}, SECRET, { expiresIn: EXPIRE});
    res.json({code: 0, token: token});
});

module.exports = router;
