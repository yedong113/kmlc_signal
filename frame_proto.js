var net =  require('net');
var colors = require( "colors");
var frameObject = require('./object/frameObject.js');


function frame_proto(option) {
    var _this = this;

    this.option=option;
    this.clientSocket = net.connect(this.option.port, this.option.ip, function() {
        _this.deviceStatus = true;
        console.log('connected to server!!!', _this.option.ip, _this.option.port);
    });

    this.clientSocket.setKeepAlive(true, 5000);


    this.clientSocket.on('data', function(data) {
        var optCode = data[5];
        var strData = data.toString("hex");
        //if(optCode!=0xe1)
        {
            console.log("\x1b[32mrecv [%s:%s]<<< %s optCode=0x%s\x1b[0m", _this.option.ip, _this.option.port, strData,optCode.toString(16));
        }
        _this.parseObject(data);
    });

    this.clientSocket.on('end', function() {
        _this.deviceStatus = false;
        console.log('disconnected from server');
    });

    this.clientSocket.on("close", function() {
        _this.deviceStatus = false;
        clearTimeout(_this.reconnectTimer);
        _this.reconnectTimer = setTimeout(_this.reconnect, 1000 * 10);
        console.log("call the function: event_closed()!!");
    });

    this.clientSocket.on('timeout', function() {
        _this.deviceStatus = false;
        console.log('time out');
    });

    this.clientSocket.on('connect', function() {
        clearTimeout(_this.reconnectTimer);
        _this.deviceStatus = true;
        delete _this.recDataBuffer;
        _this.recDataBuffer = new Buffer([]);
        console.log('connected to server###', _this.option.ip, _this.option.port, _this.clientSocket.localPort);
        console.log('connect');
        
        setInterval(function(){
            _this.keepAlive();
        },10000);
    });

    this.clientSocket.on("error", function(data) {
        clearTimeout(_this.reconnectTimer);
        _this.deviceStatus = false;
        console.log(" ----- error------:" + data);
    });


    this.reconnect = function() {
        console.log("reconnect[%s %s]", _this.option.ip, _this.option.port);
        if (_this.deviceStatus) {
            _this.keepAlive();
        } else {
            _this.clientSocket.connect(_this.option.port, _this.option.ip);
        }
    };
}
frame_proto.prototype.keepAlive = function () {
    
}

frame_proto.prototype.parseObject = function (dataBuf) {
    var _this = this;
    var frameObject2 = new frameObject();
    frameObject2.parseObject(dataBuf);
    console.log(frameObject2.dataContent);
    var log=JSON.stringify(frameObject2);
    console.log(log.yellow);
    console.log(log.red);
}


module.exports = frame_proto;

