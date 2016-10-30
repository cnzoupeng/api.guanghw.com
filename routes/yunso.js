var config = require('./base').config;
var logger = require('./base').logger;
var db = require('./db');
var request = require('request');
var querystring = require('querystring');
var crypto = require('crypto');
var Capi = require('qcloudapi-sdk');

//test git
var apiUrl = "https://yunsou.api.qcloud.com/v2/index.php?";
var httpsProxy = '';//"http://web-proxy.oa.com:8080";
var userAttr = ['uid', 'name', 'title', 'company', 'industry', 'city', 'service','access', 'newOne', 'introduce'];
//var userAttr = ['uid', 'name', 'title', 'company', 'industry', 'access', 'newOne', 'introduce'];
var appKey = {
        SecretId: 'AKIDyAiSPXXQ817OoSjthgERmH05KkJGeiQ8',
        SecretKey: 'BXQcyVn2P9arQAFWyikzNxHlQWnDtjdp',
        serviceType: 'yunsou'
    }


function add(uid, call){    
    db.User.findOne({attributes: userAttr, where: {uid: uid}}).then(function(user){
        if(!user){
            logger.error(`User ${uid} not found`);
            return;
        }

        var capi = new Capi(appKey);
        var param = {
            Region: 'sh', 
            appId: 49470002, 
            op_type: 'add', 
            Action: "DataManipulation"
        };
        for(var key in user.dataValues){
            param['contents.0.' + key] = user.dataValues[key];
        }
	    console.log(param)
        capi.request(param, function(error, data) {
            console.log(JSON.stringify(data));
            call(error);
        });
    });
}

function del(uid, call){
    var capi = new Capi(appKey);
    var param = {
        Region: 'sh', 
        appId: 49470002, 
        op_type: 'del', 
        'contents.0.doc_id': uid, 
        Action: "DataManipulation"
    }

    capi.request(param, function(error, data) {
        console.log(JSON.stringify(data));
        call(error);
    });
}

function update(uid, call){
    add(uid, call);
}

function search(key, industry, page_id, perPage, call){
    var capi = new Capi(appKey);
    var param = {
        Region: 'sh', 
        appId: 49470002,
        Action: "DataSearch",
        search_query: key,
        page_id: page_id,
        num_per_page: perPage,
        query_encode: 0,
        search_id: Math.floor(new Date().getTime() / 1000)
    };

    if(industry){
        param.cl_filter = `[C:industry:'${industry}']`;
    }
    

    capi.request(param, function(error, data) {
        if(error || !data){
            logger.error('Yunso error: ' + error);
            return call(1);
        }

        if(!data || data.code != 0){
            logger.error('Yunso error: ' + error);
            return call(1);
        }

        if(data.data.result_num == 0){
            return call(0, []);
        }

        var out = [];
        var list = data.data.result_list;
        for(var i in list){
            var obj = JSON.parse(list[i].doc_meta);
            obj.uid = list[i].doc_id;
            out.push(obj);
        }

        call(0, out);
    });
}

function updateOne(users){
    if(!users){
        console.log('done');
        return;
    }
    var user = users.shift();
    add(user.uid, function(err){
        if(err){
            console.log(err)
            process.exit(err);
        }
        updateOne(users);
    });
}

function updateAll(){
    console.log('aaa')
    db.User.findAll({attributes: userAttr, where: {usertype: 8}}).then(function(users){
        console.log(users.length)
        updateOne(users);
    })
}

module.exports = {
    del: del,
    add: add,
    search: search,
    update: update,
    updateAll: updateAll
}
