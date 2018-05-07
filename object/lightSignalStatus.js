var toolFunc = require('../commonTools.js');
var utils = require("util");
var dataBase = require('./dataBase.js');



function lightSignalStatus() {
    var _this=this;
    _this.lightSignalStatusList=[];
}


lightSignalStatus.prototype.parseObject = function (data) {
    var _this=this;
    var index=0;
    for (var ii=0;ii<8;ii++){
        var light=data[ii];
        for (var i=0;i<4;i++){
            var flag = 0b11<<(i*2);
            var status = (light&flag)>>(i*2);
            console.log(flag.toString(2));
            _this.lightSignalStatusList.push(status);
        }
    }
    index+=8;
    index+=1;
    _this.StepNow = data[index++];
    index++;
    _this.StepSurplusTime=data[index++];
}




