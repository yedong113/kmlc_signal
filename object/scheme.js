var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');

/**
 * 信号配时方案
 */
function schemeInfo() {
    var _this = this;
    _this.Id=0;
    _this.PhaseSequence=[];
    _this.PhaseDifference=0;
}

schemeInfo.prototype.setObject = function (option) {
    var _this = this;
    _this.Id = option.Id;
    _this.PhaseSequence = option.PhaseSequence;
    _this.PhaseDifference=option.PhaseDifference;
    _this.Retain = '000000';//扩展字段
}


schemeInfo.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.Id,1);
    for(var i=0;i<_this.PhaseSequence.length;i++){
        dataBuf += toolFunc.valueToHEX(_this.PhaseSequence[i],1);
    }
    for(var i=0;i<20-_this.PhaseSequence.length;i++){
        dataBuf += toolFunc.valueToHEX(0x00,1);
    }
    dataBuf += toolFunc.valueToHEX(_this.PhaseDifference,1);
    dataBuf+=_this.Retain;
    return dataBuf;
}

schemeInfo.prototype.parseObject = function (data) {
    var _this = this;
    _this.Id=data[0];
    for (var i=0;i<20;i++){
        if(data[i+1]==0x00){
            break;
        }
        _this.PhaseSequence[i]=data[i+1];
    }
    _this.PhaseDifference=data[21];
}


function schemeInfos() {
    var _this=this;
    _this.schemeInfoList=[];
}

schemeInfos.prototype = new dataBase();

schemeInfos.prototype.toBuffer = function () {
    var _this = this;
    var count = _this.schemeInfoList.length;
    var dataBuf='';
    dataBuf += toolFunc.valueToHEX(count,1);
    for (var i=0;i<count;i++){
        dataBuf+=_this.schemeInfoList[i].toBuffer();
    }
    return dataBuf;//new Buffer(dataBuf,'hex');
}

schemeInfos.prototype.setObject = function (option) {
    var _this = this;
    var si = new schemeInfo();
    si.setObject(option);
    _this.schemeInfoList.push(si);
}

schemeInfos.prototype.parseObject = function (data) {
    var _this=this;
    var index=0;
    var count=data[index];
    index++;
    console.log(data);
    for (var i=0;i<count;i++){
        var si = new schemeInfo();
        si.parseObject(data.slice(index,index+25));
        _this.schemeInfoList.push(si);
        index+=25;
    }
    return index;
}



module.exports = schemeInfos;
