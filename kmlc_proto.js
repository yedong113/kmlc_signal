

/************************************************* 
kunming 联诚科技信号机
还需要处理设备的断线重连
**************************************************/
var net = require('net');
var toolFunc = require('./commonTools.js');
var kafkaProducer = require("./kafkaStatusReport.js");
var config = require('./config');

var errorConfig = require('./config/errorConfig.js');

var errorCode = require('./config/errorCode.js');

var kmlcChannelConfigs = require('./config/kmlcChannelConfig.js');

var events = require('events');
var util = require('util');

var flowReport = require('./KafkaTrafficFlowReport.js');

var KmlcSignalTable = require('./config/KmlcSignalTable');

var numbers = require('numbers');

var matrix = numbers.matrix;

var log = toolFunc.log;
function kmlc_itsc(option_) {
    var _this = this;
    this.objIdIndex = 0;
    this.option = option_;
    this.deviceStatus = false;
    this.recDataBuffer = null;
    this.deviceId=option_.deviceId;
    _this.fsm = {};
    _this.fsm.currentStepMode =0xFF;
    _this.fsm.paramerConfigure = {};
    _this.recDataBuffer = new Buffer([]);
    _this.partitionId = option_.partitionId;

    console.log('_this.partitionId=',_this.partitionId);

    _this.fsm.currentControlModel = 0x00;

    _this.clientSocket = new net.Socket();

    _this.toolpings = new  toolFunc.toolPing(this.option.ip);

    _this.toolpings.pingHost(function (res) {
        console.log(res);
        if (res.errCode==0x0)
        {
            _this.clientSocket.connect(_this.option.port, _this.option.ip);
        }
        else {
            _this.reconnectTimer = setTimeout(_this.reconnect, 1000 * 60);
        }
    });

/*
    _this.clientSocket = net.connect(_this.option.port, _this.option.ip,function() {
        _this.deviceStatus = true;
        console.log('connected to server!!!', _this.option.ip, _this.option.port);
    });
*/


    _this.clientSocket.setKeepAlive(true, 5000);

    /**数据上报对象*/
    this.reportObject = option_.reportObject;
//    this.reportObject.init(); //

    _this.clientSocket.on('data', function(data) {
        var optCode = data[5];
        var strData = data.toString("hex");
        if(optCode!=0xe1 && optCode!=0xe4 &&optCode!=0xe5)
        {
            console.log("\x1b[32mrecv [%s:%s]<<< %s optCode=0x%s\x1b[0m", _this.option.ip, _this.option.port, strData,optCode.toString(16));
        }
        _this.recDataBuffer = Buffer.concat([_this.recDataBuffer, data]);
        //console.log(_this.recDataBuffer);
        _this.parseFrame();
    });

    _this.clientSocket.on('end', function() {
        _this.deviceStatus = false;
        console.log('disconnected from server',_this.option.ip, _this.option.port);
        clearTimeout(_this.reconnectTimer);
        _this.clientSocket.destroy();
    });

    _this.clientSocket.on("close", function() {
        _this.deviceStatus = false;
        clearTimeout(_this.reconnectTimer);
        _this.reconnectTimer = setTimeout(_this.reconnect, 1000 * 60);
        console.log("call the function: event_closed() !!");
        _this.clientSocket.destroy();
    });

    _this.clientSocket.on('timeout', function() {
        _this.deviceStatus = false;
        console.log('time out');
    });

    _this.clientSocket.on('connect', function() {
        clearTimeout(_this.reconnectTimer);
        _this.deviceStatus = true;
        delete _this.recDataBuffer;
        _this.recDataBuffer = new Buffer([]);
        console.log('connected to server###', _this.option.ip, _this.option.port, _this.clientSocket.localPort);
        console.log('connect');
        setInterval(function(){
            _this.keepAlive();
        },10000);
        //_this.getConerTable();
    });

    _this.clientSocket.on("error", function(data) {
        clearTimeout(_this.reconnectTimer);
        _this.deviceStatus = false;
        console.log(" ----- error------:" + data);

    });


    _this.reconnect = function() {
        console.log("reconnect[%s %s]", _this.option.ip, _this.option.port);
        if (_this.deviceStatus) {
            _this.keepAlive();
        } else {

            _this.toolpings.pingHost(function (res) {
                if (res.errCode==0x0){
                    _this.clientSocket.connect(_this.option.port, _this.option.ip);
                }else
                {
                    _this.reconnectTimer = setTimeout(_this.reconnect, 1000 * 60);
                }
            });
        }
    };
}





var gData = null;
/*获取接收到的一个完整的数据帧*/
kmlc_itsc.prototype.parseFrame = function() {
    //console.log('-----call the function parseFrame-----------');
    var pos1 = this.recDataBuffer.indexOf(0x68);
    var counter = 0;
    /*没有找到帧中的标识*/
    if (pos1 < 0) {
        delete this.recDataBuffer;
        this.recDataBuffer = null;
        this.recDataBuffer = new Buffer([]);
        console.log('haven\'t valid Data!!');
        return;
    }

    var bodyLen=this.recDataBuffer[pos1 + 1] * 256 + this.recDataBuffer[pos1 + 2]+6;

    if(bodyLen>this.recDataBuffer.length){//数据没有接收全
        return;
    }

    while (pos1 > -1) {
        var startPos = 1;
        var len = this.recDataBuffer[pos1 + 1] * 256 + this.recDataBuffer[pos1 + 2];
        var data = this.recDataBuffer.slice(pos1 + 3, pos1 + len + 3);
        var tmpdata = new Buffer(data).toString('HEX');
        var crc = toolFunc.CRC(tmpdata);
        var crctmp = this.recDataBuffer[pos1 + len + 3] * 256 + this.recDataBuffer[pos1 + len + 3 + 1];
        var crcValue = new Buffer(crc, 'hex').readUInt16BE();
        if (this.recDataBuffer[pos1 + len + 3 + 2] == 0x16 && crcValue == crctmp) {
            startPos = pos1 + len + 6;
            this.parseValidData(data);
        }
        this.recDataBuffer = this.recDataBuffer.slice(startPos);
        pos1 = this.recDataBuffer.indexOf(0x68);
    }
    // console.log('******************this time is parse over!!************************')
}


kmlc_itsc.prototype.parseValidData = function(data) {
    var strData = data.toString("hex");
    var operCode = data[2];
    var resData = {
        oper: operCode.toString(16)
    };

    var objectDomain = data.slice(2, 7);

    var msgTypeRes = toolFunc.parseMsgType(data[1]);
    var objectDomainRes = toolFunc.parseIndexSubObj(objectDomain);

    var objsBody = data.slice(objectDomainRes.indexCount + 4, data.length);
    var objsRes = [];
    for (var i = 0; i < msgTypeRes.objsCount; ++i) {
        objRes = this.parseObjsBody(operCode, objsBody, msgTypeRes.msgType);
        objsRes[i] = objRes;
    }
    resData.data = objsRes;
    this.option.callback(resData);
}

kmlc_itsc.prototype.parseDetail = function(err, msgType, data, parseCall, nextCall) {
    var result = null;
    if (msgType == 4) { //查询应答
        result = parseCall(data);
        nextCall();
    } else if (msgType == 5) { //设置应答
        if (err.errCode) {
            this.setCb(err);
        } else {
            nextCall();
        }
    } else if (msgType == 6) { //出错应答
        this.setCb(err);
    }
    return result;
}

kmlc_itsc.prototype.parseObjsBody = function(operCode, objsBody, msgType) {
    var objRes = null;
    if (objsBody.length == 0) {
        return objRes;
    }
    var errCode = objsBody[0];

    var lowErrorcode = objsBody[1];
    var err = {
        errCode: errCode,
        Id:this.deviceId,
        info: errCode == 0 ? 'success' : errorConfig[errCode]
    };
    switch (operCode) {
        case 0xDC:
            { //服务器发出设置开始指令
                console.log("0xDC---", objsBody.toString("hex"));
                if (err.errCode) {
                    this.setCb(err);
                } else {

                    if (this.fsm.command=='configSpecial'){
                        this.fsm.onSetStageTableReq();
                    }
                    else if(this.fsm.command=='configGreenWaveBandParamer'){
                        this.fsm.onSetStageTableReq();
                    }
                    else
                    {
                        this.fsm.onSetDeviceIdReq(); //2
                    }
                }
            }
            break;
        case 0xF1:
            { //设备Id
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.info=errorConfig[err.errCode];
                }
                objsRes = this.parseDetail(err, msgType, objsBody, this.parseF1, this.fsm.onSetConnerReq); //4

            }
            break;
        case 0x95:
            { //相位表
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.info=errorConfig[err.errCode];
                }

                if(this.fsm.command=='queryParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse95, this.fsm.onQueryConnerInfo);
                    this.fsm.paramerConfigure.phaseTable=objsRes;
                }
                else if(this.fsm.command=='configParameter')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse95, this.fsm.onSetConnerReq); //14
                }
            }
            break;
        case 0xCA://路口信息
        {
            if(err.errCode!=0){
                err.errCode = objsBody[0]*256+lowErrorcode;
                err.info=errorConfig[err.errCode];
            }

            if(this.fsm.command=='queryParamer'){
                objsRes = this.parseDetail(err, msgType, objsBody, this.parseCA, this.fsm.onQueryStageInfo);
                this.fsm.paramerConfigure.connerTable=objsRes;
            }
            else if(this.fsm.command=='configParameter')
            {
                objsRes = this.parseDetail(err, msgType, objsBody, this.parseCA, this.fsm.onSetStageTableReq); //14
            }
        }
        break;
        case 0xc1:
            { //阶段表
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.info=errorConfig[err.errCode];
                }
                if(this.fsm.command=='queryParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC1, this.fsm.onQuerySchemeInfo);
                    this.fsm.paramerConfigure.StageTableInfo=objsRes;
                }
                else if(this.fsm.command=='configSpecial')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC1, this.fsm.onSetPatternTableReq); //12
                }
                else if(this.fsm.command=='configParameter')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC1, this.fsm.onSetPatternTableReq); //12
                }
                else if(this.fsm.command=='configGreenWaveBandParamer')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC1, this.fsm.onSetPatternTableReq); //12
                }
            }
            break;
        case 0xc0:
            { //方案表
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.info=errorConfig[err.errCode];
                }

                if(this.fsm.command=='queryParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC0, this.fsm.onQueryPeriodInfo);
                    this.fsm.paramerConfigure.SchemeTableInfo=objsRes;
                }
                else if(this.fsm.command=='configSpecial')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC0, this.fsm.onEndSet); //10
                }
                else if(this.fsm.command=='configParameter')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC0, this.fsm.onSetPeriodTableReq); //10
                }
                else if(this.fsm.command=='configGreenWaveBandParamer')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parseC0, this.fsm.onSetPeriodTableReq); //10
                }
            }
            break;
        case 0x8e:
            { //时段表
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.msg=errorConfig[err.errCode];
                }

                if(this.fsm.command=='queryParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8E, this.fsm.onScheduleInfo);
                    this.fsm.paramerConfigure.PeriodTimeTable=objsRes;
                }
                else if(this.fsm.command=='configParameter'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8E, this.fsm.onSetScheduleReq); //8

                }
                else if(this.fsm.command=='configGreenWaveBandParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8E, this.fsm.onSetScheduleReq); //8
                }
            }
            break;
        case 0x8d:
            { //调度表	
                if(err.errCode!=0){
                    err.errCode = objsBody[0]*256+lowErrorcode;
                    err.info=errorConfig[err.errCode];
                }
                if(this.fsm.command=='queryParamer'){
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8D, this.fsm.onEndQuery);
                    this.fsm.paramerConfigure.ScheduleInfo=objsRes;
                    this.fsm.onEndCallback();
                }
                else if(this.fsm.command=='configParameter')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8D, this.fsm.onEndSet); //6
                }
                else if(this.fsm.command=='configGreenWaveBandParamer')
                {
                    objsRes = this.parseDetail(err, msgType, objsBody, this.parse8D, this.fsm.onEndSet); //6
                }
            }
            break;
        case 0xd0:
            { //请求进行交通管制应答
                 console.log("0xD0---",objsBody.toString("hex"));

                this.fsm.nextChangeControl(err);
            }
            break;
        case 0xD1:
            { //交通管制应答
                this.fsm.nextChangeControl(err);
            }
            break;
        case 0xD2:
            { //步进请求应答
                this.fsm.nextChangeControl(err);
            }
            break;
        case 0xDB:
            { //设置自主控制方式应答
                this.fsm.nextChangeControl(err);
            }
            break;
        case 0xDD://设置结束指令
            {
                this.setCb(err);
            }
            break;
        case 0xe1:
            { //系统状态
                objRes = this.parseE1(objsBody);
            }
            break;
        case 0xe2:
            {
                objRes = this.parseE2(objsBody);
            }
            break;
        case 0xe4:
            {
                objRes = this.parseE4(objsBody);
            }
            break;
            case 0xe5:
            {
                objRes = this.parseE5(objsBody);
            }
            break;
        default:
            {

            }
            break;
    }
    return objRes;
}


