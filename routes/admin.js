var express = require('express');
var router = express.Router();
var logger = require('./base').logger;
var db = require('./db');
var request = require('request');
var yunso = require('./yunso');
var jwt = require('jsonwebtoken');
var config = require('./base').config;

var SECRET = 'Token@@A753907';
var EXPIRE = 1000 * 60 * 60 * 24 * 1;
var webHost = 'http://web.guanghw.com'