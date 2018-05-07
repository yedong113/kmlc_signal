var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');


/**
 * 相位
 */
function phaseInfo() {
    var _this =  this;
    _this.Id = 0;              //相位编号
    _this.lampGroupBitmap=0; //放行的灯组位图
    _this.Green=0;             //相位的绿灯常亮时间
    _this.GreenFlash=0;        //相位的绿闪时间
    _this.Yellow=0;            //相位的黄灯时间
    _this.Red=0;               //相位的红灯时间
    _this.WalkLight=0;         //相位的行人通行时间
    _this.WalkFlash=0;         //相位的行人清空时间
    _this.Delta=0;             //相位的弹性延长时间
    _this.MinGreen=0;          //相位的最小绿灯时间
    _this.MaxGreen=0;          //相位的最大绿灯时间
    _this.Retain = '00000000000000000000';//扩展字段
}

phaseInfo.prototype.parseObject = function (data) {
    var _this = this;
    var index=0;
    _this.Id = data[index++];
    _this.lampGroupBitmap = data.readInt32BE(index);
    index+=4;
    _this.Green = data[index++];
    _this.GreenFlash = data[index++];
    _this.Yellow = data[index++];
    _this.Red = data[index++];
    _this.WalkLight = data[index++];
    _this.WalkFlash = data[index++];
    _this.Delta = data[index++];
    _this.MinGreen = data[index++];
    _this.MaxGreen = data[index++];
}

phaseInfo.prototype.setObject = function (option) {
    var _this = this;
    _this.Id = option.Id;
    _this.lampGroupBitmap = option.lampGroupBitmap;
    _this.Green = option.Green;
    _this.GreenFlash=option.GreenFlash;
    _this.Yellow=option.Yellow;
    _this.Red=option.Red;
    _this.WalkLight=option.WalkLight;
    _this.WalkFlash=option.WalkFlash;
    _this.Delta=option.Delta;
    _this.MinGreen=option.MinGreen;
    _this.MaxGreen=option.MaxGreen;
}

phaseInfo.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.Id,1);
    dataBuf += toolFunc.valueToHEX(_this.lampGroupBitmap,4);
    dataBuf += toolFunc.valueToHEX(_this.Green,1);
    dataBuf += toolFunc.valueToHEX(_this.GreenFlash,1);
    dataBuf += toolFunc.valueToHEX(_this.Yellow,1);
    dataBuf += toolFunc.valueToHEX(_this.Red,1);
    dataBuf += toolFunc.valueToHEX(_this.WalkLight,1);
    dataBuf += toolFunc.valueToHEX(_this.WalkFlash,1);
    dataBuf += toolFunc.valueToHEX(_this.Delta,1);
    dataBuf += toolFunc.valueToHEX(_this.MinGreen,1);
    dataBuf += toolFunc.valueToHEX(_this.MaxGreen,1);
    dataBuf+=_this.Retain;
    return dataBuf;
}

function phaseInfos() {
    var _this = this;
    _this.phaseInfoList=[];
}

phaseInfos.prototype = new dataBase();

phaseInfos.prototype.setObject = function (option) {
    var _this = this;
    var pi = new phaseInfo();
    pi.setObject(option);
    _this.phaseInfoList.push(pi);
}

phaseInfos.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf='';
    dataBuf += toolFunc.valueToHEX(_this.phaseInfoList.length,1);
    for (var i=0;i<_this.phaseInfoList.length;i++){
        dataBuf+=_this.phaseInfoList[i].toBuffer();
    }
    return dataBuf;//new Buffer(dataBuf,'hex');
}

phaseInfos.prototype.parseObject = function (data) {
    var _this=this;
    var index=0;
    var count=data[index];
    index++;
    for (var i=0;i<count;i++){
        var pi = new phaseInfo();
        pi.parseObject(data.slice(index,index+24));
        _this.phaseInfoList.push(pi);
        index+=24;
    }
    return index;
}
module.exports = phaseInfos;
