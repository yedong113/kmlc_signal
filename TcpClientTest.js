var net = require('net');


function TcpClientTest(options_) {

    var _this = this;
    _this.recDataBuffer = new Buffer([]);
    _this.clientSocket = new net.Socket();
    _this.deviceStatus=false;


    _this.clientSocket.on('data', function(data) {
        var optCode = data[5];
        var strData = data.toString("hex");
        if(optCode!=0xe1 && optCode!=0xe4 &&optCode!=0xe5)
        {
            console.log("\x1b[32mrecv [%s:%s]<<< %s optCode=0x%s\x1b[0m", _this.option.ip, _this.option.port, strData,optCode.toString(16));
        }
        _this.recDataBuffer = Buffer.concat([_this.recDataBuffer, data]);
        //console.log(_this.recDataBuffer);
        //_this.parseFrame();
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
    });


}

var option = {ip:'192.168.12.201',port:6666,}

