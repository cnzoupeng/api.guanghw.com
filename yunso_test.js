
var yunso = require('./routes/yunso');
var db = require('./routes/db');



yunso.search('IT', '其他', 0, 10, function(err){
    process.exit(1);
})

/*
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