kmlc_itsc.prototype.sendData = function(data) {
    var len = data[1] * 256 + data[2];
    var packData = data.slice(3, len + 3);
    var objectDomain = packData.slice(2, 7);

    this.msgTypeSend = toolFunc.parseMsgType(packData[3]);
    this.objectDomainSend = toolFunc.parseIndexSubObj(objectDomain);
    if (this.deviceStatus) {
        // console.log('sendData:',data);
        this.clientSocket.write(data);
//        log.warn("send >>>" + data.toString("hex"));
    }

}

/*重启设备*/
kmlc_itsc.prototype.restart = function(first_argument) {
    var data = '2182DF0002';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}

kmlc_itsc.prototype.keepAlive = function(first_argument) {
    var data = '2183E000';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');

    this.sendData(getBuffer);
}

kmlc_itsc.prototype.getVersion = function(first_argument) {
    var data = '2180F000';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}

/*获取调度表*/
kmlc_itsc.prototype.getScheduleTable = function(first_argument) {
    var data = '21808D00';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}

/*获取时段表*/
kmlc_itsc.prototype.getPeriodTable = function(first_argument) {
    var data = '21808E00';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}


/*获取路口信息*/

kmlc_itsc.prototype.getConerTable = function (first_argument) {
    var data = '2180CA00';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}



/*获取相位表*/
kmlc_itsc.prototype.getphaseTable = function(first_argument) {
    var data = '21809500';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}

/*查询阶段表*/
kmlc_itsc.prototype.getStageTable = function(first_argument) {
    console.log('----call the getStageTable------');
    var data = '2180C100';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}


/*查询方案表*/
kmlc_itsc.prototype.getSchemeTable = function(first_argument) {
    var data = '2180C000';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}


kmlc_itsc.prototype.SettingPeriodTableV1 = function(data,controlMode) {
    // console.log(data);
    var counter = 0;
    var result = '';
    var m = data.length;
    for (var iix = 0; iix < data.length; iix++) {
        var id = data[iix].TimeIntervalTableId;
        for (var iiy = 0; iiy < data[iix].TimeIntervalInfo.length; iiy++) {
            var PeriodEventID = data[iix].TimeIntervalInfo[iiy].TimeIntervalId;
            var StartHour = data[iix].TimeIntervalInfo[iiy].StartHour;
            var StartMinute = data[iix].TimeIntervalInfo[iiy].StartMinute;
            var schemeId = data[iix].TimeIntervalInfo[iiy].SchemeTabelId;
            var ControlModel = controlMode[schemeId];
            result = result + this.createPeriodTableData({
                id:id, 
                PeriodEventID:PeriodEventID, 
                StartHour:StartHour, 
                StartMinute:StartMinute, 
                ControlModel:ControlModel, 
                schemeId:schemeId });
            counter = counter + 1;
        }
    }

    if (counter == 0) {
        console.log('-------------no period table!!!-------------');
        return;
    }

    if (counter % m == 0) {
        n = counter / m;
    } else {
        n = parseInt(counter / m) + 1;
    }
    console.log('m:', m);
    console.log('n:', n);
    console.log('counter:', counter);
    console.log('n*m:', m * n);
    while (n * m - counter) {
        result = result + '000000000000';
        counter++;
    }

    /****************************/
    result = '21818e00' + toolFunc.valueToHEX(m, 1) + toolFunc.valueToHEX(n, 1) + result;
    console.log('V1时基表data:', result);
    /****************************/
    var tmp = this.makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);
}



/**
 * 校验阶段表的最大绿灯时间
 * @param {*} tmp 
 */
kmlc_itsc.prototype.checkGreenTime = function(tmp){

}

/**
 * 
 * @param {*} data 
 */
kmlc_itsc.prototype.SettingStageTableV1 = function(data,phaseTables){
    var _this = this;
    console.log('配置阶段表:', JSON.stringify(data));
    console.log(data);
    var result = '';
    var m = data.length;
    var n = 0;
    var counter = 0;
    for (var iix = 0; iix < data.length; iix++) {
        var stageTableId = data[iix].StageTabelId;
        for (var iiy = 0; iiy < data[iix].StageData.length; iiy++) {
            var tmp = {};
            tmp.stageTableId = stageTableId;
            tmp.stageId = data[iix].StageData[iiy].StageId;
            tmp.PhaseBitmap = data[iix].StageData[iiy].PhaseBitmap;
            tmp.Green = data[iix].StageData[iiy].Green;
            tmp.GreenFlash = data[iix].StageData[iiy].GreenFlash;
            tmp.Yellow = data[iix].StageData[iiy].Yellow;
            tmp.Red = data[iix].StageData[iiy].Red;
            tmp.WalkLight = data[iix].StageData[iiy].WalkLight;
            tmp.WalkFlash = data[iix].StageData[iiy].WalkFlash;
            tmp.Delta = data[iix].StageData[iiy].Delta;
            tmp.MinGreen = data[iix].StageData[iiy].MinGreen;
            tmp.MaxGreen = data[iix].StageData[iiy].MaxGreen;

            if (_this.fsm.command != 'configParameter') {
                tmp.lcPhaseBitmap = tmp.PhaseBitmap;
            }
            else {
                _this.genkmlcPhaseBitmap(tmp.PhaseBitmap, phaseTables, function (res) {
                    tmp.lcPhaseBitmap = res;
                });
            }
            counter = counter + 1;
            result = result + this.createStageTableDataV1(tmp);
        }
    }

    if (counter == 0) {
        console.log('-------------no stage table!!!-------------');
        return;
    }

    if (counter % m == 0) {
        n = counter / m;
    } else {
        n = parseInt(counter / m) + 1;
    }
    console.log('m:', m);
    console.log('n:', n);
    console.log('counter:', counter);
    console.log('n*m:', m * n);
    while (n * m - counter) {
        result = result + '00000000000000000000000000000000';
        counter++;
    }

    /****************************/
    result = '2181c100' + toolFunc.valueToHEX(m, 1) + toolFunc.valueToHEX(n, 1) + result;
    console.log('counter:', counter)
        /****************************/
    var tmp = this.makeFrame(result);
    console.log('阶段表data:', tmp);
    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);
}



kmlc_itsc.prototype.getPhaseIdWithConner = function (Conner,laneType) {
    var phaseId=0;
    for (var i=0;i<kmlcChannelConfigs.length;i++){
        if (Conner==kmlcChannelConfigs[i].cornerId&&laneType==kmlcChannelConfigs[i].laneType){
            phaseId=kmlcChannelConfigs[i].phaseId;
            break;
        }
    }
    return phaseId;
}


kmlc_itsc.prototype.getkmlcChannelCfg = function(cornerId,lanType,callback) {
    for (var i=0;i<kmlcChannelConfigs.length;i++){
        if (cornerId==kmlcChannelConfigs[i].cornerId&&lanType==kmlcChannelConfigs[i].laneType){
            callback(kmlcChannelConfigs[i]);
        }
    }
    callback(null);
}



kmlc_itsc.prototype.checkData = function (data,cb) {

}






////////////////////启动开始配置参数*////////////////////////////////////////////////////////////////////////
kmlc_itsc.prototype.StartSettingParammer = function() {
    var tmp = '2181DC00';
    res = this.makeFrame(tmp);
    var getBuffer = new Buffer(res, 'hex');
    console.log(getBuffer);
    this.sendData(getBuffer);
}

////////////////////配置设备ID////////////////////////////////////////////
kmlc_itsc.prototype.SettingDeviceID = function(id) {
    var result = '';
    result = result + toolFunc.valueToHEX(id, 8);
    result = '2181f100' + result;
    console.log('设备ID data:', result);
    var tmp = this.makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);
}


kmlc_itsc.prototype.kmlcDataConvert = function(startValue, len) {
    var a = startValue.toString(2);
    while (a.length < len) {
        a = '0' + a;
    }

    if (a.length > len) {
        a = a.substring(a.length - len);
    }

    var tmp = a.split("").reverse().join(""); //最后把数组变成字符串

    var newvalue = parseInt(tmp, 2);
    // console.log(tmp);
    // console.log(newvalue);
    return newvalue;
}

kmlc_itsc.prototype.changeWeekOfDay = function(value) {
    var a = value.toString(2);
    while (a.length < 8) {
        a = '0' + a;
    }
    // console.log(a);
    var tmp = a.substring(0, 1);
    // console.log(tmp);
    var tmp1 = a.substring(1, 7);
    // console.log(tmp1);
    var tmp_value = tmp1 + tmp + '0';
    // console.log(tmp_value);
    var newvalue = parseInt(tmp_value, 2);
    // console.log(newvalue);
    return newvalue;
}


kmlc_itsc.prototype.getkmlcPhaseId = function (phaseId,phaseTables,callback) {
    var lcPhaseId=0;
    var name;
    for(var i=0;i<phaseTables.length;i++){
        if(phaseTables[i].PhaseId==phaseId){
            lcPhaseId=phaseTables[i].kmlcPhaseId;
            name=phaseTables[i].name;
            break;
        }
    }
    if(lcPhaseId!=0){
        callback(lcPhaseId,name);
    }
}


