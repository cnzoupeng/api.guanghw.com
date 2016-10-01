/**
 * Created by Administrator on 2015/10/23.
 */
var express = require('express');
var router = express.Router();
var config = require('./base').config;
var logger = require('./base').logger;
var db = require('./db');
var sendSMS = require('./sms');
var yunso = require('./yunso');

var UserState = {
	authed: 8,
	unAuthed: 5
}

var accessMap = new Set();
setInterval(clearAccess, 1000 * 300);

router.get('/mark', function(req, res, next){
    var uid = req.user.uid;
    
    var pid = isNaN(req.query.page) ? 0 : req.query.page;
    var offset = pid * config.pageCount;
    var limit = config.pageCount;

    var sql = `SELECT b.uid,b.name,b.city,b.title,b.service,b.avatar FROM user_mark a, users b WHERE a.uid=${uid} AND a.puid = b.uid limit ${offset},${limit}`
    db.sequelize.query(sql, { model: db.UserShort }).then(function(marks){
        res.json({code: 0, data: marks});
    });
});

router.post('/mark/:puid', function(req, res, next){
	uid = req.user.uid;
	db.Mark.bulkCreate([{uid: uid, puid: req.params.puid}], {ignoreDuplicates: true}).then(function(mark){
		res.json({code: 0, msg: 'ok'});
	});
});

router.post('/unmark/:puid', function(req, res, next){
	uid = req.user.uid;
	db.Mark.destroy({where: {uid: uid, puid: req.params.puid}}).then(function(mark){
		res.json({code: 0, msg: 'ok'});
	});
});

router.post('/thumb/:puid', function(req, res, next){
	uid = req.user.uid;
	db.Thumb.bulkCreate([{uid: uid, puid: req.params.puid}], {ignoreDuplicates: true}).then(function(thumb){
		db.sequelize.query(`UPDATE users SET thumb=(SELECT count(*) FROM thumb_up WHERE puid=${req.params.puid}) WHERE uid=${req.params.puid}`);
		res.json({code: 0, msg: 'ok'});
	});
});

router.post('/unthumb/:puid', function(req, res, next){
	uid = req.user.uid;
	db.Thumb.destroy({where: {uid: uid, puid: req.params.puid}}).then(function(thumb){
		db.sequelize.query(`UPDATE users SET thumb=(SELECT count(*) FROM thumb_up WHERE puid=${req.params.puid}) WHERE uid=${req.params.puid}`);
		res.json({code: 0, msg: 'ok'});
	});
});

router.get('/msg', function(req, res, next){
    var uid = req.user.uid;
    var pid = isNaN(req.query.page) ? 0 : req.query.page;
    var offset = pid * config.pageCount;
    var limit = config.pageCount;

    if(pid == 0){
      db.User.update({newMsg: 0}, {where:{uid: uid}});
    }

    var result = {self: {}, sessions: []};
    var attr =  ['uid','name','avatar','newMsg'];
	db.User.findOne({attributes: attr, where: {uid: uid}}).then(function(user){
		if(!user){
			return res.json({code: 1, msg: 'User not exist'});
		}
        result.self = user;

        var sql = `SELECT m.sid,m.puid as uid,m.hasNew,u.name,u.avatar,m.content,m.uptime FROM session m LEFT JOIN users u ON m.puid=u.uid WHERE m.uid=${uid} UNION ALL SELECT m.sid,m.uid,m.phasNew as hasNew,u.name,u.avatar,m.content,m.uptime FROM session m LEFT JOIN users u ON m.uid=u.uid WHERE m.puid=${uid} order by uptime DESC`;
        db.sequelize.query(sql, { model: db.Session }).then(function(sessions){
            for(var i in sessions){
                sessions[i].content = JSON.parse(sessions[i].content);
            }
            result.sessions = sessions;
            res.json({code: 0, data: result});
        });
    });
});

