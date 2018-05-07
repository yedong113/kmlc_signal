var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');

function specialDayInfo() {
    var _this = this;
    _this.BeginMonth = 0;
    _this.BeginDay=0;
    _this.EndMonth = 0;
    _this.EndDay=0;
    _this.PeriodId=0;//时段表号
    _this.Retain = '00000000000000';//扩展字段
}

function schedule() {
    var _this = this;
    _this.weekInfo={};
    _this.specialDayInfos=[];
    _this.Retain='0000000000';
}

schedule.prototype = new dataBase();

schedule.prototype.setObject = function (option) {
    var _this = this;
    _this.weekInfo = option.weekInfo;
    var specialDayInfoCount = option.specialDayInfos.length;
    for (var i=0;i<specialDayInfoCount;i++){
        _this.specialDayInfos.push(option.specialDayInfos[i]);
    }
}

schedule.prototype.parseObject = function (data) {
    var _this = this;
    var index=0;
    var specialDayInfoCount = data[index++];
    _this.weekInfo.Mon=data[index++];
    _this.weekInfo.Tue=data[index++];
    _this.weekInfo.Wed=data[index++];
    _this.weekInfo.Thu=data[index++];
    _this.weekInfo.Fri=data[index++];
    _this.weekInfo.Sat=data[index++];
    _this.weekInfo.Sun=data[index++];
    index+=5;
    for (var i=0;i<specialDayInfoCount;i++){
        var sdi={};
        sdi.BeginMonth = data[index++];
        sdi.BeginDay = data[index++];
        sdi.EndMonth = data[index++];
        sdi.EndDay = data[index++];
        sdi.PeriodId = data[index++];
        _this.specialDayInfos.push(sdi);
        index+=7;
    }
    return index;
}

schedule.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf='';
    dataBuf+=toolFunc.valueToHEX(_this.specialDayInfos.length,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Mon,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Tue,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Wed,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Thu,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Fri,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Sat,1);
    dataBuf+=toolFunc.valueToHEX(_this.weekInfo.Sun,1);
    dataBuf+=_this.Retain;
    for (var i=0;i<_this.specialDayInfos.length;i++){
        var specialInfo = _this.specialDayInfos[i];
        dataBuf+=toolFunc.valueToHEX(specialInfo.BeginMonth,1);
        dataBuf+=toolFunc.valueToHEX(specialInfo.BeginDay,1);
        dataBuf+=toolFunc.valueToHEX(specialInfo.EndMonth,1);
        dataBuf+=toolFunc.valueToHEX(specialInfo.EndDay,1);
        dataBuf+=toolFunc.valueToHEX(specialInfo.PeriodId,1);
        dataBuf+=specialInfo.Retain;
    }
    return dataBuf;//new Buffer(dataBuf,'hex');
}



module.exports = schedule;