kmlc_itsc.prototype.genkmlcPhaseBitmap = function(phaseBitmap,phaseTables,callback) {
    var _this = this;
    var bitmapstrings = (phaseBitmap>>1).toString(2);
    var arrPhaseId=[];
    for (var i=bitmapstrings.length-1,j=1;i>=0,j<=16;i--,j++){
        if(bitmapstrings[i]=='1'){
            _this.getkmlcPhaseId(j,phaseTables,function (lcphaseid,name) {
                arrPhaseId.push({srcId:j,kmlcPhaseId:lcphaseid,name:name});
            });
        }
    }
    var desBitmap=0;
    for(var i=0;i<arrPhaseId.length;i++){
        desBitmap|=(1<<(arrPhaseId[i].kmlcPhaseId-1));
    }
    callback(desBitmap);
}


kmlc_itsc.prototype.SettingScheduleTableV1 = function(data) {
    var ScheduleTables=[];
    var weeks=['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var weekSch = '{"Mon": 1,"Tue": 2,"Wed": 1,"Thu": 3,"Fri": 1,"Sat": 2,"Sun": 1}';
    var planId=1;
    for(var iix=0;iix<data.length;iix++){
        var ScheduleTable=data[iix];
        var weekJson = ScheduleTable.Week;
        for(var i=0;i<weeks.length;i++){
            var flag=false;
            for(var j=0;j<ScheduleTables.length;j++){
                if(ScheduleTables[j].period==weekJson[weeks[i]]){
                    ScheduleTables[j].weeks.push(i+1);
                    flag=true;
                }
            }
            if(!flag){
                var tmp={};
                var tArr=[];
                tmp.period=weekJson[weeks[i]];
                tArr.push(i+1);
                tmp.weeks=tArr;
                tmp.PlaneId = planId++;
                ScheduleTables.push(tmp);
            }
        }
        for(var i=0;i<ScheduleTables.length;i++){
            var valWeeks=0;
            for(var j=0;j<ScheduleTables[i].weeks.length;j++){
                var h1=1<<ScheduleTables[i].weeks[j];
                valWeeks = valWeeks|h1;
            }
            ScheduleTables[i].Day=valWeeks;
            ScheduleTables[i].Month=0b1111111111110;
            ScheduleTables[i].Date=0b11111111111111111111111111111110;
        }
        var SpecialDayTables=ScheduleTable.SpecialDayTable;
        for(var i=0;i<SpecialDayTables.length;i++){
            var tmp={};
            tmp.Day=SpecialDayTables[i].Day;
            tmp.Month = SpecialDayTables[i].Month;
            tmp.PlaneId = planId++;
            tmp.Date=0;
            tmp.weeks=[];
            tmp.period = SpecialDayTables[i].PeriodTableId;
            ScheduleTables.push(tmp);
        }
    }            
    var counter = 0;
    var result = '';
    for(var i=0;i<ScheduleTables.length;i++){
        result = result+this.createScheduleTableV1(ScheduleTables[i]);
        counter = counter+1;
    }
    if (counter == 0) {
        console.log('-------------no schedual table!!!-------------');
        return;
    }
    /****************************/
    result = '21818d00' + toolFunc.valueToHEX(counter, 1) + result;
    console.log('V1调度表data:', result);
    /****************************/
    var tmp = this.makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);
}







kmlc_itsc.prototype.createScheduleTableV1 = function(ScheduleTable){
    var result = '';
    result = toolFunc.valueToHEX(ScheduleTable.PlaneId, 1);
    result = result + toolFunc.valueToHEX(ScheduleTable.Month, 2);
    result = result + toolFunc.valueToHEX(ScheduleTable.Day, 1);
    result = result + toolFunc.valueToHEX(ScheduleTable.Date, 4);
    result = result + toolFunc.valueToHEX(ScheduleTable.period, 1);
    console.log(result);
    return result;
}




kmlc_itsc.prototype.createPeriodTableData = function(data) {
    var tmp = '';
    tmp = tmp + toolFunc.valueToHEX(data.id, 1);
    tmp = tmp + toolFunc.valueToHEX(data.PeriodEventID, 1);
    tmp = tmp + toolFunc.valueToHEX(data.StartHour, 1);
    tmp = tmp + toolFunc.valueToHEX(data.StartMinute, 1);
    tmp = tmp + toolFunc.valueToHEX(data.ControlModel, 1);
    tmp = tmp + toolFunc.valueToHEX(data.schemeId, 1);
    return tmp;
}

//////////////////配置方案表////////////////////////////////////////////////////////////////
kmlc_itsc.prototype.SettingPatternTable = function(data) {
    // console.log(JSON.stringify(data));
    // console.log(data);
    var result = '';
    var counter = 0;

    for (var iix = 0; iix < data.length; iix++) {
        result = result + this.createPatternTableData(data[iix]);
        counter++;
    }
    result = '2181c000' + toolFunc.valueToHEX(counter, 1) + result;
    console.log('方案data:', result);
    var tmp = this.makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);
}

kmlc_itsc.prototype.createPatternTableData = function(data) {
    // console.log(JSON.stringify(data));
    console.log(data);
    var tmp = '';
    console.log(data.schemeId,data.Cycle,data.Coordphase);
    tmp = tmp + toolFunc.valueToHEX(data.schemeId, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Cycle, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Offset, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Coordphase, 1);
    tmp = tmp + toolFunc.valueToHEX(data.stageTableId, 1);
    return tmp;
}


kmlc_itsc.prototype.createStageTableDataV1 = function(data) {
    var result = '';
    result = result + toolFunc.valueToHEX(data.stageTableId, 1);
    result = result + toolFunc.valueToHEX(data.stageId, 1);

    //2017-12-22日修改为不采用前端配置的相位，而采用信号机定死的相位
    //data.PhaseBitmap=data.PhaseBitmap>>1;
    //result = result + toolFunc.valueToHEX(data.PhaseBitmap, 4);
    result = result + toolFunc.valueToHEX(data.lcPhaseBitmap, 4);


    result = result + toolFunc.valueToHEX(data.Green, 1);
    result = result + toolFunc.valueToHEX(data.GreenFlash, 1);
    result = result + toolFunc.valueToHEX(data.Yellow, 1);
    result = result + toolFunc.valueToHEX(data.Red, 1);
    result = result + toolFunc.valueToHEX(data.WalkLight, 1);
    result = result + toolFunc.valueToHEX(data.WalkFlash, 1);
    result = result + toolFunc.valueToHEX(data.Delta, 1);
    result = result + toolFunc.valueToHEX(data.MinGreen, 1);
    result = result + toolFunc.valueToHEX(data.MaxGreen, 1);
    console.log("result"+result);
    return result;
}



////////////////////配置相位表///////////////////////////////////////////////////////////////////
kmlc_itsc.prototype.SettingPhaseTabel = function(data) {
    // console.log(JSON.stringify(data));
    console.log(data);
    var result = this.createPhaseTableData(data);
    result = '21819500' + toolFunc.valueToHEX(data.length, 1) + result;

    /****************************/
    var tmp = this.makeFrame(result);
    console.log("Phase result:", tmp);


    var getBuffer = new Buffer(tmp, 'hex');
    this.sendData(getBuffer);

    // console.log('tmp:',tmp)

}

kmlc_itsc.prototype.createPhaseTableData = function(data) {
    //data 中包含方案表中的所有相位信息
    console.log('phase number:', data.length)
    var tmp = '';
    for (var iix = 0; iix < data.length; iix++) {
        //2017-12-22 修改为不采用前端配置的相位号，而采用信号机定死的相位
        //tmp = tmp + toolFunc.valueToHEX(data[iix].PhaseId, 1);
        tmp = tmp + toolFunc.valueToHEX(data[iix].kmlcPhaseId, 1);
        tmp = tmp + toolFunc.valueToHEX(data[iix].Channel, 1);
        tmp = tmp + toolFunc.valueToHEX(data[iix].Cornor, 1);
        tmp = tmp + toolFunc.valueToHEX(data[iix].LaneType, 1);
        tmp = tmp + '00000000'
    }
    return tmp;
}

/////////////////////确认设置参数////////////////////////////////////////////////////////////////////////////
kmlc_itsc.prototype.makeSureSetting = function(first_argument) {
    var data = '2181DD00';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}


/*把value 的 pos 位 置 为0 或者1*/
kmlc_itsc.prototype.makeHEXvalue = function(startValue, pos, val) {
    if (val != 0 && val != 1) {
        console.log(val + ' is 0 or 1.')
        return null;
    }

    if (pos < 1 || pos > 32) {
        console.log('the pos is error:', pos);
        return null;
    }

    var tmp = null;
    if (val) {
        var tmp = startValue | (0x00000001 << (pos - 1));
    } else {
        var tmp = startValue & ~(0x00000001 << (pos - 1));
    }
    // console.log(new Buffer([tmp]).toString('hex'));
    return tmp;
}

/**/
kmlc_itsc.prototype.counterDataLenght = function(data) {
    var len = data.length / 2;

    var tmp = len.toString(16);
    while (tmp.length < 4) {
        tmp = '0' + tmp;
    }
    return tmp;
}

kmlc_itsc.prototype.makeFrame = function(data) {
    var tmp = '68';
    var tmp = tmp + this.counterDataLenght(data);
    var tmp = tmp + data;
    var tmp = tmp + toolFunc.CRC(data);
    var tmp = tmp + '16';
    //console.log('tmp:',tmp);
    return tmp;
}


kmlc_itsc.prototype.RCR16 = function(data) {
    var result = 0xffff;
    var buf = new Buffer(data, 'hex');
    for (var iix = 0; iix < buf.length; iix++) {
        result = result ^ (buf[iix]);
        for (var i = 0; i < 8; ++i) {
            var k = result & 0x01;
            result = result >> 1;
            if (k) {
                result = result ^ 0xA001;
            }
        }
    }

    var tmp = result.toString(16);
    while (tmp.length < 4) {
        tmp = '0' + tmp;
    }

    if (tmp.length > 4) {
        tmp = tmp.substring(tmp.length - 4);
    }
    console.log("check code:", tmp);
    return tmp;
}


kmlc_itsc.prototype.printHEX = function(data) {
    var str = new Buffer(data).toString('HEX');
    var len = str.length;
    var tmp = '';
    for (var iix = 0; iix < len; iix++) {
        tmp = tmp + str.substring(2 * iix, 2 * iix + 2) + ' ';
    }
    return tmp;
}




/***********请求进入交通管控***************/
kmlc_itsc.prototype.enterTrafficContrl = function(argument) {
    var data = '2181d000f0';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}

/************退出交通管控****************************/
kmlc_itsc.prototype.exitTrafficContrl = function() {
    var data = '2181d000f1';
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);
}