router.post('/msg', function(req, res, next) {
    var uid = req.user.uid;
    var fromUser = {};
    var toUser = {};

	console.log(req.body);

    if(uid != req.body.from){
      	return res.json({code: 1, msg: 'Not Allowed'});
    }

	if(!req.body.from || !req.body.to || !req.body.msg){
		return res.json({code: 1, msg: 'Wrong param'});
	}

    //get both user info
    db.User.findAll({attributes: ['uid','name','mobile','avatar'], where: {uid: {$in: [req.body.from, req.body.to]}}}).then(function(user){
        if(user.length != 2){
            return res.json({code: 1, msg: 'User not Exist'});
        }
        if(user[0].uid == req.body.from){
            fromUser = user[0];
            toUser = user[1];
        }
        else{
            fromUser = user[1];
            toUser = user[0];
        }

        //find dialogue history
        db.Session.findOne({where: {$or: [{uid: req.body.from, puid: req.body.to}, {uid: req.body.to, puid: req.body.from}]}}).then(function(msg){
            //new dialogue
            if(!msg){
                var now = new Date().format('yyyy-MM-dd hh:mm:ss');
                var content = JSON.stringify([{time: now, from: req.body.from, to: req.body.to, msg: req.body.msg}]);
                db.Session.create({uid: req.body.from, puid: req.body.to, phasNew: 1, content: content}).then(function(msg){
                    //sms notify
                    sendSMS(fromUser.name, toUser.name, toUser.mobile);
                    //increase new msg
                    db.User.build({uid: req.body.to}).increment('newMsg');
                    return res.json({code: 0, msg: 'ok'});
                });
            }
            //old dialogue
            else{
                var cont = JSON.parse(msg.content);
                var now = new Date().format('yyyy-MM-dd hh:mm:ss');
                cont.push({time: now, from: req.body.from, to: req.body.to, msg: req.body.msg});
                var newContent = JSON.stringify(cont);
                var update = {content: newContent};
                if(msg.uid == req.body.from){
                    update.phasNew = 1;
                }
                else{
                    update.hasNew = 1;
                }
                db.Session.update(update, {where: {sid: msg.sid}}).then(function(){
                    //sms notify
                    //sendSMS(fromUser.name, toUser.name, toUser.mobile);
                    
					//increase new msg
					db.User.build({uid: req.body.to}).increment('newMsg');
                    return res.json({code: 0, msg: 'ok'});
                });
            }
        });
    });
});

router.get('/info/:uid', function(req, res, next){
    console.log(req.params)
	var puid = req.params.uid;
	var uid = req.user.uid;
	var attr =  ['newMsg','uid','name','usertype','prov','city','wx_country','position','company','web','service','avatar','industry','tag','title','thumb','introduce'];
	
	//self info for edit
	if(uid === puid){
		attr.push('mobile');
	}
	db.User.findOne({attributes: attr, where: {uid: puid}}).then(function(user){
		if(!user){
			return res.json({code: 1, msg: 'User not exist'});
		}
		if(isNaN(uid) || uid === puid){
			return res.json(user);
		}

		//add mark and thumbup
		db.Mark.findOne({uid: uid, puid: puid}).then(function(mark){
			db.Thumb.findOne({uid: uid, puid: puid}).then(function(thumb){
				user.dataValues.mark = mark ? true : false;
				user.dataValues.thumb = thumb ? true : false;
				return res.json({code: 0, data: user});
			});
		});
	});

	//update access
	updateAccess(puid, req.headers['x-forwarded-for']);
});

router.post('/info', function(req, res, next){
	var uid = req.user.uid;
	if(!uid || !req.body){
		return res.json({code: 1, msg: 'Not allowed'});
	}
	if(req.body.introduce){
		req.body.intro = getShortIntroduce(req.body.introduce);
	}
	
	req.body.usertype = UserState.unAuthed;
	db.User.update(req.body, {where: {uid: uid}}).then(function(u){
		db.Apply.upsert({uid: uid, time: db.sequelize.fn('NOW')}, {where: {uid: uid}, fields: ['time']}).then(function(apply){
			//yunso.update(uid);
			res.json({code: 0});
		}).catch(function(err){
			res.json({code: 1, msg: err});
		})
	});
});

router.post('/avatar', function(req, res, next) {
	var uid = req.user.uid;
	var up_file = "uploads/" + req.body.name;
	var tag = /\.[^\.]+/.exec(req.body.name);

	var newName = Date.now();
	if(req.body.uid){
		newName = req.body.uid + "_" + newName;
	}
	newName += tag;
	var newPath = '/www/static.9zhaowo.com/img/' + newName;
	var newUrl = 'http://static.guanghw.com/img/' + newName;

	fs.renameSync(up_file, newPath);
	db.User.update({avatar: newUrl}, {where: {uid: uid}}).then(function(user){
		res.json({code: 0, msg: 'ok', url: newUrl});
	})
});

//==========================================================

function getShortIntroduce(intro){
  var short = '';
  if(intro == null){
    return short;
  }
  var short_len = 0;
  var utf8_len = 0;
  var intro_len = intro.length;
  var i = 0;
  while(short_len < intro_short_len && i < intro_len){
    short_len += intro.charCodeAt(i) > 255 ? 2 : 1;
    i++;
  }
  if(i > 0){
    short = intro.substr(0, i);
    if(i < intro_len){
      short += ' . . .';
    }
  }
  return short;
}

function updateAccess(uid, ip){
    var key = uid + ip;
    if(!accessMap.has(key)){
        accessMap.add(key);
		db.User.build({uid: uid}).increment('access');
    }
}

function clearAccess(){
    var myDate = new Date();
    if(1 == myDate.getHours()){
        accessMap = new Set();
    }
}

module.exports = router;
