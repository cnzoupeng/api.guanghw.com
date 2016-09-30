
var express = require('express');
var router = express.Router();
var config = require('./base').config;
var logger = require('./base').logger;
var db = require('./db');
var yunso = require('./yunso');

router.get('/', function(req, res, next) {
    var page = isNaN(req.query.page) ? 0 : req.query.page;
    var key = req.query.key ? req.query.key : '';
    var industry = req.query.industry ? req.query.industry : '';

    //use yunso for search
    if(key){
        yunso.search(key, industry, page, config.pageCount, function(err, users){
            if(err){
                logger.error("Yunso Search Error: " + err);
                return res.json({code: 1, msg: 'Yunso engine error'});
            }
            res.json({code: 0, data: users});
        });
    }

    //use mysql sort
    else{
        var offset = page * config.pageCount;
        var order = 'newOne DESC, access DESC';
        var cond = {usertype: 8};
        if(industry){
            cond.industry = industry;
        }
        
        db.UserShort.findAll({where: cond, offset: offset, limit: config.pageCount, order: order}).then(function(users){
            if(!users){
                users = [];
            }
            res.json({code: 0, data: users});
        });
    }
});

module.exports = router;
