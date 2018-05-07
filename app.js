var express = require('express');
var thenjs =require("thenjs")
var app = express();
var http=require('http');
var fs = require('fs');
var os = require('os');
var bodyParser = require('body-parser');

var toolFunc = require('./commonTools.js');
app.use(bodyParser.json({limit:"8mb"}));
app.use(bodyParser.urlencoded({limit:"8mb",extended: false}));

app.use(bodyParser.json());
app.post('/light/paramer',function(req,res){
    var data={};
    data = req.body;
    console.log(data);
    res.send({result:"success"});

});



var arrDeviceList = [5326000002,5326000003,5326212709,5326212710,5326212711,5326212758,5326212757,5326212759]
console.log(arrDeviceList)
arrDeviceList.sort()
console.log(arrDeviceList)
var index=arrDeviceList.indexOf(5326212709)

console.log(index)

var name='北京路';
var buffer = new Buffer(name,"utf-8");

console.log(buffer);

console.log(buffer.toString('hex'));

console.log(buffer.toString("utf-8"));



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

var data=[
    {
        Corner:1,
        Name:'北京路东'
    },
    {
        Corner:3,
        Name:'北京路西'
    },
    {
        Corner:5,
        Name:'龙泉南'
    },
    {
        Corner:7,
        Name:'龙泉北'
    }
]

StartSettingParammer();

var res = SettingConnerTable(data);

console.log(res.toString('hex'));



function
StartSettingParammer() {
    var tmp = '2181DC00';
    res = makeFrame(tmp);
    var getBuffer = new Buffer(res, 'hex');
    console.log(getBuffer.toString('hex'));
}
function makeSureSetting(first_argument) {
    var data = '2181DD00';
    var result = makeFrame(data);
    var getBuffer = new Buffer(result, 'hex');
    console.log(getBuffer.toString('hex'));
}



makeSureSetting();


















var server = http.createServer(app);
server.listen(3000);
console.log('ports:',3000);