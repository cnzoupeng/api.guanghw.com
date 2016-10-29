
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());
var logger = require('tracer').dailyfile({root:config.logPath, stackIndex: 1, maxLogFiles: 10, level: 'debug'});

/*
var logger = require('tracer').console({format: "{{timestamp}} {{file}}:{{line}}  {{message}}", dateformat : "yyyy-mm-dd HH:MM:ss", transport : function(data) {
        console.log(data.output);
        fs.appendFile('run.log', data.output + '\n', (err) => {
            if (err) throw err;
        });
    }});
*/
Date.prototype.format =function(format)
{
	var o = {
		"M+" : this.getMonth()+1, //month
		"d+" : this.getDate(),    //day
		"h+" : this.getHours(),   //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth()+3)/3),  //quarter
		"S" : this.getMilliseconds() //millisecond
	}
	if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
		(this.getFullYear()+"").substr(4- RegExp.$1.length));
	for(var k in o)if(new RegExp("("+ k +")").test(format))
		format = format.replace(RegExp.$1,
			RegExp.$1.length==1? o[k] :
				("00"+ o[k]).substr((""+ o[k]).length));
	return format;
}

module.exports.logger = logger;
module.exports.config = config;
