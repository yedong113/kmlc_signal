var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');

/**
 * 信号灯组参数 大小为12个字节
 */
function lightSignalGroup() {
    var _this = this;
    _this.Id = 0; //灯组编号
    _this.Conner = 0; //路口方向  每个路口预留有:(北-东北-东-东南-南-西南-西-西北)共8个逻辑方向,依次编号为1-8.该值配置灯组对应的路口逻辑方向.
    _this.Lane = 0; //车道类型 1-左转 2-直行 3-右转 4-行人
    _this.Retain = '000000000000000000';//扩展字段
}


lightSignalGroup.prototype.parseObject = function (data) {
    var _this = this;
    _this.Id = data[0];
    _this.Conner = data[1];
    _this.Lane = data[2];
    //_this.Retain = data.toString('utf8',3,9);
}


lightSignalGroup.prototype.setObject = function (option) {
    var _this = this;
    _this.Id = option.Id;
    _this.Conner = option.Conner;
    _this.Lane = option.Lane;
}

function strToHexCharCode(str) {
    if(str === '')
        return '';
    var hexCharCode = [];
    for(var i = 0; i < str.length; i++) {
        hexCharCode.push((str.charCodeAt(i)).toString(16));
    }
    return hexCharCode.join('');
}

lightSignalGroup.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.Id,1);
    dataBuf += toolFunc.valueToHEX(_this.Conner,1);
    dataBuf += toolFunc.valueToHEX(_this.Lane,1);
    dataBuf+=_this.Retain;
    return dataBuf;
}



function  lightSignalGroups() {
    var _this=this;
    _this.lightSignalGroupList=[];
}

lightSignalGroups.prototype = new dataBase();

lightSignalGroups.prototype.setObject = function (option) {
    var _this=this;
    var lsg = new lightSignalGroup();
    lsg.setObject(option);
    _this.lightSignalGroupList.push(lsg);
}

lightSignalGroups.prototype.toBuffer = function () {
    var _this=this;
    var lsgCount=_this.lightSignalGroupList.length;
    var dataBuf='';
    dataBuf += toolFunc.valueToHEX(lsgCount,1);
    for (var i=0;i<lsgCount;i++){
        dataBuf+=_this.lightSignalGroupList[i].toBuffer();
    }
    return dataBuf;// new Buffer(dataBuf,'hex');
}

lightSignalGroups.prototype.parseObject = function (data) {
    var _this=this;
    var index=0;
    var lsgCount = data[index];
    index++;
    for (var i=0;i<lsgCount;i++){
        var lsg = new lightSignalGroup();
        lsg.parseObject(data.slice(index,index+12));
        _this.lightSignalGroupList.push(lsg);
        index+=12;
    }
    return index;
}


module.exports = lightSignalGroups;