kmlc_itsc.prototype.settingContrlModule = function(type, mode) {
    console.log('type:',type);
    console.log('mode',mode);
    // console.log('para type:',typeof(type));
    // var contrl_type = type;
    // var contrl_modu = mode;

    var data = '2181' + toolFunc.valueToHEX(type, 1) + '00' + toolFunc.valueToHEX(mode, 1);

    console.log('-------sendData------->:', data);

    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    this.sendData(getBuffer);

}


kmlc_itsc.prototype.changeContrlModuleV1 = function(data, cb){
    var _this = this;
    console.log(data);
    _this.ControlCb = cb;
    var WorkModule = data.WorkModule;
    var ModulePara = data.ModulePara;
    var controlData={};
    var needEnterTrafficContrl=0;//是否需要进入管控模式
    switch(WorkModule){
        case 01://全日定周期
        {
            controlData = config.kmlcControlMode.changeScheme;
            controlData.CtrlMode=ModulePara;
        }
        break;

        case 05://全红控制
        {
            controlData = config.kmlcControlMode.fullRedMode;
        }
        break;
        case 06://黄闪控制
        {
            controlData = config.kmlcControlMode.flashYellowMode;
        }
        break;
        case 07://关灯控制
        {
            controlData = config.kmlcControlMode.closeLightMode;            
        }
        break;
        case 08://取消控制
        {
            controlData = config.kmlcControlMode.cancelControlMode;            
        }
        break;
        case 09://进入步进模式
        {
            controlData = config.kmlcControlMode.stepControlMode;
        }
        break;
        case 10://取消步进
        {
            controlData = config.kmlcControlMode.cancelStepControlMode;
        }
        break;
        case 02://分时段方式
        {
            controlData = config.kmlcControlMode.timeSegmentNoResponse;
        }
        break;
        case 03://感应模式
        {
            controlData = config.kmlcControlMode.timeSegmentNoResponse;
        }
        break;
        case 04://协调模式
        default:{
            var err = {errCode:0xFF,errorString:'Mode '+WorkModule+' is  not supported.'};
            return _this.ControlCb(err);
        }
        break;
    }
    if(WorkModule==09||WorkModule==10){
        _this.change2StepMode(controlData,function(err){
            cb(err);
        });
    }
    else
    {
        _this.chageCtrlModelSetting(controlData,function(err){
            cb(err);
        });
    }
}

//进入步进模式
kmlc_itsc.prototype.change2StepMode = function (data,cb) {
    var _this = this;
    this.ControlCb = cb;
    var ControlType = parseInt(data.CtrlType);
    var ControlModel = parseInt(data.CtrlMode);
    _this.fsm.currentControlModel = ControlModel;//正常运行模式
    _this.fsm.currentStep = ControlType;
    //_this.fsm.currentControlModel=ControlModel;
    _this.fsm.enterStepMode = function (err) {
        if (err.errCode) {//无法进入管控模式
            return _this.ControlCb(err);
        } else {
            _this.fsm.currentStepMode = 0x00;
            _this.settingContrlModule(_this.fsm.currentStep, _this.fsm.currentControlModel);
            console.log('进入步进模式,发送命令');
            _this.fsm.nextChangeControl = _this.fsm.onD2ModuleResponse;
        }
    }

    this.fsm.onD2ModuleResponse = function (err) {
        console.log('进入步进模式,onD2ModuleResponse');
        return _this.ControlCb(err);
    }

    this.fsm.onD0CancelResponse = function (err) {
        console.log('退出管控模式,onD0CancelResponse');
        _this.fsm.currentStepMode = 0xFF;
        return _this.ControlCb(err);
    }
    if (_this.fsm.currentStep == 0xD1) {
        console.log('退出步进模式');
        _this.exitTrafficContrl();
        _this.fsm.nextChangeControl = _this.fsm.onD0CancelResponse;
    }
    else if (_this.fsm.currentStepMode == 0xFF) {
        console.log('步进首先进入管控...');
        _this.fsm.nextChangeControl = _this.fsm.enterStepMode;
        _this.enterTrafficContrl();
    } else if (_this.fsm.currentStepMode == 0x00) {
        console.log('发送名另');
        _this.settingContrlModule(_this.fsm.currentStep, _this.fsm.currentControlModel);
        _this.fsm.nextChangeControl = _this.fsm.onD2ModuleResponse;
    }
}




kmlc_itsc.prototype.chageCtrlModelSetting = function(data,cb){
    var _this = this;
    this.ControlCb = cb;
    
    var ControlType = parseInt(data.CtrlType);
    // var ControlType = 0xDB;
    var ControlModel = parseInt(data.CtrlMode);

    this.fsm.ControlType = ControlType;
    this.fsm.ControlModel = ControlModel;
    this.fsm.currentControlModel=0xDB;
    ControlType=0xDB;
    _this.fsm.enterTrafficContrlResponse = function(err){
        if(err.errCode){//无法进入管控模式
            return _this.ControlCb(err);
        }else{
            _this.settingContrlModule(_this.fsm.currentStep,_this.fsm.currentControlModel);
            _this.fsm.nextChangeControl = _this.fsm.onDBModuleResponse;
        }
    }
    this.fsm.onDBModuleResponse = function(err) {
        //DB返回
        return _this.ControlCb(err);
    }
    this.fsm.onOthersModuleResponse = function(err) {
        //返回
        return _this.ControlCb(err);
    }
    
    this.fsm.onD0CancelResponse = function(err){

        console.log('退出管控模式');
        //_this.fsm.currentControlModel = 0x00;
        return _this.ControlCb(err);
    }

    console.log('ControlType=',ControlType,'ControlModel=',ControlModel);
    if(ControlType==0xD0){
        switch(ControlModel){
            case 0xf1:{
                _this.fsm.nextChangeControl = _this.fsm.onD0CancelResponse;
            }
            break;
        }
    }else if(ControlType==0xDB){
        switch(ControlModel){
            case 0xFD:
            case 0xFE:
            case 0xFF:{
                _this.fsm.nextChangeControl = _this.fsm.enterTrafficContrlResponse;
            }
            break;
            default:
            {
                if(ControlModel>=0x00&&ControlModel<=0x20){
                    if(ControlModel==0){
                        ControlModel=1;
                    }
                    _this.fsm.nextChangeControl = _this.fsm.onDBModuleResponse;
                }
                else
                {
                    _this.fsm.nextChangeControl = _this.fsm.enterTrafficContrlResponse;
                }
            }
            break;
        }
    }
    else{
        _this.fsm.nextChangeControl = _this.fsm.onOthersModuleResponse;
    }
    if(this.fsm.currentControlModel==0x00){
        _this.fsm.currentControlModel = ControlModel;//
        _this.fsm.currentStep=ControlType;
        _this.fsm.nextChangeControl = _this.fsm.enterTrafficContrlResponse;
        _this.enterTrafficContrl();
    }
    else{
        _this.fsm.currentControlModel = ControlModel;//
        _this.fsm.currentStep=ControlType;
        _this.settingContrlModule(_this.fsm.currentStep,_this.fsm.currentControlModel);
    }
}


/*改变信号灯的工作模式*/
kmlc_itsc.prototype.changeContrlModule = function(data, cb) {
    _this = this;
    this.ControlCb = cb;

    var ControlType = parseInt(data.CtrlType);
   // var ControlType = 0xDB;
    var ControlModel = parseInt(data.CtrlMode);


    this.fsm.ControlType = ControlType;
    this.fsm.ControlModel = ControlModel;
    //_this.settingContrlModule(ControlType,ControlModel);
     //this.fsm.onControl = function(){
     	
     //}
     
    this.fsm.onD0 = function(err) {
        console.log(_this.fsm.ControlType,_this.fsm.ControlModel.toString(16));
        if (_this.fsm.ControlModel == 0xF1) { //退出管制模式应答
            return _this.ControlCb(err);
        } else { //管制模式
            console.log(err);
            return _this.ControlCb(err);
            if (err.errCode) {
                return _this.ControlCb(err);
            } else {
                //D0返回
                if (_this.fsm.ControlType == 0xD2) { //步进请求	
                    _this.fsm.currentStep = 0xD1; //进入D1
                    _this.fsm.currentControlModel = 0xF1;
                } else if (_this.fsm.ControlType == 0xD1) { //交通管制
                    _this.fsm.currentStep = _this.fsm.ControlType;
                    _this.fsm.currentControlModel = _this.fsm.ControlModel;
                }

                _this.settingContrlModule(_this.fsm.currentStep, _this.fsm.currentControlModel);
            }
        }
    }

    this.fsm.onD1 = function(err) {
        if (err.errCode) {
            return _this.ControlCb(err);
        }
        //D0 D1返回
        if (_this.fsm.ControlType == 0xD2) { //进入D2
            _this.fsm.currentStep = _this.fsm.ControlType;
            _this.fsm.currentControlModel = _this.fsm.ControlModel;
            console.log(_this.fsm.currentStep, _this.fsm.currentControlModel);
            //_this.settingContrlModule(_this.fsm.currentStep, _this.fsm.currentControlModel);
        } else {
            return _this.ControlCb(err);
        }
    }

    this.fsm.onD2 = function(err) {
        //D2 返回
        return _this.ControlCb(err);
    }

    this.fsm.onDB = function(err) {
        //DB返回
        return _this.ControlCb(err);
    }

    //this.exitTrafficContrl();
    if (ControlType == 0xDB) { //DB可以直接发
        this.fsm.currentStep = 0xDB;
        this.settingContrlModule(ControlType, ControlModel);
    } else { //D2 或者D1 需要先进入D0
        this.enterTrafficContrl();
    }
}


//时基调度表信息
kmlc_itsc.prototype.parse8D = function(objsBody) {
    var rowCount = objsBody[0];
    var ScheduleInfo = [];
    var startIndex = 1;

    for (var i = 0; i < rowCount; ++i) {
        var Schedule = {};
        var rowBuf = objsBody.slice(startIndex, startIndex + 9);
        startIndex += 9;
        Schedule.PlanId = rowBuf[0];
        var TimeInfo = [];
        var time = {};
        var week={Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0};
        time.Month = rowBuf.slice(1, 3).readUInt16BE(0);//toolFunc.parseMonth(rowBuf.slice(1, 3).readUInt16BE(0).toString(2));
        time.DayOfWeek = rowBuf.slice(3, 4).readUInt8(0);//toolFunc.parseDayOfWeek(rowBuf.slice(3, 4).readUInt8(0).toString(2));
        time.DayOfMonth = rowBuf.slice(4, 8).readUInt32BE(0);//toolFunc.parseDayOfMonth(rowBuf.slice(4, 8).readUInt32BE(0).toString(2));
        TimeInfo.push(time);
        Schedule.month=time.Month;
        Schedule.day=time.DayOfWeek;
        Schedule.date=time.DayOfMonth;
        //Schedule.TimeInfo = TimeInfo;
        Schedule.PeriodInfoId = rowBuf[8]; //时段表号 0..255 , 0表示无效
        //Schedule.PeriodInfoId = rowBuf[8]; //时段表号 0..255 , 0表示无效
        ScheduleInfo[i] = Schedule;

    }
    //objsBody = objsBody.slice(startIndex, startIndex.length);
    //console.log(ScheduleInfo);
    return ScheduleInfo;
}

