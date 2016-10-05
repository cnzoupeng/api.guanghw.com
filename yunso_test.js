
var yunso = require('./routes/yunso');
var db = require('./routes/db');


var attr =  ['uid','name','avatar','title','company','introduce','access','newOne','industry'];
db.User.findAll({attributes: attr, where: {usertype: 8}}).then(function(users){
    add(users);
});

function add(arr){
    if(arr.length == 0){
        console.log('done');
        process.exit(1);
    }
    var item = arr.shift();
    yunso.add(item.uid, function(err){
        if(err){
            process.exit(1);
        }
        add(arr);
        console.log('add ' + item.uid);
    });
}

/*

yunso.search('IT', '其他', 0, 10, function(err){
    process.exit(1);
})


yunso.add(952355, function(err){
    process.exit(1);
})

/*
function add(users){
    if(users.length == 0){
        return;
    }

    var user = users.shift();
     yunso.add(user.uid, function(err){
        if(err){
            process.exit(1);
        }
        add(users);
    });
}
*/