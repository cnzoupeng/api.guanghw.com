var logger = require('./base').logger;
var Sequelize = require('sequelize');
var sequelize = new Sequelize('9zhaowo', 'root', 'passwd@db', {
    host: '10.66.159.27', port: 3306, dialect: 'mysql', 
//    host: '127.0.0.1', port: 3333, dialect: 'mysql', 
    pool: {min: 1, max: 10, idle: 3600},
    logging: logSql});

var User = sequelize.define('users', {
        uid: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
        wx_unionid: Sequelize.STRING,
        sex: Sequelize.INTEGER,

        avatar: Sequelize.STRING,
        prov: Sequelize.STRING,
        city: Sequelize.STRING,
        usertype: Sequelize.STRING,
        industry: Sequelize.STRING,
        name: Sequelize.STRING,
        mobile: Sequelize.STRING,
        tag: Sequelize.STRING,
        company: Sequelize.STRING,
        position: Sequelize.STRING,
        service: Sequelize.STRING,
        web: Sequelize.STRING,
        newMsg: Sequelize.STRING,
        title: Sequelize.STRING,
        intro: Sequelize.STRING,

        introduce: Sequelize.STRING,
        reg_time: Sequelize.STRING,
        reg_ip: Sequelize.STRING,
        reg_dev: Sequelize.STRING,
        seg_core: Sequelize.STRING,
        seg_intro: Sequelize.STRING,
        access: Sequelize.BIGINT,
        newOne: Sequelize.INTEGER,
        thumb: Sequelize.INTEGER,
        authTime: Sequelize.DATE,
        lastLogin: Sequelize.DATE,
        lastUpdate: Sequelize.INTEGER
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var UserDesc = sequelize.define('users', {
        uid: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
        wx_unionid: Sequelize.STRING,
        avatar: Sequelize.STRING,
        
        prov: Sequelize.STRING,
        city: Sequelize.STRING,
        usertype: Sequelize.STRING,
        industry: Sequelize.STRING,
        name: Sequelize.STRING,
        mobile: Sequelize.STRING,
        tag: Sequelize.STRING,
        company: Sequelize.STRING,
        position: Sequelize.STRING,
        service: Sequelize.STRING,
        web: Sequelize.STRING,
        newMsg: Sequelize.STRING,
        title: Sequelize.STRING,

        access: Sequelize.BIGINT,
        newOne: Sequelize.INTEGER,
        thumb: Sequelize.INTEGER,
        authTime: Sequelize.DATE,
        lastLogin: Sequelize.DATE,
    },
    {   
        timestamps: false,
        freezeTableName: true,
    });

var UserShort = sequelize.define('users', {
        uid: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
        avatar: Sequelize.STRING,
        name: Sequelize.STRING,
        prov: Sequelize.STRING,
        city: Sequelize.STRING,
        service: Sequelize.STRING,
        title: Sequelize.STRING,
        industry: Sequelize.STRING,
        introduce: Sequelize.STRING
    },
    {   
        timestamps: false,
        freezeTableName: true,
    });



var Login = sequelize.define('login_log', {
        id: {type: Sequelize.BIGINT, primaryKey: true},
        uid: Sequelize.BIGINT,
        ip: Sequelize.STRING,
        ua: Sequelize.STRING,
        time: Sequelize.DATE,
        area: Sequelize.STRING,
        location: Sequelize.STRING,
        nickname: Sequelize.STRING
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var Session = sequelize.define('session', {
        sid: {type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true},
        uid: Sequelize.BIGINT,
        puid: Sequelize.BIGINT,
        hasNew: Sequelize.INTEGER,
        phasNew: Sequelize.INTEGER,
        uptime: Sequelize.DATE,
        content: Sequelize.STRING
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var Report = sequelize.define('report', {
        id: {type: Sequelize.BIGINT, primaryKey: true},
        uid: Sequelize.BIGINT,
        puid: Sequelize.BIGINT,
        time: Sequelize.DATE,
        content: Sequelize.STRING
    },
    {   
        timestamps: false,
        freezeTableName: true
    });



var Apply = sequelize.define('special_apply', {
        uid: {type: Sequelize.BIGINT, primaryKey: true},
        time: Sequelize.DATE
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var Thumb = sequelize.define('thumb_up', {
        uid: {type: Sequelize.BIGINT, primaryKey: true},
        puid: {type: Sequelize.BIGINT, primaryKey: true, type: Sequelize.UUID,}
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var Mark = sequelize.define('user_mark', {    
        uid: {type: Sequelize.BIGINT, primaryKey: true},
        puid: {type: Sequelize.BIGINT, primaryKey: true}
    },
    {   
        timestamps: false,
        freezeTableName: true
    });

var db = {
    sequelize: sequelize,
    User: User,
    UserDesc: UserDesc,
    UserShort: UserShort,
    Login: Login,
    Session: Session,
    Report: Report,
    Apply: Apply,
    Thumb: Thumb,
    Mark: Mark,
    Login: Login
}

function logSql(sql){
    logger.warn(sql);
}

module.exports = db;