//时段表信息
kmlc_itsc.prototype.parse8E = function(objsBody) {
    var PeriodTableCount = objsBody[0];
    var PeriodEventCount = objsBody[1];
    var PeriodInfo = [];

    var SchemeInfo = {};
    var startIndex = 2;
    var periodCnt = 0;

    for (var i = 0; i < PeriodTableCount; ++i) {
        var PeriodEventInfo = [];
        var PeriodTable = {};
        for (var j = 0; j < PeriodEventCount; ++j) {
            var rowBuf = objsBody.slice(startIndex, startIndex + 6);
            startIndex += 6;
            console.log(rowBuf);
            var PeriodEventTable={};
            if(rowBuf[0]!=0 && rowBuf[4]!=0xff){
                PeriodTable.TimeIntervalTableId = rowBuf[0]; //时段表号（取值范围：1-16）
            }
            PeriodEventTable.TimeIntervalId = rowBuf[1]; //时段事件号（取值范围：1-48）
            PeriodEventTable.StartHour = rowBuf[2]; //0..23  事件起始时间(时)
            PeriodEventTable.StartMinute = rowBuf[3]; //0..59  事件起始时间(分)
            PeriodEventTable.ControlModel = rowBuf[4]; //模式(0无模式, 1关灯, 2黄闪, 3全红)
            PeriodEventTable.SchemeTabelId = rowBuf[5]; //方案号
            if(rowBuf[0]!=0){
                if(rowBuf[4]!=0xff){
                    console.log(PeriodEventTable);
                    PeriodEventInfo[j] = PeriodEventTable;
                }
            }

        }
        PeriodTable.TimeIntervalInfo = PeriodEventInfo;
        PeriodInfo[i] = PeriodTable;
    }
    console.log(PeriodInfo);
    return PeriodInfo;
}

//配时方案信息
kmlc_itsc.prototype.parseC0 = function(objsBody) {
    var _this=this;
    var SchemeTableCount = objsBody[0];
    var SchemeInfo = [];

    var startIndex = 1;

    for (var i = 0; i < SchemeTableCount; ++i) {
        var rowBuf = objsBody.slice(startIndex, startIndex + 5);
        startIndex += 5;
        var SchemeTable = {};
        SchemeTable.SchemeId = rowBuf[0]; //方案号
        SchemeTable.Cycle = rowBuf[1]; //周期时长
        SchemeTable.Offset = rowBuf[2]; //相位差
        SchemeTable.Coordphase = rowBuf[3]; //协调相位，0表示无协调，相位差设置无效
        SchemeTable.StageTableId = rowBuf[4]; //对应的阶段配时表号，0表示方案无效
        SchemeTable.StageData=[];
        if(SchemeTable.Offset>0){
            SchemeTable.Coordphase=1;
        }
        SchemeInfo[i] = SchemeTable;
    }
    console.log(SchemeInfo)

    return SchemeInfo;
}

//阶段配时表信息
kmlc_itsc.prototype.parseC1 = function(objsBody) {
    var stageSchemeCount = objsBody[0];
    var stageCount = objsBody[1];
    var StageTableInfo = [];
    var startIndex = 2;
    for (var i = 0; i < stageSchemeCount; ++i) {
        var StageTable = {};
        var StagesInfo = [];
        for (var j = 0; j < stageCount; ++j) {
            var rowBuf = objsBody.slice(startIndex, startIndex + 15);
            startIndex += 15;
            var Stage = {};
            if(rowBuf[0]!=0){
                StageTable.StageTableId = rowBuf[0]; //阶段表号（取值范围：1-16）
            }
            var tmpStageTableID=rowBuf[0];
            Stage.StageId = rowBuf[1]; ///阶段号（取值范围：1-16）
            /* 相位位图 bit0至bit31依次表示相位1至相位32,置1表示该阶段选中该相位放行, 可以同时置1多个相位 */
            Stage.PhaseBitmap = rowBuf.slice(2, 6).readUInt32BE(0);//toolFunc.parseDayOfMonth(rowBuf.slice(2, 6).readUInt32BE(0).toString(2)); ////放行相位
            //Stage.PPhase = toolFunc.parseDayOfMonth(Stage.PhaseBitmap.toString(2)); ////放行相位
            Stage.Green = rowBuf[6]; /* 绿灯时间 */
            Stage.GreenFlash = rowBuf[7]; /* 绿闪时间 */
            Stage.Yellow = rowBuf[8]; /* 黄灯时间 */
            Stage.Red = rowBuf[9]; /* 红灯时间 */
            Stage.WalkLight = rowBuf[10]; /* 行人通行时间 */
            Stage.WalkFlash = rowBuf[11]; /* 行人清空时间 */
            Stage.Delta = rowBuf[12]; /* 弹性延长时间 */
            Stage.MinGreen = rowBuf[13]; /* 最小绿灯时间 */
            Stage.MaxGreen = rowBuf[14]; /* 最大绿灯时间 */
        if(tmpStageTableID!=0)
        {
            StagesInfo[j] = Stage;
        }
    }
    StageTable.StagesInfo = StagesInfo;
    StageTableInfo[i] = StageTable;
    }return StageTableInfo;
}

//相位表
kmlc_itsc.prototype.parse95 = function(objsBody) {
    var _this=this;
    var phaseRowCount = objsBody[0];
    var phaseTable = [];
    var startIndex = 1;

    for (var i = 0; i < phaseRowCount; ++i) {
        var rowBuf = objsBody.slice(startIndex, startIndex + 8);
        startIndex += 8;
        var phaseTableRow = {};
        phaseTableRow.PhaseId = rowBuf[0]; // 相位号
        phaseTableRow.Channel = rowBuf[1]; //物理接线相关(详见驱动板通道定义)
        phaseTableRow.Corner = rowBuf[2]; //路口序号(北边路口为1, 顺时针依次增加)
        //phaseTableRow.laneId = rowBuf[3];		//车道编号()//目前还不支持所以该结构体为8个字节
        phaseTableRow.LaneType = rowBuf[3]; //车道类型(车 人 )
        ////冲突相位, bit0 至 bit31 依次表示相位1至32,置1表示冲突
        phaseTableRow.ConflictPhase = rowBuf.readUInt32BE(4);//toolFunc.parseDayOfMonth(rowBuf.readUInt32BE(4).toString(2));
        phaseTable[i] = phaseTableRow;
    }
    return phaseTable;
}

//系统状态信息
kmlc_itsc.prototype.parseE1 = function(objsBody) {
    var _this=this;
    //var realTimeData = [];
    var dataRow = {};
    //dataRow.Id = "5326212711";
    dataRow.Id = this.option.deviceId;
    // toolFunc.readUint64BE(objsBody);   //设备ID
    var statusData = objsBody.slice(8);
    var CrossStatusInfo = [];

    // console.log('------system time-------')
    var year = objsBody[0] + 2000;
    var month = objsBody[1];
    var day = objsBody[2];
    var hour = objsBody[3];
    var muniter = objsBody[4];
    var second = objsBody[5];
    var msecond = objsBody[6] * 255 + objsBody[7];

    dataRow.Time = year + '-' + toolFunc.NumberToString(month, 2) + '-' + toolFunc.NumberToString(day, 2) + ' ' +
        toolFunc.NumberToString(hour, 2) + ':' + toolFunc.NumberToString(muniter, 2) + ':' + toolFunc.NumberToString(second, 2) + '.' + toolFunc.NumberToString(msecond, 3);

    

    for (var i = 0; i < 8; ++i) {
        var crossStatus = {};
        crossStatus.CrossID = i + 1;
        crossStatus.Status = statusData[i]; //toolFunc.parseCrossStatus(objsBody[i]);
        CrossStatusInfo.push(crossStatus);
        //  console.log(crossStatus);
    }
    dataRow.CrossStatusInfo = CrossStatusInfo;
    //dataRow.CtrlMode = objsBody[8];//0自动，1管控
    dataRow.CtrlMode = statusData[9]; //toolFunc.parseRunningMode(objsBody[9]);//定周期	 分时段 自适应 全红 闪光  关灯
    dataRow.PlanID = statusData[10]; //显示当前执行的方案号
    dataRow.CycleTime = statusData[11]; //周期时间
    dataRow.StepTotal = statusData[12]; //总步数
    dataRow.StepNow = statusData[13]; //当前步序号
    dataRow.StepLen = statusData[14]; //当前步的时长(单位秒)
    dataRow.StepSurplusTime = statusData[15]; //当前步的剩余时间(单位秒)
    dataRow.MinGreenTime = statusData[16]; //最小绿
    dataRow.MaxGreenTime = statusData[17]; //最大绿
    dataRow.partitionId = _this.partitionId;
    //dataRow.hasFault = objsBody[18];//故障数据更新标志 不为0标示有故障记录
    //realTimeData.push(dataRow);
    //return realTimeData;
    //console.log(dataRow);

    this.reportObject.uploadSignalStatus(dataRow,function(err){
        if(err){
            console.log(err);
        }
    });

    //console.log(dataRow);
    return dataRow;
}

//系统故障信息
kmlc_itsc.prototype.parseE2 = function(objsBody) {
    var recordTotalCount = objsBody.readUInt16BE(0);
    var currentPacktRecordCount = objsBody[2];
    var records = [];
    var record = {};
    var startIndex = 3;
    for (var i = 0; i < currentPacktRecordCount; ++i) {
        var rowBuf = objsBody.slice(startIndex, startIndex + 18);
        startIndex += 18;
        record.id = rowBuf.readUInt16BE(0);
        record.faultCode = rowBuf.readUInt16BE(2);
        record.faultInfoNo = rowBuf.readUInt16BE(4);
        var happenTime = {};
        happenTime.year = rowBuf[6] + 2000;
        happenTime.month = rowBuf[7];
        happenTime.day = rowBuf[8];
        happenTime.hour = rowBuf[9];
        happenTime.minute = rowBuf[10];
        happenTime.second = rowBuf[11];
        record.happenTime = happenTime;
        var clearTime = {};
        clearTime.year = rowBuf[12] + 2000;
        clearTime.month = rowBuf[13];
        clearTime.day = rowBuf[14];
        clearTime.hour = rowBuf[15];
        clearTime.minute = rowBuf[16];
        clearTime.second = rowBuf[17];
        record.clearTime = clearTime;
        records[i] = record;
    }
    return records;
}

//E3 – 运行日志信息
kmlc_itsc.prototype.parseE3 = function(objsBody) {
    var recordTotalCount = objsBody.readUInt16BE(0);
    var currentPacktRecordCount = objsBody[2];
    var records = [];
    var record = {};
    var startIndex = 3;
    for (var i = 0; i < currentPacktRecordCount; ++i) {
        var rowBuf = objsBody.slice(startIndex, startIndex + 8);
        startIndex += 8;
        record.faultCode = rowBuf.readUInt16BE(0);
        var happenTime = {};
        happenTime.year = rowBuf[2] + 2000;
        happenTime.month = rowBuf[3];
        happenTime.day = rowBuf[4];
        happenTime.hour = rowBuf[5];
        happenTime.minute = rowBuf[6];
        happenTime.second = rowBuf[7];
        record.happenTime = happenTime;
        records[i] = record;
    }
    return records;

}

