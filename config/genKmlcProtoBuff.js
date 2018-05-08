
var toolFunc = require('../commonTools.js');

var KmlcSignalTable = require('./KmlcSignalTable');

function getkmlcPhaseId(phaseId,phaseTables,callback) {
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

genkmlcPhaseBitmap = function(phaseBitmap,phaseTables,callback) {
    var bitmapstrings = (phaseBitmap).toString(2);
    var arrPhaseId=[];
    for (var i=bitmapstrings.length-1,j=1;i>=0,j<=16;i--,j++){
        if(bitmapstrings[i]=='1'){
            getkmlcPhaseId(j,phaseTables,function (lcphaseid,name) {
                arrPhaseId.push({srcId:j,kmlcPhaseId:lcphaseid,name:name});
            });
        }
    }
    var desBitmap=0;
    console.log('arrPhaseId=',arrPhaseId);
    for(var i=0;i<arrPhaseId.length;i++){
        desBitmap|=(1<<(arrPhaseId[i].kmlcPhaseId-1));
    }
    callback(desBitmap);
    return desBitmap;
}

function createStageTableData(data) {
    var result = '';
    result = result + toolFunc.valueToHEX(data.stageTableId, 1);
    result = result + toolFunc.valueToHEX(data.stageId, 1);
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
    return result;
}



function createPatternTableData(data) {
    var tmp = '';
    console.log('createPatternTableData item',data.SchemeId,data.Cycle,data.Offset,data.Coordphase,data.StageTableId);
    tmp = tmp + toolFunc.valueToHEX(data.SchemeId, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Cycle, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Offset, 1);
    tmp = tmp + toolFunc.valueToHEX(data.Coordphase, 1);
    tmp = tmp + toolFunc.valueToHEX(data.StageTableId, 1);
    return tmp;
}

function counterDataLenght(data) {
    var len = data.length / 2;
    var tmp = len.toString(16);
    while (tmp.length < 4) {
        tmp = '0' + tmp;
    }
    return tmp;
}


function makeFrame(data) {
    var tmp = '68';
    var tmp = tmp + counterDataLenght(data);
    var tmp = tmp + data;
    var tmp = tmp + toolFunc.CRC(data);
    var tmp = tmp + '16';
    return tmp;
}



function SettingPatternTable(data) {
    var result = '';
    var counter = 0;
    for (var iix = 0; iix < data.length; iix++) {

        result = result + createPatternTableData(data[iix]);
        counter++;
    }
    result = '2181c000' + toolFunc.valueToHEX(counter, 1) + result;
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}

function createCornerTableData(data) {
    console.log('createCornerTableData item',data.Corner,data.Name);
    var buffer=new Buffer(20);
    var buff_name = new Buffer(data.Name,'utf-8');
    buffer[0]=data.Corner;
    for(var iix=1;iix<20;iix++){
        buffer[iix]=buff_name[iix-1];
    }
    return buffer.toString('hex');
}


function SettingConnerTable(data) {
    var result = '';
    var counter=0;
    for(var iix=0;iix<data.length;iix++){
        result += createCornerTableData(data[iix]);
        counter++;
    }
    result = '2181ca00' + toolFunc.valueToHEX(counter, 1) + result;
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}


function SettingStageTables(data) {
    var result = '';
    var m = data.length;
    var n = 0;
    var counter = 0;
    for (var iix = 0; iix < data.length; iix++) {
        var stageTableId = data[iix].StageTableId;
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
            tmp.lcPhaseBitmap=data[iix].StageData[iiy].lcPhaseBitmap;
            counter = counter + 1;
            result = result + createStageTableData(tmp);
        }
    }
    console.log(result);
    if (counter == 0) {
        return;
    }
    if (counter % m == 0) {
        n = counter / m;
    } else {
        n = parseInt(counter / m) + 1;
    }
    while (n * m - counter) {
        result = result + '00000000000000000000000000000000';
        counter++;
    }
    result = '2181c100' + toolFunc.valueToHEX(m, 1) + toolFunc.valueToHEX(n, 1) + result;
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}

