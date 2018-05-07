var toolFunc = require('./commonTools.js');


function ITSCRealTrafficFlow() {

}


function ITSCRealTrafficFlowItem() {
    
}

function RealTrafficFlowItem() {
    var _this = this;
    _this.LaneId = 0;
    _this.Speed = 0;
    _this.Type = 0;
    _this.SmallCar = 0;
    _this.MediumSizeCar=0;
    _this.FullSizeCar = 0;
    _this.HeadwayTime = 0;
    _this.HeadwaySpace = 0;
    _this.SpaceOccupancy = 0;
}


RealTrafficFlowItem.prototype.setObject = function (option) {
    var _this = this;
    _this.LaneId = option.LaneId;
    _this.Speed = option.Speed;
    _this.Type = option.Type;
    _this.SmallCar = option.SmallCar;
    _this.MediumSizeCar = option.FullSizeCar;
    _this.FullSizeCar = option.FullSizeCar;
    _this.HeadwayTime = option.HeadwayTime;
    _this.HeadwaySpace = option.HeadwaySpace;
    _this.SpaceOccupancy = option.SpaceOccupancy;
}

RealTrafficFlowItem.prototype.parseObject = function (data) {
    var _this = this;
    var index=0;
    _this.LaneId = data[index++];
    _this.Speed = data[index++];
    _this.Type = data[index++];
    index++;
    _this.SmallCar = data.readInt32BE(index);
    index+=4;
    _this.MediumSizeCar = data.readInt32BE(index);
    index+=4;
    _this.FullSizeCar = data.readInt32BE(index);
    index+=4;
    _this.HeadwayTime = data.readInt32BE(index);
    index+=4;
    _this.HeadwaySpace = data.readInt32BE(index);
    index+=4;
    _this.SpaceOccupancy = data.readInt16BE(index);
    index+=2;
}

RealTrafficFlowItem.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.LaneId, 1);
    dataBuf += toolFunc.valueToHEX(_this.Speed, 1);
    dataBuf += toolFunc.valueToHEX(_this.Type, 1);
    dataBuf += '00';//扩展
    dataBuf += toolFunc.valueToHEX(_this.SmallCar, 4);
    dataBuf += toolFunc.valueToHEX(_this.MediumSizeCar, 4);
    dataBuf += toolFunc.valueToHEX(_this.FullSizeCar, 4);
    dataBuf += toolFunc.valueToHEX(_this.HeadwayTime, 4);
    dataBuf += toolFunc.valueToHEX(_this.HeadwaySpace, 4);
    dataBuf += toolFunc.SpaceOccupancy(_this.HeadwaySpace, 2);
    return dataBuf;
}



function RealTrafficFlow(option) {
    var _this = this;
    _this.Id=option.Id;
    _this.Time='';
    _this.RealTrafficFlow=[];
}



RealTrafficFlow.prototype.setObject = function (option) {
    var _this = this;

}