kmlc_itsc.prototype.parseE4 = function(objsBody){
    var _this=this;
    var strData = objsBody.toString("hex");
    var realTrafficFlow = new flowReport.RealTrafficFlow({Id:_this.option.deviceId});
    realTrafficFlow.parseObject(objsBody);
    realTrafficFlow.partitionId = _this.partitionId;

    this.reportObject.uploadRealTrafficFlow(realTrafficFlow,function(err){
        if(err){
            console.log(err);
        }
    });
    return realTrafficFlow;
}


kmlc_itsc.prototype.parseE5 = function(objsBody){
    var _this=this;
    var realLaneQueue = new flowReport.RealLaneQueue({Id:_this.option.deviceId});
    realLaneQueue.parseObject(objsBody);
    realLaneQueue.partitionId = _this.partitionId;

    this.reportObject.uploadRealLaneQueue(realLaneQueue,function(err){
        if(err){
            console.log(err);
        }
    });
    return realLaneQueue;
}

kmlc_itsc.prototype.parseCA = function (objsBody) {
    var _this = this;
    console.log(objsBody);
    var connerCnt = objsBody[0];
    var ConnerData = [];
    var startIndex = 1;
    for (var i = 0; i < connerCnt; i++) {
        var rowBuf = objsBody.slice(startIndex, startIndex + 20);
        var conner = rowBuf[0];
        var buffer_name=rowBuf.slice(1,20);
        var connerName = buffer_name.slice(0,buffer_name.indexOf(0x00)).toString('utf-8');
        startIndex += 20;
        ConnerData.push({Corner:conner,Name:connerName});
    }
    return ConnerData;
}


kmlc_itsc.prototype.parseF1 = function(objsBody) {
    var records = [];
    var device = {};
    device.Id = toolFunc.readUint64BE(objsBody);
    records.push(device);
    return records;
}

//FF - 时间操作
kmlc_itsc.prototype.parseFF = function(objsBody) {
    var records = [];
    var dateTime = {};
    dateTime.year = objsBody[0] + 2000;
    dateTime.month = objsBody[1];
    dateTime.day = objsBody[2];
    datetime.hour = objsBody[3];
    datetime.minute = objsBody[4];
    datetime.seconds = objsBody[5];
    records.push(datetime);
    return records;
}



kmlc_itsc.prototype.parseDC = function(objsBody) {
    var setRes = {};
    retCode = objsBody[0];
    setRes.code = retCode;
    setRes.cando = false;
    switch (retCode) {
        case 0x00:
            {
                setRes.cando = true;
                setRes.msg = "could be set";
                this.fsm.StartSet();
            }
            break;
        case 0x01:
            {
                setRes.msg = "device is setting by someone";
            }
            break;
        default:
            {
                setRes.msg = "unkown error";
            }
    }
    return setRes;
}


kmlc_itsc.prototype.parseDD = function(objsBody) {
    var setRes = {errCode:0,Id:this.deviceId,info:''};
    var retCode = objsBody[0];
    setRes.errCode = retCode;
    switch (retCode) {
        case 0x00:
            {
                setRes.errCode = errorCode.noerror;
                setRes.info = "success";
            }
            break;
        case 0x01:
            {
                setRes.errCode = errorCode.signalnotexist;
                setRes.info = "配置检查不通过";
            }
            break;
        case 0x02:
            {
                setRes.errCode = errorCode.settingsomeone;
                setRes.info = "其他人在配置中";
            }
            break;
        default:
            {
                setRes.errCode = errorCode.unkownerror;
                setRes.info = "未知错误";
            }
            break;
    }
    return setRes;
}


kmlc_itsc.prototype.queryData = function() {
    var objId = ObjIds[Math.floor(this.objIdIndex % 5)];
    var data = null;
    if (objId == "E2") {
        data = "2180" + objId + "00000A" + "00";
    } else {
        data = "2180" + objId + "00";
    }

    ++this.objIdIndex;
    console.log("queryData :" + data);
    var result = this.makeFrame(data);
    var getBuffer = new Buffer(result, "hex");
    console.log(getBuffer.toString("hex"));
    this.sendData(getBuffer);
    var _this = this;
    this.timer = setTimeout(function() {
        _this.queryData();
    }, 5 * 1000);
}

/**
 *
 * @param {*} data
 * @param {*} cb
 */
kmlc_itsc.prototype.configParameterV1 = function(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    _this.fsm.command='configParameter';
    console.log('*************V1 is********************');

    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        return;
    }

    var CornerTable = [];
    var ScheduleTable = []; /*时基表*/
    var PeriodTable = []; /*时段表*/
    var SchemeTable = []; /*方案表*/
    var StageTable = []; /*阶段表*/
    var PhaseTable = []; /*相位表*/
    var PeriodTimeTable = [];
    var ChannelTable = [];
    CornerTable = data.CornerTable;
    PhaseTable = data.PhaseTable;
    //ChannelTable = data.ChannelTable;
    SchemeTable = data.SchemeTable;
    PeriodTimeTable = data.PeriodTimeTable;
    ScheduleTable = data.ScheduleTable;
    for(var i=0;i<PhaseTable.length;i++){
        PhaseTable[i].ConflictPhase=0;
        _this.getkmlcChannelCfg(PhaseTable[i].Corner,PhaseTable[i].LaneType,function (res) {
            if(res){
                PhaseTable[i].Channel = res.channelId;
                PhaseTable[i].kmlcPhaseId = res.phaseId;
                PhaseTable[i].name = res.name;
            }
        });
    }
    for (var iix = 0; iix < SchemeTable.length; iix++) {
        var stageTableId = SchemeTable[iix].StageTableId;
        for (var iiy = 0; iiy < SchemeTable[iix].StageData.length; iiy++) {
            console.log(SchemeTable[iix].StageData[iiy].PhaseBitmap.toString(2));
            genKmlcProtoBuff.genkmlcPhaseBitmap(SchemeTable[iix].StageData[iiy].PhaseBitmap, PhaseTable, function (res) {
                SchemeTable[iix].StageData[iiy].lcPhaseBitmap=res;
            });
        }
    }
    if(ScheduleTable == null || ScheduleTable.length==0){
        var err = {
            errCode: 0x05,
            Id: DeviceId,
            info: "时基表未配置 ScheduleTable"
        };
        this.setCb(err);
        return;
    }

    if(CornerTable==null || CornerTable.length==0){
        var err = {
            errCode: 0x06,
            Id: DeviceId,
            info: "路口表未配置 CornerTable"
        };
        this.setCb(err);
        return;
    }

    var controlMode={};
    for (var i=1;i<=16;i++){
        controlMode[i]=0;
    }
    for(var i=0;i<SchemeTable.length;i++){
        SchemeTable[i].Cycle = SchemeTable[i].Cycle;
        SchemeTable[i].Offset = SchemeTable[i].Offset;
        SchemeTable[i].SchemeId=SchemeTable[i].StageTableId;
        SchemeTable[i].StageTableId=SchemeTable[i].StageTableId;
        if(SchemeTable[i].Coordphase==1){//是无缆协调
            controlMode[SchemeTable[i].SchemeId]=0x0a;
        }
        else
        {
            controlMode[SchemeTable[i].SchemeId]=0;
        }
    }
    for (var iix = 0; iix < PeriodTimeTable.length; iix++) {
        var id = PeriodTimeTable[iix].TimeIntervalTableId;
        for (var iiy = 0; iiy < PeriodTimeTable[iix].TimeIntervalInfo.length; iiy++) {
            var SchemeTabelId = PeriodTimeTable[iix].TimeIntervalInfo[iiy].SchemeTabelId;
            PeriodTimeTable[iix].TimeIntervalInfo[iiy].SchemeTableId=SchemeTabelId;
            PeriodTimeTable[iix].TimeIntervalInfo[iiy].ControlModel=controlMode[SchemeTabelId];
        }
    }

    var scheduleTable = [];

    for (var iix = 0; iix < ScheduleTable.length; iix++) {
        var tmp=ScheduleTable[iix];
        var defaultSchedule={};//
        defaultSchedule.PlanId=tmp.PlaneId;
        defaultSchedule.Month=0b1111111111110;
        defaultSchedule.Day=0b11111110;
        defaultSchedule.Date=0b11111111111111111111111111111110;
        defaultSchedule.PeriodId=tmp.Week.Mon;
        scheduleTable.push(defaultSchedule);
        for (var iiy = 0; iiy < ScheduleTable[iix].SpecialDayTable.length; iiy++) {
            var tmp1=ScheduleTable[iix].SpecialDayTable[iiy];
            var scheduleItem={};
            scheduleItem.PlanId=iiy+2;
            scheduleItem.Month=tmp1.Month;
            scheduleItem.Day=0;
            scheduleItem.Date=tmp1.Day;
            scheduleItem.PeriodId=tmp1.PeriodTableId;
            scheduleTable.push(scheduleItem);
        }
    }



    var deviceIdBuf=genKmlcProtoBuff.SettingDeviceID(DeviceId)
    console.log(deviceIdBuf);


    var stageBuf = genKmlcProtoBuff.SettingStageTables(SchemeTable);
    console.log(stageBuf);

    var patternBuf = genKmlcProtoBuff.SettingPatternTable(SchemeTable);
    console.log(patternBuf);


    var periodBuf = genKmlcProtoBuff.SettingPeriodTable(PeriodTimeTable);
    console.log(periodBuf);


    var scheduleBuf = genKmlcProtoBuff.SettingScheduleTable(scheduleTable);
    console.log(scheduleBuf);


    var cornerBuf = genKmlcProtoBuff.SettingConnerTable(CornerTable);
    console.log(cornerBuf);


    this.fsm.onReadySet = function(event, from, to) {
        console.log('onReadySet');
        _this.StartSettingParammer(); //DC --1
    }

    this.fsm.onSetConnerReq = function(event, from, to) {
        console.log('onSetConnerReq');
        return _this.sendData(cornerBuf);
    }

    this.fsm.onSetDeviceIdReq = function(event, from, to) {
        console.log('onSetDeviceIdReq');
        return _this.sendData(deviceIdBuf);
    }

    this.fsm.onSetScheduleReq = function(event, from, to) {
        console.log('onSetScheduleReq');
        //_this.SettingScheduleTableV1(ScheduleTable); //8D--5
        return _this.sendData(scheduleBuf);
    }

    this.fsm.onSetPeriodTableReq = function(event, from, to) {
        console.log('onSetPeriodTableReq');
        return _this.sendData(periodBuf);
    }
    this.fsm.onSetPatternTableReq = function(event, from, to) {
        console.log('onSetPatternTableReq');
        return _this.sendData(patternBuf);
    }
    this.fsm.onSetStageTableReq = function(event, from, to) {
        console.log('onSetStageTableReq');
        return _this.sendData(stageBuf);
    }
    this.fsm.onSetPhaseTabelReq = function(event, from, to) {
        console.log('onSetPhaseTabelReq')
        _this.SettingPhaseTabel(PhaseTable); //95--13
    }
    this.fsm.onEndSet = function(event, from, to) {
        console.log('onEndSet');
        _this.makeSureSetting(); //DD--15
    }


    //this.fsm.onReadySet();
    if (!this.deviceStatus) {
        setTimeout(function() {
            if (!_this.deviceStatus) {
                var err = {
                    errCode: 0x02,
                    msg: "can't connect to itsc"
                };
                _this.setCb(err);
            } else {
                _this.fsm.onReadySet();
            }
        }, 1000 * 3);
    } else {
        this.fsm.onReadySet();
    }
}

