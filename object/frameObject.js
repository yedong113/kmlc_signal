var toolFunc = require('../commonTools.js');
var dataBaseFactory = require('./dataBaseFactory.js');
var dataBase = require('./dataBase.js');
/**
 * 帧数据结构
 * @param option
 */
function frameObject() {

}


frameObject.prototype.setFrameHead = function (option) {
    console.log(option);
    var _this = this;
    _this.frameBegin = 0xc0;//帧开始
    _this.versions = 0x10;//版本号
    _this.sentId=0x10;//发送方标识
    _this.recvId=0x20;//接收方标识
    _this.dataLinkId=0x01;//数据链路码
    _this.areaId=option.areaId;//区域号
    _this.corner=option.corner;//路口号
    _this.Retain='0000000001';//保留域
    _this.OperType = option.OperType;
    _this.ObjectIdent = option.ObjectIdent;
    _this.dataContent = _this.createDataContent(option);
    console.log(_this.dataContent);
    _this.crc = 0x00;
    _this.frameEnd=0xc0;
}

frameObject.prototype.setObject = function (option) {
    var _this = this;
    if(_this.dataContent!=null){
        _this.dataContent.setObject(option);
    }
}



frameObject.prototype.toBuffer = function () {
    var _this = this;
    var dataBufStr = '';
    dataBufStr += toolFunc.valueToHEX(_this.frameBegin,1);
    dataBufStr += toolFunc.valueToHEX(_this.versions,1);
    dataBufStr += toolFunc.valueToHEX(_this.sentId,1);
    dataBufStr += toolFunc.valueToHEX(_this.recvId,1);
    dataBufStr += toolFunc.valueToHEX(_this.dataLinkId,1);
    dataBufStr += toolFunc.valueToHEX(_this.areaId,1);
    dataBufStr += toolFunc.valueToHEX(_this.corner,2);
    dataBufStr += toolFunc.valueToHEX(_this.OperType,1);
    dataBufStr += toolFunc.valueToHEX(_this.ObjectIdent,1);
    if(_this.dataContent!=null){
        dataBufStr += _this.dataContent.toBuffer();
    }
    _this.crc = toolFunc.CRC(dataBufStr);
    dataBufStr += _this.crc;
    var dataBuf = new Buffer(dataBufStr,'hex');
    var flag=0;
    for (var i=1;i<dataBuf.length;i++){
        if(dataBuf[i]==0xc0||dataBuf[i]==0xDB){
            flag++;
        }
    }
    var newDataBuf = new Buffer(dataBuf.length+flag);
    for(var i=0,j=0;i<dataBuf.length;i++,j++){
        if(i==0)
        {
            newDataBuf[0]=dataBuf[0];
            continue;
        }
        if(dataBuf[i]==0xc0){
            newDataBuf[j]=0xDB;
            j++;
            newDataBuf[j]=0xDC;
        }
        else if(dataBuf[i]==0xDB){
            newDataBuf[j]=0xDB;
            j++;
            newDataBuf[j]=0xDD;
        }
        else{
            newDataBuf[j]=dataBuf[i];
        }

    }
    var buffers = new Buffer(1);
    buffers[0]=_this.frameEnd;
    var buffer1=Buffer.concat([newDataBuf,buffers],newDataBuf.length+buffers.length);
    return buffer1;
}


frameObject.prototype.parseObject = function (dataBuf) {
    var _this = this;

    console.log('原始数据',dataBuf);
    var data = new Buffer(dataBuf.length);
    for(var i=0,j=0;i<dataBuf.length;i++,j++){
        if(i==0||i==(dataBuf.length-1)){
            data[j]=dataBuf[i];
            continue;
        }
        if(dataBuf[i]==0xDB){
            if(dataBuf[i+1]==0xDC){
                data[j]=0xC0;
                i++;
            }
            else if(dataBuf[i+1]==0xDD){
                data[j]=0xDB;
                i++;
            }
        }
        else{
            data[j]=dataBuf[i];
        }
    }
    console.log('转换数据',data);
    var index=0;
    _this.frameBegin = data[index++];
    _this.versions = data[index++];
    _this.sentId = data[index++];
    _this.recvId = data[index++];
    _this.dataLinkId = data[index++];
    _this.areaId = data[index++];
    _this.corner = data.readInt16BE(index);
    index+=2;
    _this.OperType = data[index++];
    _this.ObjectIdent = data[index++];
    _this.dataContent = _this.createDataContent({
        OperType:_this.OperType,ObjectIdent:_this.ObjectIdent
    });
    if(_this.dataContent!=null){
        index+=_this.dataContent.parseObject(data.slice(index));
    }
    _this.crc = data.readInt16BE(index);
    index+=2;
    _this.frameEnd=data[index++];
}


frameObject.prototype.createDataContent = function (option) {
    var _this = this;
    var dataBase=null;
    if(option.OperType==0x80){
        return;
    }
    switch (option.ObjectIdent){
        case 0x06:{//信号灯组参数
            dataBase=dataBaseFactory.createDataBaseModel('lightSignalGroup');
        }
        break;
        case 0x07:{//相位参数
            dataBase=dataBaseFactory.createDataBaseModel('phase');
        }
        break;
        case 0x08:{//信号配时方案
            dataBase=dataBaseFactory.createDataBaseModel('scheme');
        }
        break;
        case 0x09:{//调度计划表
            dataBase=dataBaseFactory.createDataBaseModel('schedule');
        }
        break;
        case 0x12:{//时段表
            dataBase=dataBaseFactory.createDataBaseModel('periodTime');
        }
        break;
    }
    return dataBase;
}



module.exports = frameObject;