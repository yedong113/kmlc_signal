var express = require('express');
var thenjs =require("thenjs")
var app = express();
var http=require('http');
var fs = require('fs');
var bodyParser = require('body-parser');
var URL = require('url')
var frame_proto = require('./frame_proto');

app.use(bodyParser.json({limit:"8mb"}));
app.use(bodyParser.urlencoded({limit:"8mb",extended: false}));



function frame_server() {
    var _this = this;
    _this.deviceList=[];
    _this.deviceObject=[];
    console.log('aaaaaaaa')
    _this.start();
}


frame_server.prototype.readDeviceList = function () {
    var _this = this;
    var tmp = {};
    tmp.url = 'kmlc://127.0.0.1:6868';
    tmp.deviceId = 700000001;
    tmp.deviceType = 211;
    tmp.areaId=1;
    tmp.corner=1;
    console.log(tmp);
    _this.deviceList.push(tmp);
}


frame_server.prototype.start = function () {
    var _this = this;
    console.log('aaaaaaaa')
    thenjs(function(cont) {
        _this.readDeviceList();
        cont(null, null);
    })
    .then(function(cont, result) {
        _this.connectDevice();
        cont(null, null);
    })
    .fin(function(cont, err, result) {
        if (err) {
            console.log(err);
        }
    })
}


/*********************************************************/
frame_server.prototype.connectDevice = function() {
    console.log('***********call the function connectDevice()************');
    var _this = this;
    console.log(this.deviceList);
    for (var iix = 0; iix < _this.deviceList.length; iix++) {
        var tmp = this.deviceList[iix];
        var url = this.deviceList[iix].url;
        var deviceId = this.deviceList[iix].deviceId;
        var urlbody = URL.parse(url);
        if (urlbody.protocol == 'kmlc:' || urlbody.protocol == 'KMLC:') {
            tmp.DObject = new frame_proto({
                port: urlbody.port,
                ip: urlbody.hostname,
                deviceId: deviceId,
                callback: function(res) {
                }
            });
            console.log(tmp);
            _this.deviceObject.push(tmp);
        }
    }
}

console.log('aaaaaaaa')
var f_s = new frame_server();