//startSpecialParameter

kmlc_itsc.prototype.startSpecialParameter = function(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        return;
    }
    _this.fsm.onDBModuleResponse = function (err) {
        //DB返回
        return _this.setCb(err);
    }
    _this.fsm.nextChangeControl = _this.fsm.onDBModuleResponse;
    _this.settingContrlModule(0xDB, 16);
}


kmlc_itsc.prototype.stopSpecialParameter = function(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        return;
    }
    _this.fsm.onDBModuleResponse = function (err) {
        //DB返回
        return _this.setCb(err);
    }
    _this.fsm.nextChangeControl = _this.fsm.onDBModuleResponse;
    _this.settingContrlModule(0xDB, 33);
}



/**
 *
 * @param {*} data
 * @param {*} cb
 */
kmlc_itsc.prototype.configSpecialParameter = function(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    _this.fsm.command = 'configSpecial';
    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        return;
    }
    console.log('*************configSpecialParameter  V1 is********************');
    var ScheduleTable = [];
    /*时基表*/
    var PeriodTable = [];
    /*时段表*/
    var SchemeTable = [];
    /*方案表*/
    var StageTable = [];
    /*阶段表*/
    var PhaseTable = [];
    /*相位表*/
    var PeriodTimeTable = [];
    var ChannelTable = [];
    SchemeTable = [];

    var releasePhase = _this.getPhaseIdWithConner(data.Corner, data.Lane);
    var destBitmap = 0;
    destBitmap |= (1 << (releasePhase-1));
    for (var i = 1; i <= 2; i++) {
        var tmp = {};
        tmp.StageTableId = 16;
        tmp.StageId = i;
        tmp.PhaseBitmap = destBitmap;
        tmp.lcPhaseBitmap=destBitmap;
        tmp.Green = 19;
        tmp.GreenFlash = 1;
        tmp.Yellow = 0;
        tmp.Red = 0;
        tmp.WalkLight = 1;
        tmp.WalkFlash = 1;
        tmp.Delta = 1;
        tmp.MinGreen = 10;
        tmp.MaxGreen = 60;
        StageTable.push(tmp);
    }
    {
        var tmp = {};
        tmp.SchemeId=16;
        tmp.Cycle = 40;
        tmp.Offset = 0;
        tmp.Coordphase = 0;
        tmp.StageTableId = 16;//StageTabelId
        tmp.StageData = StageTable;//stageTableId
        tmp.stageTableId = 16;
        SchemeTable.push(tmp);
    }

    this.fsm.onReadySet = function (event, from, to) {
        console.log('onReadySet');
        _this.StartSettingParammer(); //DC --1
    }
    this.fsm.onSetPatternTableReq = function (event, from, to) {
        console.log('onSetPatternTableReq');
        var patternBuf = genKmlcProtoBuff.SettingPatternTable(SchemeTable);
        return _this.sendData(patternBuf);
        //_this.SettingPatternTable(SchemeTable); //C0--9
    }
    this.fsm.onSetStageTableReq = function (event, from, to) {
        console.log('onSetStageTableReq');
        var stageBuf = genKmlcProtoBuff.SettingStageTables(SchemeTable);
        return _this.sendData(stageBuf);
    }
    this.fsm.onEndSet = function (event, from, to) {
        console.log('onEndSet');
        _this.makeSureSetting(); //DD--15
    }
    this.fsm.onFinshParamerSet = function (event, from, to) {

    }
    //this.fsm.onReadySet();
    if (!this.deviceStatus) {
        setTimeout(function () {
            if (!_this.deviceStatus) {
                var err = {
                    errCode: -1,
                    info: "can't connect to itsc"
                };
                _this.setCb(err);
            } else {
                _this.fsm.onReadySet();
            }
        }, 1000 * 3);
    } else {
        this.fsm.onReadySet();
    }
}

var genKmlcProtoBuff = require('./config/genKmlcProtoBuff')


/**
 * configGreenWaveBandParamer
 * @param {*} data
 * @param {*} cb
 */
kmlc_itsc.prototype.configGreenWaveBandParamer = function(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    _this.fsm.command = 'configGreenWaveBandParamer';
    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        //return;
    }

    console.log('*************configGreenWaveBandParamer  V1 is********************');
    var ScheduleTable = [];
    /*时基表*/
    var PeriodTable = data.PeriodTimeTable;
    /*时段表*/
    var SchemeTable = data.SchemeTable;
    /*方案表*/
    var StageTable = [];
    /*阶段表*/
    var PhaseTable = data.PhaseTable;
    /*相位表*/
    var PeriodTimeTable = [];
    var ChannelTable = [];
    ScheduleTable = data.ScheduleTable;


    for(var i=0;i<PhaseTable.length;i++){
        PhaseTable[i].ConflictPhase=0;
        _this.getkmlcChannelCfg(PhaseTable[i].Corner,PhaseTable[i].LaneType,function (res) {
            if(res){
                PhaseTable[i].Channel = res.channelId;
                PhaseTable[i].kmlcPhaseId = res.phaseId;
                PhaseTable[i].name = res.name;
            }
        });
    }

    for (var iix = 0; iix < SchemeTable.length; iix++) {

        var stageTableId = SchemeTable[iix].StageTableId;
        for (var iiy = 0; iiy < SchemeTable[iix].StageData.length; iiy++) {
            genkmlcPhaseBitmap(SchemeTable[iix].StageData[iiy].PhaseBitmap, PhaseTable, function (res) {
                SchemeTable[iix].StageData[iiy].lcPhaseBitmap=res;
            });
        }
    }





    this.fsm.onReadySet = function (event, from, to) {
        console.log('onReadySet');
        _this.StartSettingParammer(); //DC --1
    }

    this.fsm.onSetStageTableReq = function (event, from, to) {
        console.log('onSetStageTableReq');
        var stageBuf = genKmlcProtoBuff.SettingStageTables(SchemeTable);
        return _this.sendData(stageBuf);
    }

    this.fsm.onSetPatternTableReq = function (event, from, to) {
        console.log('onSetPatternTableReq');
        var patternBuf = genKmlcProtoBuff.SettingPatternTable(SchemeTable);
        return _this.sendData(patternBuf);
    }

    this.fsm.onSetPeriodTableReq = function(event, from, to) {
        console.log('onSetPeriodTableReq');
        var periodBuf = genKmlcProtoBuff.SettingPeriodTable(PeriodTable);
        return _this.sendData(periodBuf);
    }

    this.fsm.onSetScheduleReq = function(event, from, to) {
        console.log('onSetScheduleReq');
        var scheduleBuf = genKmlcProtoBuff.SettingScheduleTable(ScheduleTable);
        return _this.sendData(scheduleBuf);
    }


    this.fsm.onEndSet = function (event, from, to) {
        console.log('onEndSet');
        _this.makeSureSetting(); //DD--15
    }

    //this.fsm.onReadySet();
    if (!this.deviceStatus) {
        setTimeout(function () {
            if (!_this.deviceStatus) {
                var err = {
                    errCode: 0x02,
                    info: "can't connect to itsc"
                };
                _this.setCb(err);
            } else {
                _this.fsm.onReadySet();
            }
        }, 1000 * 3);
    } else {
        this.fsm.onReadySet();
    }
}





/**
 * 查询信号机参数
 * @param data
 * @param cb
 */