Date.prototype.Format = function(fmt)
{ //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}


RealTrafficFlow.prototype.parseObject = function (data) {
    var _this = this;
    var index = 0;
//    index += 3;//扩展头
//    index += 4;
    var cornerCount = data[index++];
    var time1 = new Date().Format("yyyy-MM-dd hh:mm:ss");
    for (var i = 0; i < cornerCount; i++) {
        var cornerFlow = {};
        cornerFlow.Corner = data[index++];
        cornerFlow.LaneCount = data[index++];
        cornerFlow.DetectorId = data.readInt16BE(index);
        index += 2;
        cornerFlow.SamplingPeriod = data.readInt32BE(index);
        index += 4;
        cornerFlow.Time = time1;
        cornerFlow.LaneFlow = [];
        for (var j = 0; j < 8; j++) {
            var laneFlow = {};
            laneFlow.LaneId = data[index++];
            laneFlow.Speed = data[index++];
            laneFlow.Type = data[index++];
            index++;
            laneFlow.SmallCar = data.readInt32BE(index);
            index += 4;
            laneFlow.MediumSizeCar = data.readInt32BE(index);
            index += 4;
            laneFlow.FullSizeCar = data.readInt32BE(index);
            index += 4;
            laneFlow.HeadwayTime = data.readInt32BE(index);
            index += 4;
            laneFlow.HeadwaySpace = data.readInt32BE(index);
            index += 4;
            laneFlow.SpaceOccupancy = data.readInt16BE(index);
            index += 2;
            laneFlow.TimeOccupancy = data.readInt16BE(index);
            index += 2;
            if (laneFlow.LaneId != 0&&laneFlow.LaneId<=cornerFlow.LaneCount) {
                cornerFlow.LaneFlow.push(laneFlow);
            }
        }
        if (cornerFlow.Corner != 0) {
            _this.RealTrafficFlow.push(cornerFlow);
        }
    }
}


function RealLaneQueueCornerItem() {
    var _this = this;
    _this.Corner = 0;
    _this.LaneId = 0;
    _this.Type = 0;
    _this.Length = 0;
}



RealLaneQueueCornerItem.prototype.setObject = function (option) {
    var _this = this;
    _this.Corner = option.Corner;
    _this.LaneId = option.LaneId;
    _this.Type = option.Type;
    _this.Length = option.Length;
}



RealLaneQueueCornerItem.prototype.parseObject = function (data) {
    var _this = this;
    var index = 0;
    _this.Corner = data[index++];
    _this.LaneId = data[index++];
    _this.Type = data[index++];
    _this.Length = data[index++];
}

RealLaneQueueCornerItem.prototype.toBuffer = function () {
    var _this = this;
    var dataBuf = '';
    dataBuf += toolFunc.valueToHEX(_this.Corner,1);
    dataBuf += toolFunc.valueToHEX(_this.LaneId,1);
    dataBuf += toolFunc.valueToHEX(_this.Type,1);
    dataBuf += toolFunc.valueToHEX(_this.Length,1);
    return dataBuf;
}

function RealLaneQueueCorner() {
    var _this = this;
    _this.Corner = 0;
    _this.Time = '';
    _this.RealLaneQueueItem = [];
}


RealLaneQueueCorner.prototype.setObject = function (option) {
    var _this = this;
    var realLaneQueueItem = new RealLaneQueueCornerItem();
    realLaneQueueItem.Corner = option.Corner;
    realLaneQueueItem.LaneId = option.LaneId;
    realLaneQueueItem.Type = option.Type;
    realLaneQueueItem.Length = option.Length;
    _this.RealLaneQueueItem.push(realLaneQueueItem);
}

RealLaneQueueCorner.prototype.parseObject = function (data) {
    var _this = this;
    var index = 0;
    //index += 3;//扩展头
    //index += 4;
    _this.Corner = data[index];
    var len = (data.length -3) / 4;
    console.log(len);
    for (var i = 0; i < len; i++) {
        var realLaneQueueItem = new RealLaneQueueCornerItem();
        realLaneQueueItem.Corner = data[index++];
        realLaneQueueItem.LaneId = data[index++];
        realLaneQueueItem.Type = data[index++];
        realLaneQueueItem.Length = data[index++];
        if(realLaneQueueItem.Type!=0){
            console.log(realLaneQueueItem);
            _this.RealLaneQueueItem.push(realLaneQueueItem);
        }
    }
}

RealLaneQueueCorner.prototype.toBuffer = function () {
    var _this = this;
    var count = _this.RealLaneQueueItems.length;
    var dataBuf = '2183e500';
    for (var i = 0; i < count; i++) {
        var realLaneQueueItem = _this.RealLaneQueueItems[i];
        dataBuf += realLaneQueueItem.toBuffer();
    }
    return dataBuf;
}


function RealLaneQueue(option) {
    var _this = this;
    _this.Id = option.Id;
    _this.UpTime = '';
    _this.RealLaneQueue = [];
}


RealLaneQueue.prototype.parseObject=function (data) {
    var _this = this;
    var index = 0;
    //index += 3;//扩展头
    //index += 4;

    var time1 = new Date().Format("yyyy-MM-dd hh:mm:ss");
//    _this.Corner = data[index];
    _this.UpTime = time1;
    var len = (data.length  ) / 4;
    var realLaneQueueItems = [];
    var flag = 1;
    for (var i = 0; i < len; i++) {
        var realLaneQueueItem = {};
        realLaneQueueItem.Corner = data[index++];
        realLaneQueueItem.Time = time1;
        realLaneQueueItem.LaneId = data[index++];
        realLaneQueueItem.Type = data[index++];
        realLaneQueueItem.Length = data[index++];
        if (realLaneQueueItem.Type != 0) {
            realLaneQueueItems.push(realLaneQueueItem);
        }
        if (flag == 8) {
            flag = 1;
            var realLaneQueueCorner = {};
            realLaneQueueCorner.Corner = realLaneQueueItem.Corner;
            realLaneQueueCorner.Time = time1;
            realLaneQueueCorner.RealLaneQueueItem = [];
            for (var j = 0; j < realLaneQueueItems.length; j++) {
                realLaneQueueCorner.RealLaneQueueItem.push({
                    LaneId: realLaneQueueItems[j].Corner,
                    Type: realLaneQueueItems[j].Type,
                    Length: realLaneQueueItems[j].Length
                });
            }
            realLaneQueueItems.splice(0, realLaneQueueItems.length);
            if (realLaneQueueCorner.RealLaneQueueItem.length != 0) {
                _this.RealLaneQueue.push(realLaneQueueCorner);
            }
        }
        flag += 1;
    }
}


/*
var strDataBuf='6807452183e40008010000240000000001000200000000000000000000000000000000000000000000000000020002000000000000000000000000000000000000000000000000000300010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003040027000000b401000200000000000000000000000000000000000000000000000000020002000000000000000000000000000000000000000000000000000329010000000005000000000000000000000016000001100000000f003900000000000400000000000000000000001d000001c500000007004400000800000000000000000000000b000000df00000000000d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005010025000000b40100020000000000000000000000000000000000000000000000000002000200000000000000000000000000000000000000000000000000033b01000c0000000100000000000000070000008b0000000000180000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007030026000000b401470200000000040000000000000000000000120000018e000000050245020000000004000000000000000000000019000002330000000603360100000000010000000000000000000002c00000288700000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f4a516';

var dataBuf = new Buffer(strDataBuf,'hex');

console.log(dataBuf);

var realTrafficFlow = new RealTrafficFlow({Id:'7000000000001'});
realTrafficFlow.parseObject(dataBuf);


var jsonString = JSON.stringify(realTrafficFlow);
console.log(jsonString);





var strDataBuf='6801042183e5000101020001020200010301000104000001050000010600000107000001080000020100000202000002030000020400000205000002060000020700000208000003010200030202000303011003040000030500000306000003070000030800000401000004020000040300000404000004050000040600000407000004080000050102000502020005030100050400000505000005060000050700000508000006010000060200000603000006040000060500000606000006070000060800000701020007020200070301000704000007050000070600000707000007080000080100000802000008030000080400000805000008060000080700000808000024fe16';
var dataBuf = new Buffer(strDataBuf,'hex');

console.log(dataBuf);

var realLaneQueue = new RealLaneQueue({Id:'7000000000001'});
realLaneQueue.parseObject(dataBuf);
//console.log(realLaneQueue.RealLaneQueue[0]);

var jsonString = JSON.stringify(realLaneQueue);
console.log(jsonString);

*/



module.exports.RealTrafficFlow = RealTrafficFlow;
module.exports.RealLaneQueue = RealLaneQueue;