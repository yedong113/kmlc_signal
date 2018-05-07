/*公共函数*/
/*
var log4js = require("log4js");
var config = require("./log4js.json");
log4js.configure(config);
var log = {};
log.info = function(str) {
    log4js.getLogger("parse").info(str);
    console.log(str);
}

log.warn = function(str) {
    log4js.getLogger("parse").warn(str);
    console.log(str);
}

log.err = function(str) {
    log4js.getLogger("parse").error(str);
}
*/
function BufferPrintfHex(data) {
    var str = new Buffer(data).toString('HEX');
    var len = str.length;
    var tmp = '';
    for (var iix = 0; iix < len; iix++) {
        tmp = tmp + str.substring(2 * iix, 2 * iix + 2) + ' ';
    }
    return tmp;
}

/****************************************************************
 *把10进制数转换成16进制的字符串,len为字节长度
 *****************************************************************/
function Value2HexString(strVal, len) {
    var val = parseInt(strVal);
    var tmp = val.toString(16);
    if (tmp.length > 2 * len) {
        tmp = tmp.substring(tmp.length - 2 * len);
    }

    while (tmp.length < 2 * len) {
        tmp = '0' + tmp;
    }
    return tmp;
}
// console.log(Value2Hex(12,2))
module.exports.Value2HexString = Value2HexString

/************************************************************
 *把Buffer 转换成16进制字符串
 *************************************************************/
function Buffer2HexString(buf) {
    var tmp = '';
    for (var iix = 0; iix < buf.length; iix++) {
        tmp = tmp + Value2HexString(buf[iix], 1)
    }
    return tmp;
}

// console.log(Buffer2HexString(new Buffer([1,2,3,4,5])))
module.exports.Buffer2HexString = Buffer2HexString


function BufferPrintfHex(data) {
    var str = new Buffer(data).toString('HEX');
    var len = str.length;
    var tmp = '';
    for (var iix = 0; iix < len; iix++) {
        tmp = tmp + str.substring(2 * iix, 2 * iix + 2) + ' ';
    }
    return tmp;
}

String.prototype.Reverse = function() {
    return this.split('').reverse().join('');
}

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


function readUint64BE(data) {
    var result = '';
    var buf = data.slice(0, 8);
    return parseInt(buf.toString("hex"), 16);
}


//（00：灭，01：红，10：黄，11：绿）
//熄灯 0x00,  红灯0x01,   黄灯0x02,  绿灯0x03
function getManLightColor(byteData) {
    var R = byteData & 0x80;
    var G = byteData & 0x08;
    if (R) {
        return 0x01;
    } else if (G) {
        return 0x03;
    } else {
        return 0x00;
    }
}

//最后3bits
function getVehicleColor(byteData) {
    var R = byteData & 0x04;
    var Y = byteData & 0x02;
    var G = byteData & 0x01;
    if (R) {
        return 0x01;
    } else if (Y) {
        return 0x02;
    } else if (G) {
        return 0x03;
    } else {
        return 0x00;
    }
}

function createStatus(data) {
    var status = 0;
    var manColor = getManLightColor(data[0]); //人行(1)
    var rightColr = getVehicleColor(data[2] >>> 4); //[2]bit  6 5 4
    var straightColor = getVehicleColor(data[1]); //bit 2 1 0
    var leftColor = getVehicleColor(data[1] >>> 4); //bit 6 5 4

    status |= manColor << 6;
    status |= rightColr << 4;
    status |= straightColor << 2;
    status |= leftColor;
    return status;
}


function getStepPhase(uplightData, dnlightData) {
    var phases = []; // 4*4 =16 4个方向所有各个相位的灯色 
    var startIndex = 0;
    var corners = [3, 5, 7, 1]; //东南西北
    var lanes = [4, 3, 2, 1]; //人行 右转 直行 左转

    var funs = [getManLightColor, getVehicleColor, getVehicleColor, getVehicleColor];
    for (var i = 0; i < 4; ++i) { //每1方向 
        var upCornerData = uplightData.slice(startIndex, startIndex + 3);
        var dnCornerData = dnlightData.slice(startIndex, startIndex + 3);
        startIndex += 3;
        var upDatas = [upCornerData[0], upCornerData[2] >>> 4, upCornerData[1], upCornerData[1] >>> 4];
        var dnDatas = [dnCornerData[0], dnCornerData[2] >>> 4, dnCornerData[1], dnCornerData[1] >>> 4];
        for (var j = 0; j < 4; ++j) { //每1车道类型
            var onePhase = {
                'Corner': corners[i],
                'Lane': lanes[j]
            };
            var upcolor = funs[j](upDatas[j]);
            var dncolor = funs[j](dnDatas[j]); //灭 R Y G ==0 1 2 3
            console.log("color =", dncolor);
            if (upcolor == 0 && dncolor == 3) { //闪烁 黄闪8 绿闪12 
                onePhase.Color = dncolor * 4; //12
            } else { //灭 R Y G ==0 1 2 3
                onePhase.Color = dncolor;
            }
            phases.push(onePhase);
        }
    }
    return phases;
}