kmlc_itsc.prototype.queryParamer = function (data, cb) {
    var _this = this;

    console.log('device-status=', _this.deviceStatus);
    _this.ControlCb = cb;
    _this.fsm.command = 'queryParamer';

    if (_this.deviceStatus == false) {
        var err = {
            errCode: 0x02,
            Id: DeviceId,
            info: "信号机未连接"
        };
        this.setCb(err);
        return;
    }



    console.log(_this.fsm.paramerConfigure);

    _this.fsm.onQueryConnerInfo = function (event,from,to) {
        console.log('onQueryConnerInfo')
        _this.getConerTable();
    }

    _this.fsm.onQueryPhaseInfo = function (event, from, to) {
        console.log('onQueryPhaseInfo')
        _this.getphaseTable();
    }

    _this.fsm.onQueryStageInfo = function (event, from, to) {
        console.log('onQueryStageInfo')
        _this.getStageTable();
    }

    _this.fsm.onQuerySchemeInfo = function (event, from, to) {
        console.log('onQuerySchemeInfo')
        _this.getSchemeTable();
    }

    _this.fsm.onQueryPeriodInfo = function (event, from, to) {
        console.log('onQueryPeriodInfo')
        _this.getPeriodTable();
    }

    _this.fsm.onScheduleInfo = function (event, from, to) {
        console.log('onScheduleInfo')
        _this.getScheduleTable();
    }//getScheduleTable


    _this.fsm.onEndQuery = function (event, from, to) {
    }

    _this.fsm.onEndCallback = function () {
        for (var i = 0; i < _this.fsm.paramerConfigure.SchemeTableInfo.length; i++) {
            _this.fsm.paramerConfigure.SchemeTableInfo[i].StageData = _this.getStageTableWithId(_this.fsm.paramerConfigure.StageTableInfo,
                _this.fsm.paramerConfigure.SchemeTableInfo[i].StageTableId);
            _this.fsm.paramerConfigure.SchemeTableInfo[i].Cycle = 0;
            for (var j = 0; j < _this.fsm.paramerConfigure.SchemeTableInfo[i].StageData.length; j++) {
                var tmp = _this.fsm.paramerConfigure.SchemeTableInfo[i].StageData[j];
                _this.fsm.paramerConfigure.SchemeTableInfo[i].Cycle += tmp.Green + tmp.GreenFlash + tmp.Yellow + tmp.Red;
            }
        }
        var queryParamerResult = {};
        queryParamerResult.Id = _this.option.deviceId;
        queryParamerResult.PhaseTable = _this.fsm.paramerConfigure.phaseTable;
        queryParamerResult.SchemeTableInfo = _this.fsm.paramerConfigure.SchemeTableInfo;
        queryParamerResult.PeriodTimeTable = _this.fsm.paramerConfigure.PeriodTimeTable;
        queryParamerResult.ScheduleInfo = _this.fsm.paramerConfigure.ScheduleInfo;
        var s = new Set();
        var stagePhaseBitmap=[];
        var SchemeTableInfo = queryParamerResult.SchemeTableInfo;
        for (var i = 0; i < SchemeTableInfo.length; i++) {
            var StageTableId=SchemeTableInfo[i].StageTableId;
            var tmp={StageTableId:StageTableId,PhaseArray:[]};
            for (var iix = 0; iix < SchemeTableInfo[i].StageData.length; iix++) {
                var StageDataItem = SchemeTableInfo[i].StageData[iix];
                var PhaseBitmap = StageDataItem.PhaseBitmap.toString(2);
                var phaseArr=[];
                for (var j = 0, k = PhaseBitmap.length - 1; j < PhaseBitmap.length; j++, k--) {
                    if (PhaseBitmap[k] == '1') {
                        s.add(j + 1);
                        phaseArr.push(j+1);
                    }
                }
                tmp.PhaseArray.push(phaseArr);
            }
            //stagePhaseBitmap.push(tmp);
        }

        var StageTableInfo=_this.fsm.paramerConfigure.StageTableInfo;
        for(var jjx=0;jjx<StageTableInfo.length;jjx++)
        {
            var tmp={StageTableId:StageTableInfo[jjx].StageTableId,PhaseArray:[]};
            for (var iix=0;iix<StageTableInfo[jjx].StagesInfo.length;iix++){
                var StageDataItem = StageTableInfo[jjx].StagesInfo[iix];
                var PhaseBitmap = StageDataItem.PhaseBitmap.toString(2);
                var phaseArr=[];
                for (var j = 0, k = PhaseBitmap.length - 1; j < PhaseBitmap.length; j++, k--) {
                    if (PhaseBitmap[k] == '1') {
                        phaseArr.push(j+1);
                    }
                }
                tmp.PhaseArray.push(phaseArr);
            }
            stagePhaseBitmap.push(tmp);
        }

        var segconfigarray_tmp = [];
        var segconfigarray = [];
        for (var i = 0; i < 8; i++) {
            var tmp = {};
            tmp.DeviceId = _this.deviceId;
            tmp.SegNo = i + 1;
            tmp.LaneNum = 0;
            tmp.HasPassageway = 0;
            tmp.exists = 0;
            segconfigarray_tmp.push(tmp);
        }


        function getConnerId(phaseId) {
            var tmpPhaseTable = KmlcSignalTable.PhaseTable[phaseId - 1];
            return {Corner: tmpPhaseTable.Corner, HasPassageway: tmpPhaseTable.LaneType};
        }

        for (var i of s) {
            var tmp = getConnerId(i);
            var connerId = tmp.Corner;
            var LaneType = tmp.HasPassageway;
            segconfigarray_tmp[connerId - 1].exists = 1;
            if (LaneType == 4) {
                segconfigarray_tmp[connerId - 1].HasPassageway = 1;
            }
            else {
                segconfigarray_tmp[connerId - 1].LaneNum += 1;
            }
        }
        for (var i = 0; i < segconfigarray_tmp.length; i++) {
            if (segconfigarray_tmp[i].exists == 1) {
                segconfigarray.push({
                    DeviceId: segconfigarray_tmp[i].DeviceId,
                    SegNo: segconfigarray_tmp[i].SegNo,
                    LaneNum: segconfigarray_tmp[i].LaneNum,
                    HasPassageway: segconfigarray_tmp[i].HasPassageway,
                });
            }
        }
        //console.log(segconfigarray);
        queryParamerResult.SegConfig=segconfigarray;

        var laneconfigarray = [];
        var phaseconfigarray = [];
        for (var i of s) {//KmlcSignalTable.PhaseTable
            var tmp = {
                DeviceId: _this.deviceId,
                SegNo: KmlcSignalTable.PhaseTable[i - 1].Corner,
                LaneNo: KmlcSignalTable.PhaseTable[i - 1].LaneType,
                LaneDirection: KmlcSignalTable.PhaseTable[i - 1].name,
                Phase: KmlcSignalTable.PhaseTable[i - 1].PhaseIdc,
                PhaseType: 1,
                LaneType: (KmlcSignalTable.PhaseTable[i - 1].LaneType == 4 ? 1 : 0)
            };
            laneconfigarray.push(tmp);
            phaseconfigarray.push({
                DeviceId: _this.deviceId,
                Phase: KmlcSignalTable.PhaseTable[i - 1].PhaseIdc,
                PhaseId: i,
                Description: KmlcSignalTable.PhaseTable[i - 1].Description
            });
        }
        queryParamerResult.PhaseConfig=phaseconfigarray;
        queryParamerResult.LaneConfig=laneconfigarray;

        var stateinfoconfigarray_tmp = [];
        var stateinfoconfigarray = [];
        for (var i = 0; i < 16; i++) {
            stateinfoconfigarray_tmp.push({
                DeviceId: _this.deviceId,
                StageId: i + 1,
                exists: 0
            });
        }

        var StageTableInfo = _this.fsm.paramerConfigure.StageTableInfo
        for (var i = 0; i < StageTableInfo.length; i++) {
            var StageTableId = StageTableInfo[i].StageTableId;
            for (var j = 0; j < StageTableInfo[i].StagesInfo.length; j++) {
                stateinfoconfigarray.push({
                    DeviceId: _this.deviceId,
                    StageId: StageTableInfo[i].StagesInfo[j].StageId,
                    Green: StageTableInfo[i].StagesInfo[j].Green,
                    GreenFlash: StageTableInfo[i].StagesInfo[j].GreenFlash,
                    Red: StageTableInfo[i].StagesInfo[j].Red,
                    RedFlash: 0,
                    Yellow: StageTableInfo[i].StagesInfo[j].Yellow,
                    YellowFlash: 0,
                    MaxGreen: StageTableInfo[i].StagesInfo[j].MaxGreen,
                    MinGreen: StageTableInfo[i].StagesInfo[j].MinGreen,
                    WalkLight: StageTableInfo[i].StagesInfo[j].WalkLight,
                    WalkFlash: StageTableInfo[i].StagesInfo[j].WalkFlash,
                    Delta: StageTableInfo[i].StagesInfo[j].Delta,
                    PhaseBitmap: StageTableInfo[i].StagesInfo[j].PhaseBitmap,
                    Duration: StageTableInfo[i].StagesInfo[j].Green + StageTableInfo[i].StagesInfo[j].GreenFlash + StageTableInfo[i].StagesInfo[j].Red + StageTableInfo[i].StagesInfo[j].Yellow,
                    StageTableId: StageTableId
                });
            }
        }
        //getPhaseDiff(1,queryParamerResult.SchemeTableInfo)
        function getPhaseDiff(chemeId,SchemeTableInfo) {
            var offset=0;
            for(var i=0;i<SchemeTableInfo.length;i++)
            {
                if (chemeId==SchemeTableInfo[i].SchemeId){
                    offset=SchemeTableInfo[i].Offset;
                    break;
                }
            }
            return offset;
        }
        queryParamerResult.StageInfoConfig=stateinfoconfigarray;

        //console.log(stateinfoconfigarray);
        var dayarray = [];
        var PeriodTimeTable = queryParamerResult.PeriodTimeTable;
        for (var i = 0; i < PeriodTimeTable.length; i++) {
            var TimeNumber = PeriodTimeTable[i].TimeIntervalTableId;
            for (var j = 0; j < PeriodTimeTable[i].TimeIntervalInfo.length; j++) {
                var starthourtime=PeriodTimeTable[i].TimeIntervalInfo[j].StartHour<10?('0'+PeriodTimeTable[i].TimeIntervalInfo[j].StartHour):PeriodTimeTable[i].TimeIntervalInfo[j].StartHour
                var startmintime=PeriodTimeTable[i].TimeIntervalInfo[j].StartMinute<10?('0'+PeriodTimeTable[i].TimeIntervalInfo[j].StartMinute):PeriodTimeTable[i].TimeIntervalInfo[j].StartMinute;
                dayarray.push({
                    DeviceId: _this.deviceId,
                    DayNo: PeriodTimeTable[i].TimeIntervalInfo[j].TimeIntervalId,
                    TimeNo: -1,
                    WeekDayType: -1,
                    StartTime: starthourtime+':'+startmintime,
                    TimeMode:PeriodTimeTable[i].TimeIntervalInfo[j].ControlModel,
                    PlanNo:PeriodTimeTable[i].TimeIntervalInfo[j].SchemeTabelId,
                    PhaseDiff:getPhaseDiff(PeriodTimeTable[i].TimeIntervalInfo[j].SchemeTabelId,queryParamerResult.SchemeTableInfo),
                    TimeNumber:TimeNumber
                });
            }
        }
        queryParamerResult.Day=dayarray;


        var ringConfigArr=[];
        for(var i=0;i<stagePhaseBitmap.length;i++){
            var phaseMatrix=[];
            for(var j=0;j<=stagePhaseBitmap[i].PhaseArray.length-1;j++){
                var len=stagePhaseBitmap[i].PhaseArray[j].length;
                for(var iix=0;iix<6-len;iix++){
                    stagePhaseBitmap[i].PhaseArray[j].push(0);
                }
                phaseMatrix.push(stagePhaseBitmap[i].PhaseArray[j]);
            }
            var A2 = matrix.transpose(phaseMatrix);//转置矩阵
            var A3=[];
            A2.forEach(function (item) {
                var tmpArr=[];
                item.forEach(function (phaseId) {
                    if(phaseId>0){
                        tmpArr.push(KmlcSignalTable.PhaseTable[phaseId-1].PhaseIdc);
                    }
                    else
                    {
                        tmpArr.push(0);
                    }
                })
                A3.push(tmpArr);
            });
            var k=1;
            var tmpArr=[];

            A3.forEach(function (item) {

                var len=item.length;
                for(var jxx=0;jxx<5-len;jxx++){
                    item.push('');
                }

            });

            A3.forEach(function (item) {

                var len=item.length;
                for(var jxx=0;jxx<len;jxx++){
                    if(item[jxx]==0)
                        item[jxx]='';
                }

            });

            A3.forEach(function (item) {

                var flag=0;
                for(var jxx=0;jxx<item.length;jxx++){
                    if(item[jxx]!=''){
                        flag++;
                    }
                }
                if(flag!=0){
                    tmpArr.push({
                        RingNo:k,
                        phaseArrays:item
                    });
                }
                k++;
            });

            ringConfigArr.push({
                StageTableId:stagePhaseBitmap[i].StageTableId,
                SchemeId:stagePhaseBitmap[i].StageTableId,
                RingArray:tmpArr
            });
        }

        queryParamerResult.RingConfig=ringConfigArr;
        queryParamerResult.CornerTable=_this.fsm.paramerConfigure.connerTable;


        //console.log(JSON.stringify(queryParamerResult));


        var err = {errCode: 0x00, msg: (queryParamerResult)};
        _this.ControlCb(err);
    }

    _this.fsm.onQueryPhaseInfo();
}


kmlc_itsc.prototype.getStageTableWithId = function (StageTableInfo,stageid) {
    var StageData=[];
    for (var i=0;i<StageTableInfo.length;i++){
        if(StageTableInfo[i].StageTableId==stageid){
            StageData=StageTableInfo[i].StagesInfo;
            break;
        }
    }
    return StageData;
}








module.exports = kmlc_itsc;