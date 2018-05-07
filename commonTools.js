/*公共函数*/
var log4js = require("log4js");
var config = require("./log4js.json");

var ping = require ("net-ping");


function toolPing(option) {
    this.session = ping.createSession ();
    this.target = option;
}


toolPing.prototype.pingHost = function (callback) {
    var _this = this;
    _this.session.pingHost(_this.target,function (error,target) {
        if(error){
            callback({
                errCode: 0x06,
                info: "信号机掉线"
            });
        }else
        {
            callback({
                errCode: 0x0,
                info: "信号机在线"
            });
        }
    });
}





//log4js.configure(config);
log4js.configure({
	appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
	categories: { default: { appenders: ['cheese'], level: 'error' } }
  });
function crc(data)
{
	var result = 0xffff;
	var buf = new Buffer(data,'hex');

	for(var iix=0;iix<buf.length;iix++){
		result = result^(buf[iix]);
		for (var i = 0; i < 8; ++i) {
			var k = result & 0x01;
			result = result >> 1;
			if (k) {
				result = result ^ 0xA001;
			}
		}
	}

	var tmp = result.toString(16);
	while(tmp.length<4){
		tmp = '0' + tmp;
	}

	if(tmp.length>4){
		tmp = tmp.substring(tmp.length-4);
	}
	//console.log("check code:",tmp);
	return tmp;
}


var FLAG_OBJ_COUNT=  112; //0111 0000
var FLAG_OPER_TYPE  = 15; //0000 1111

var FLAG_INDEX_COUNT = 192;	//1100 0000
var FLAG_SUB_OBJECT = 63; //0011 1111



//data 16进制char【消息类型】
function parseMsgType(data){
	var res = {};
	res.objsCount = ((data & FLAG_OBJ_COUNT) >> 4) + 1;	
	res.msgType = data & FLAG_OPER_TYPE;
	return res;
}

//data 5个字节buffer【对象域】
function parseIndexSubObj(data){
	var res ={};
	res.ObjId = data[0].toString(16);
	res.subObjId = data[1] & FLAG_SUB_OBJECT;
	res.indexCount = (data[1] & FLAG_INDEX_COUNT) >> 6;
	var indexs = [];
	if(res.indexCount > 0){
		for(var i = 0; i < indexCount; ++i){
			indexs[i] = data[3 + i];
		}
	}
	res.indexs = indexs;
	return res;
}


function parseDayOfMonth(bitArray){
	var array = [];
	var dayOfMonth = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];	
	for(var i = bitArray.length-2, j = 0; j < 31; --i,++j){
		if(bitArray[i] == 1){
			array.push(dayOfMonth[j]);
		}
	}
	return array;

}

function parseMonth(bitArray){
		var array = [];		
		var months = [1,2,3,4,5,6,7,8,9,10,11,12];
		for(var i = bitArray.length-2, j = 0; j < 12; --i,++j){
			if(bitArray[i] == 1){
				array.push(months[j]);
			}
		}
		return array;
}

function parseDayOfWeek(bitArray){
	var array = [];
	var dayOfWeek = [7,1,2,3,4,5,6];
	for(var i = bitArray.length-2, j = 0; j < 7;--i,++j){
		if(bitArray[i] == 1){
			array.push(dayOfWeek[j]);
		}
	}
	return array;
}

var directionPos = {
	"0" : 6,
	"1" : 4, 
	"2" : 2,
	"3" : 0
}

var directionDesc = {
	"0" : "Zebra",  
	"1" : "Right",
	"2" : "Straight",
	"3" : "Left"
}

var colorDesc = {
	"0" : "Black",
	"1" : "Red",	
	"2" : "Yellow",
	"3" : "Green"
};


function parseCrossStatus(byteData){
	var status = {};
	for(var  i = 0; i < 4; ++i){
		var colorCode = (byteData >> directionPos[i]) & 0x03;
		status[directionDesc[i]] = colorDesc[colorCode];
	}
	return status;
}


var runningModel={
	"0" : "FixedCycle",
	"1" : "TimeSegment",
	"2" : "SelfAdapting",
	"3" : "AllRed",
	"4" : "Flash",
	"5" : "LightOff"
}

function parseRunningMode(byteData){
	if(byteData >= 0x01 && byteData <= 0x20){
		return runningModel[0];
	}else if(byteData == 0x21){
		return runningModel[2];
	}else if(byteData == 0x22){
		return runningModel[3];
	}else if(bytedata == 0xFD){
		return runningModel[4];
	}else {
		return runningModel[5];
	}
}

var log = {};
log.info = function(str){
	log4js.getLogger("parse").info(str);
	console.log(str);
}

log.warn = function(str){
	log4js.getLogger("parse").warn(str);
	console.log(str);
}

log.err = function(str){
	log4js.getLogger("parse").error(str);
}

function  BufferPrintfHex(data){
	var str = new Buffer(data).toString('HEX');
	var len= str.length;
	var tmp ='';
	for(var iix=0;iix<len;iix++)
	{
		tmp = tmp + str.substring(2*iix,2*iix+2) + ' ';
	}
	return tmp;
}



/*把10进制数转换成16进制的字符串,len 为字节长度*/
function valueToHEX(strVal,len)
{
	var val = parseInt(strVal);
	if(val<0){
		val=0;
	}
	var tmp = val.toString(16);
	if(tmp.length>2*len){
		tmp = tmp.substring(tmp.length-2*len);
	}

	while(tmp.length<2*len){
		tmp = '0' + tmp;
	}
	return tmp;
}

module.exports.valueToHEX = valueToHEX;


function BufferPrintfHex(data)
{
	var str = new Buffer(data).toString('HEX');
	var len= str.length;
	var tmp ='';
	for(var iix=0;iix<len;iix++)
	{
		tmp = tmp + str.substring(2*iix,2*iix+2) + ' ';
	}
	return tmp;
}

String.prototype.Reverse = function(){
	return this.split('').reverse().join('');
}

Date.prototype.Format = function (fmt) {
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


function readUint64BE(data){
	var result = '';
	var buf = data.slice(0,8);
	return parseInt(buf.toString("hex"),16);
}

function NumberToString(value,len)
{
	var tmp = value.toString();
	while(tmp.length<len){
		tmp = '0' + tmp;
	}
	return tmp;
}

module.exports.readUint64BE = readUint64BE;
module.exports.BufferPrintfHex = BufferPrintfHex;
module.exports.String = String;
module.exports.Date = Date;
module.exports.log = log;
module.exports.parseRunningMode = parseRunningMode;
module.exports.parseCrossStatus = parseCrossStatus;
module.exports.parseDayOfWeek = parseDayOfWeek;
module.exports.parseDayOfMonth = parseDayOfMonth;
module.exports.parseMonth = parseMonth;
module.exports.parseMsgType = parseMsgType;
module.exports.parseIndexSubObj = parseIndexSubObj;
module.exports.CRC = crc;
module.exports.BufferPrintfHex = BufferPrintfHex;
module.exports.NumberToString =NumberToString;
module.exports.toolPing = toolPing;
