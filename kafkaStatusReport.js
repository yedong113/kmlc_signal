
/**信号机状态上报的接口 by kafka*/


/****************************************************
notes:
1、kafka 初始化失败或者断线以后怎么处理
2、没有获取到设备列表时和处理。
*****************************************************/
var node_rdkafka = require('node-rdkafka');
//var protobuf = require('node-protobuf');
var kafka_config = require("./config.js");
var signal2Partitions = require('./config/signal2Partitions.js')
var fs = require('fs');

var os = require('os');




/** */
// var testData= require("./reportData.js");

/**/
//var pb = new protobuf(fs.readFileSync("./protobuf/ITSCRealData.desc"));


function kafkaReportStatusSignal(options_)
{
    this.options = options_;
    this.constCounter = 0 ;// 300s => 5min
}

/// 初始连接kafka.
kafkaReportStatusSignal.prototype.init = function()
{
    var _this = this;
    this.recTimer = setInterval(function(){
        _this.constCounter = _this.constCounter + 1;
        if(_this.constCounter >= 540){
            _this.constCounter =0;
            _this.connectKafka();
        }
    },1000);

    _this.connectKafka();
}

kafkaReportStatusSignal.prototype.connectKafka = function()
{
    var _this = this;
    this.kafkaIsReady = false;
    if(this.producer){
        delete this.producer;
        this.constCounter = 0;
        this.producer = null;
    }

    this.producer = new node_rdkafka.Producer({
        'client.id': 'kafka_WEITING',
        'metadata.broker.list': kafka_config.reportPara.kafkaHost,
        'retry.backoff.ms': 200,
        'message.send.max.retries': 1,
        'socket.keepalive.enable': true,
        'queue.buffering.max.messages': 2048040,
        'queue.buffering.max.ms': 100,
        'batch.num.messages': 1,
        //  'fetch.message.max.bytes':4194304,
        'message.max.bytes':4194304,
        'dr_cb': true
    });

    this.producer.connect({}, function(err) {
        if (err) {
            _this.kafkaIsReady = false;
            // readyToSentMsg();
        }
    })
    .on('error', function(e) {
        console.log('err->>' + e );
        //_this.kafkaIsReady = false;
    })
    .on('ready', function() {
        console.log("kafka is ready!");
        _this.kafkaIsReady = true;
    })
    .on('disconnected', function() {
        //_this.kafkaIsReady = false;
        console.log("kafka is disconnected!!");
    });

    console.log("kafka init!!");
}

/// 提交信号机状态的 api 
kafkaReportStatusSignal.prototype.uploadSignalStatus= function(subObj,callback)
{
    this.constCounter = 0;
    this.readySentData(kafka_config.reportPara.topic, subObj, callback);
}

///提交实时交通流统计信息  ITSCRealTrafficFlow
kafkaReportStatusSignal.prototype.uploadRealTrafficFlow = function(subObj,callback){
    this.constCounter = 0;
    this.readySentData(kafka_config.reportPara.RealTrafficFlowTopic, subObj, callback);
}


///提交实时车道排队长度信息  ITSCRealLaneQueue
kafkaReportStatusSignal.prototype.uploadRealLaneQueue = function(subObj,callback){
    this.constCounter = 0;
    this.readySentData(kafka_config.reportPara.RealLaneQueueTopic, subObj, callback);
}



kafkaReportStatusSignal.prototype.readySentData = function(topic, subObj, callback)
{
    if(!this.kafkaIsReady)  {
        console.log(" kafka not ready!!");
        return;
    }
    this.sent(topic, subObj,callback);
}

kafkaReportStatusSignal.prototype.sent = function(topic, moudle, callback) 
{
    var key='key_'+moudle.Id;
    var partition =signal2Partitions[key];
    //var partition = moudle.partitionId

    var serialize_buffer = JSON.stringify(moudle);


    if (os.platform()=='win32'){
        partition=0;
        try{
            this.producer.produce(topic,partition,new Buffer(serialize_buffer),key,Date.now());
            callback(null);
        }
        catch(err){
            callback(err);
        }
    }
    else {
        this.producer.sendMessage({topic:topic, partition:partition, message:serialize_buffer},function(err){
            if(!err){
                callback(null);
            }
            else{
                callback('Message produced error!');
            }
        });
    }
/*
    this.producer.produce(topic,partition,serialize_buffer,function(err){
        moudle = undefined;
        if(!err){
            callback(null);
        }
        else{
            callback('Message produced error!');
        }
    });

    */
}

module.exports = kafkaReportStatusSignal;


// var kafka = new kafkaReportStatusSignal();
// kafka.init();
// setInterval(function(){
//     console.log(1111);
//     if(kafka.kafkaIsReady){
//         console.log("send data start...")
//         kafka.uploadSignalStatus(testData,function(err){
//             if(err)
//                 console.log("send kafka return data:",err);
//         });
//     }
// },1000)