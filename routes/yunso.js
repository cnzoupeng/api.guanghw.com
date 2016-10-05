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
var userAttr = ['uid', 'name', 'title', 'company', 'industry', 'access', 'newOne', 'introduce', 'avatar'];
var appKey = {
        SecretId: 'AKIDyAiSPXXQ817OoSjthgERmH05KkJGeiQ8',
        SecretKey: 'BXQcyVn2P9arQAFWyikzNxHlQWnDtjdp',
        serviceType: 'yunsou'
    }


function add(uid, call){
    db.User.findOne({attributes: userAttr, where: {uid: uid}}).then(function(user){
        if(!user){
            logger.error(`User ${uid} not found`);
            return call(1);
        }

        var capi = new Capi(appKey);
        var param = {
            Region: 'sh', 
            appId: 49470002, 
            op_type: 'add', 
            Action: "DataManipulation"
        };
        for(var key in user.dataValues){
            if(key == 'access'){
                user.dataValues[key] -= 10;
            }
            param['contents.0.' + key] = user.dataValues[key];
        }

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


/*
function mix_param(param){
    var public = {
        appId: 49470002,
        Nonce: Math.floor(Math.random() * 100000),
        Region: 'sh',
        SecretId: 'AKIDyAiSPXXQ817OoSjthgERmH05KkJGeiQ8',
        Timestamp: Math.floor(new Date().getTime() / 1000)
    };

    for(var key in param){
        public[key] = param[key];
    }
    return public;
}

function calcSign(param){
    var arr = [];
    for(var key in param){
        var skey = key.replace(/_/g, '.');
        arr.push(skey + "=" + param[key]);
    }
    var sistr = 'GETyunsou.api.qcloud.com/v2/index.php?' + arr.join('&');
    var hmac = crypto.createHmac('sha1', 'BXQcyVn2P9arQAFWyikzNxHlQWnDtjdp');
    hmac.update(sistr);
    var sig = hmac.digest('base64');
    
    logger.debug(sistr);
    logger.debug(sig);

    return encodeURI(sig);
}

function sortObject(object) {
    return Object.keys(object).sort().reduce(function (result, key) {
        result[key] = object[key];
        return result;
    }, {});
}

*/

module.exports = {
    del: del,
    add: add,
    search: search,
    update: update
}