function createPeriodTableData(data) {
    var tmp = '';
    console.log(data);
    tmp = tmp + toolFunc.valueToHEX(data.id, 1);
    tmp = tmp + toolFunc.valueToHEX(data.PeriodEventID, 1);
    tmp = tmp + toolFunc.valueToHEX(data.StartHour, 1);
    tmp = tmp + toolFunc.valueToHEX(data.StartMinute, 1);
    tmp = tmp + toolFunc.valueToHEX(data.ControlModel, 1);
    tmp = tmp + toolFunc.valueToHEX(data.SchemeTableId, 1);
    return tmp;
}


function SettingPeriodTable(data) {
    var counter = 0;
    var result = '';
    var m = data.length;

    for (var iix = 0; iix < data.length; iix++) {
        var id = data[iix].TimeIntervalTableId;
        for (var iiy = 0; iiy < data[iix].TimeIntervalInfo.length; iiy++) {
            var PeriodEventID = data[iix].TimeIntervalInfo[iiy].TimeIntervalId;
            var StartHour = data[iix].TimeIntervalInfo[iiy].StartHour;
            var StartMinute = data[iix].TimeIntervalInfo[iiy].StartMinute;
            var SchemeTableId = data[iix].TimeIntervalInfo[iiy].SchemeTableId;
            var ControlModel = data[iix].TimeIntervalInfo[iiy].ControlModel;


            result = result + createPeriodTableData({
                id:id,
                PeriodEventID:PeriodEventID,
                StartHour:StartHour,
                StartMinute:StartMinute,
                ControlModel:ControlModel,
                SchemeTableId:SchemeTableId });

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
    while (n * m - counter) {
        result = result + '000000000000';
        counter++;
    }

    /****************************/
    result = '21818e00' + toolFunc.valueToHEX(m, 1) + toolFunc.valueToHEX(n, 1) + result;
    console.log('V1时基表data:', result);
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}

function createScheduleTable(ScheduleTable){
    var result = '';
    console.log(ScheduleTable);
    result = toolFunc.valueToHEX(ScheduleTable.PlanId, 1);
    result = result + toolFunc.valueToHEX(ScheduleTable.Month, 2);
    result = result + toolFunc.valueToHEX(ScheduleTable.Day, 1);
    result = result + toolFunc.valueToHEX(ScheduleTable.Date, 4);
    result = result + toolFunc.valueToHEX(ScheduleTable.PeriodId, 1);
    console.log(result);
    return result;
}


function SettingScheduleTable(data) {
    var counter = 0;
    var result = '';
    for(var i=0;i<data.length;i++){
        result = result+createScheduleTable(data[i]);
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
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}

function SettingDeviceID(id) {
    var result = '';
    result = result + toolFunc.valueToHEX(id, 8);
    result = '2181f100' + result;
    console.log('设备ID data:', result);
    var tmp = makeFrame(result);
    var getBuffer = new Buffer(tmp, 'hex');
    return getBuffer;
}


function
createPhaseTableData(data) {
    //data 中包含方案表中的所有相位信息
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



function SettingPhaseTabel(data) {
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




module.exports.makeFrame = makeFrame;
module.exports.counterDataLenght = counterDataLenght;
module.exports.createPatternTableData = createPatternTableData;

module.exports.SettingPatternTable = SettingPatternTable;
module.exports.SettingStageTables = SettingStageTables;
module.exports.SettingPeriodTable  = SettingPeriodTable;
module.exports.SettingScheduleTable = SettingScheduleTable;
module.exports.SettingDeviceID = SettingDeviceID;
module.exports.SettingConnerTable = SettingConnerTable;
module.exports.genkmlcPhaseBitmap = genkmlcPhaseBitmap;


