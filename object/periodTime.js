var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');

function periodTimeInfo() {
    var _this = this;
    _this.Id=0;
    _this.StartHour = 0;
    _this.StartMinute=0;
    _this.WorkModule=0;
    _this.SchemeId=0;
    _this.Retain = '00000000000000';
}




periodTimeInfo.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.Id,1);
    dataBuf += toolFunc.valueToHEX(_this.StartHour,1);
    dataBuf += toolFunc.valueToHEX(_this.StartMinute,1);
    dataBuf += toolFunc.valueToHEX(_this.WorkModule,1);
    dataBuf += toolFunc.valueToHEX(_this.SchemeId,1);
    dataBuf+=_this.Retain;
    return dataBuf;
}


periodTimeInfo.prototype.setObject = function (option) {
    var _this = this;
    _this.Id=option.Id;
    _this.StartHour = option.StartHour;
    _this.StartMinute=option.StartMinute;
    _this.WorkModule=option.WorkModule;
    _this.SchemeId=option.SchemeId;
}


periodTimeInfo.prototype.parseObject = function (data) {
    var _this = this;
    var index=0;
    _this.Id = data[index++];
    _this.StartHour = data[index++];
    _this.StartMinute = data[index++];
    _this.WorkModule = data[index++];
    _this.SchemeId = data[index++];
}

function periodTimeInfos() {
    var _this = this;
    _this.periodTimeInfoList=[];
}

periodTimeInfos.prototype = new dataBase();

periodTimeInfos.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf='';
    var count = _this.periodTimeInfoList.length;
    dataBuf+=toolFunc.valueToHEX(count,1);
    for (var i=0;i<count;i++){
        dataBuf += _this.periodTimeInfoList[i].toBuffer();
    }
    return dataBuf;//new Buffer(dataBuf,'hex');
}

periodTimeInfos.prototype.setObject=function (option) {
    var _this = this;
    var pti = new periodTimeInfo();
    pti.setObject(option);
    _this.periodTimeInfoList.push(pti);
}

periodTimeInfos.prototype.parseObject = function (data) {
    var _this = this;
    var index=0;
    var count = data[index];
    index++;
    for(var i=0;i<count;i++){
        var pti = new periodTimeInfo();
        pti.parseObject(data.slice(index,index+12));
        _this.periodTimeInfoList.push(pti);
        index+=12;
    }
    return index;
}
module.exports = periodTimeInfos;

