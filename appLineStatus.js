var realStatus = require('./lineTest');



var kafkaProducer = require("./kafkaStatusReport.js");

var ITSCRealTrafficFlow=realStatus.ITSCRealTrafficFlow;
var ITSCRealLaneQueue=realStatus.ITSCRealLaneQueue;
var deviceList=realStatus.deviceList;

var time1=new Date().Format("yyyy-MM-dd hh:mm:ss");
ITSCRealTrafficFlow.UpTime=time1;

for(var i=0;i<ITSCRealTrafficFlow.RealTrafficFlow.length;i++){
    ITSCRealTrafficFlow.RealTrafficFlow[i].Time=time1;
}



ITSCRealLaneQueue.UpTime=time1;

for(var i=0;i<ITSCRealLaneQueue.RealLaneQueue.length;i++){
    ITSCRealLaneQueue.RealLaneQueue[i].Time=time1;
}


function appLineStatus() {
    var _this=this;
    this.reportObject = new kafkaProducer();
    this.reportObject.init(); //
    console.log(deviceList);


    setInterval(function(){
        _this.uploadTrafficFlow();
    },10*1000);

    setInterval(function(){
        _this.uploadLineFlow();
    },10*1000);
}

appLineStatus.prototype.uploadTrafficFlow = function () {

    var _this=this;
    console.log('上传交通流');

    var time1=new Date().Format("yyyy-MM-dd hh:mm:ss");

    for (var j=0;j<deviceList.length;j++){
        ITSCRealTrafficFlow.Id=deviceList[j];
        ITSCRealTrafficFlow.UpTime=time1;

        for(var i=0;i<ITSCRealTrafficFlow.RealTrafficFlow.length;i++){
            ITSCRealTrafficFlow.RealTrafficFlow[i].Time=time1;
        }

        _this.reportObject.uploadRealTrafficFlow(ITSCRealTrafficFlow,function(err){
            if(err){
                console.log(err);
            }
        });
    }

}

appLineStatus.prototype.uploadLineFlow = function () {
    console.log('上传排队流');
    var _this=this;
    var time1=new Date().Format("yyyy-MM-dd hh:mm:ss");

    for (var j=0;j<deviceList.length;j++){
        ITSCRealLaneQueue.Id=deviceList[j];
        ITSCRealLaneQueue.UpTime=time1;
        for(var i=0;i<ITSCRealLaneQueue.RealLaneQueue.length;i++){
            ITSCRealLaneQueue.RealLaneQueue[i].Time=time1;
        }
        _this.reportObject.uploadRealLaneQueue(ITSCRealLaneQueue,function(err){
            if(err){
                console.log(err);
            }
        });
    }
}



var app = new appLineStatus();