//  g f r r ---人行  4step (0 < j <4)
//  g f y r---车  4step(0 < j <4)
//    0 1 2 3 | 4 5 6 7 | 8 910 11|12131415
//  |---------------------------------------
// A  g f y r | r r r r | r r r r | r r r r 
// B  g f y r | r r r r | r r r r | r r r r 
// M  g f r r | r r r r | r r r r | r r r r 
// N  g f r r | r r r r | r r r r | r r r r 
// C  r r r r | g f y r | r r r r | r r r r 
// D  r r r r | g f y r | r r r r | r r r r 
// E  r r r r | r r r r | g f y r | r r r r 
// F  r r r r | r r r r | g f y r | r r r r 
// O  r r r r | r r r r | g f r r | r r r r 
// P  r r r r | r r r r | g f r r | r r r r 
// G  r r r r | r r r r | r r r r | g f y r
// H  r r r r | r r r r | r r r r | g f y r
// 	  0          1        2         3       i
// -------------------------------------------- j
//     i*4 + j   i*4 +j      i*4+j   i*4+j
function stepToStage(steps) {
    //oneStage
    //G f R R  3 12 1 1人行  
    var manStageColorStr = [3, 12, 1, 1].toString();
    //G f Y R  3 12 2 1车
    var vhicleStageColorStr = [3, 12, 2, 1].toString();
    var stages = [];
    //查看前面4步每个相位
    var phaseCount = steps[0].phases.length;
    var stepCount = steps.length;
    var stageCount = stepCount / 4;
    for (var i = 0; i < stageCount; ++i) { //阶段数目 从阶段1开始
        var stage = {
            'StageID': i,
            'phaseTable': [],
            'Green': steps[i * 4 + 0].StepTime,
            'GreenFlash': steps[i * 4 + 1].StepTime,
            'Yellow': steps[i * 4 + 2].StepTime,
            'Red': steps[i * 4 + 3].StepTime,
            'MinGreen': steps[i * 4 + 3].MinGreen,
            'MaxGreen': steps[i * 4 + 3].MaxGreen
        }
        for (var it = 0; it < phaseCount; ++it) { //遍历各个相位的各个阶段
            //1个阶段4个step
            var probePhases = [steps[i * 4 + 0].phases[it].Color, steps[i * 4 + 1].phases[it].Color, steps[i * 4 + 2].phases[it].Color, steps[i * 4 + 3].phases[it].Color];
            var probePhasesStr = probePhases.toString();
            console.log("probePhasesStr = ", probePhasesStr);
            if ((probePhasesStr == manStageColorStr) || (probePhasesStr == vhicleStageColorStr)) {
                var phase = {
                    'Corner': steps[0].phases[it].Corner,
                    'Lane': steps[0].phases[it].Lane
                }
                stage.phaseTable.push(phase);
            }
        }
        stages.push(stage);
    }
    return stages;
}

function createPacket(type, param, body) {
    var packet = '';
    packet += type;
    packet += param;
    packet += body;
    return new Buffer(packet, 'hex');
}

function isleap() {
    var the_year = new Date().getFullYear();
    var isleap = the_year % 4 == 0 && the_year % 100 != 0 || the_year % 400 == 0;
    return isleap;
}

function getMonthDayCount(month) {
    var days = {
        '1': 31,
        '3': 31,
        '5': 31,
        '7': 31,
        '8': 31,
        '10': 31,
        '12': 31,
        '4': 30,
        '6': 30,
        '9': 30,
        '11': 30,
        '2': function() {
            var leap = isleap();
            if (leap) {
                return 29;
            }
            return 28;
        }(),
    };
    return days[month];
}


function sequenceDateTimeinfo(startMonth, startDay, endMonth, endDay) {
    var timeInfos = [];
    for (var i = startMonth; i < endMonth + 1; ++i) {
        var timeInfo = {
            'Month': i,
            'DayOfMonth': function() {
                var monthDays = getMonthDayCount(i);
                var days = [];
                if (i == startMonth) {
                    for (var j = startDay; j < monthDays + 1; ++j) {
                        days.push(j);
                    }
                } else if (i == endMonth) {
                    for (var n = 1; n < endDay + 1; ++n) {
                        days.push(n);
                    }
                } else {
                    for (var m = 1; m < monthDays + 1; ++m) {
                        days.push(m);
                    }
                }
                return days;
            }()
        };
        timeInfos.push(timeInfo);
    }
    return timeInfos;
}


function getWeekDays(num) {
    var weekDays = [];
    for (var i = 7; i > 0; --i) {
        var shiftNum = 1 << (7 - i);
        if (shiftNum & num) {
            weekDays.push(i);
        }
    }
    return weekDays;
}


function getMonthDays(num) {
    var monthDays = [];
    for (var i = 31; i > 0; --i) {
        var shiftNum = 1 << (31 - i)
        if (shiftNum & num) {
            monthDays.push(i);
        }
    }
    return monthDays;
}

function getMonths(num) {
    var months = [];
    for (var i = 12; i > 0; --i) {
        var shiftNum = 1 << (12 - i)
        if (shiftNum & num) {
            months.push(i);
        }
    }
    return months;
}

function fillDefaultData(value, len) {
    var ret = '';
    var tmp = '';
    if (typeof(value) == 'number') {
        tmp = Value2HexString(value, 1);
    } else if (typeof(value) == 'string') {
        tmp = value;
    }

    if (tmp == '') {
        return '';
    } else {
        for (var iix = 0; iix < len; iix++) {
            ret = ret + tmp;
        }
    }
    return ret;
}

module.exports.fillDefaultData = fillDefaultData;

module.exports.getMonths = getMonths;
module.exports.getMonthDays = getMonthDays;
module.exports.getWeekDays = getWeekDays;
module.exports.sequenceDateTimeinfo = sequenceDateTimeinfo;
module.exports.getMonthDayCount = getMonthDayCount;
module.exports.stepToStage = stepToStage;
module.exports.getStepPhase = getStepPhase;
module.exports.createPacket = createPacket;
module.exports.createStatus = createStatus;
module.exports.readUint64BE = readUint64BE;
module.exports.BufferPrintfHex = BufferPrintfHex;
module.exports.String = String;
module.exports.Date = Date;
//module.exports.log = log;
