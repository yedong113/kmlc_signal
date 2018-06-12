/****************************************************
notes:
1、kafka 初始化失败或者断线以后怎么处理
2、没有获取到设备列表时和处理。
*****************************************************/
var db = require('./dbinterface.js')
var config = require('./config.js')
var thenjs = require('thenjs')
var kmlc_light = require('./kmlc_proto.js')
var URL = require('url')
var protobuf = require('node-protobuf');
var fs = require('fs');
var kafkaProducer = require("./kafkaStatusReport.js");

function kmlc_server(option_) {
    var _this = this;
    this.deviceList = [];
    this.deviceObject = [];
    this.deviceIdList=[];
    this.reportObject = new kafkaProducer();
    this.reportObject.init(); //
}


kmlc_server.prototype.start = function() {
    var _this = this;

    thenjs(function(cont) {
            _this.getDeviceInformationList(function() {
                cont(null, null);
            });
        })
        .then(function(cont, result) {
            _this.connectDevice();
            cont(null, null);
        })
        .fin(function(cont, err, result) {
            if (err) {
                console.log(err);
            }
        })
}


/*********************************************************/
kmlc_server.prototype.connectDevice = function() {
    console.log('***********call the function connectDevice()************');
    var _this = this;
    console.log(this.deviceList);
    for (var iix = 0; iix < this.deviceList.length; iix++) {
        var tmp = this.deviceList[iix];
        var url = this.deviceList[iix].url;
        var deviceId = this.deviceList[iix].deviceId;
        var urlbody = URL.parse(url);
        if (urlbody.protocol == 'kmlc:' || urlbody.protocol == 'KMLC:') {
            tmp.DObject = new kmlc_light({
                port: urlbody.port,
                ip: urlbody.hostname,
                deviceId: deviceId,
                reportObject:_this.reportObject,
                partitionId:_this.deviceIdList.indexOf(deviceId),
                callback: function(res) {
                }
            });
            this.deviceObject.push(tmp);
        }
    }
}

/*对相应的信号灯配置参数  单个配置*/
kmlc_server.prototype.add_task_paramer = function(data, callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_paramer function--------');
    console.log('data:', JSON.stringify(data));
    var devContain = false;
    for (var iix = 0; iix < this.deviceObject.length; iix++) {
        if (data.Id == this.deviceObject[iix].deviceId) {
            console.log('ID:', data.Id);
            devContain = true;
            if (this.deviceObject[iix].DObject) {

                this.deviceObject[iix].DObject.configParameterV1(data, function(res) {
                    callback(res);
                });
            }
        }
    }

    if (!devContain) {
        callback({errCode:1,Id:data.Id,info:'设备编号不存在'});
    }
}


/*对相应的信号灯配置参数  批量配置*/
kmlc_server.prototype.add_task_paramer_batch = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_paramer_batch function--------');
    var _this = this;

    add_task_paramer_batch_async = function (deviceObject,data,cb) {
        var devContain = false;

        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.configParameterV1(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        add_task_paramer_batch_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}






/*对相应的信号灯改变配置模式 单个设备改变*/
kmlc_server.prototype.add_task_contrl = function(data, callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var devContain = false;
    for (var iix = 0; iix < this.deviceObject.length; iix++) {
        if (data.Id == this.deviceObject[iix].deviceId) {
            console.log('ID:', data.Id);
            devContain = true;
            if (this.deviceObject[iix].DObject) {
                this.deviceObject[iix].DObject.changeContrlModuleV1(data, function(res) {
                    callback(res);
                });
            }
        }
    }
    if (!devContain) {
        callback({errCode:1,Id:data.Id,info:'设备编号不存在'});
    }
}




/*对相应的信号灯改变配置模式 批量设备改变*/
kmlc_server.prototype.add_task_contrl_batch = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var _this = this;

    add_task_contrl_async = function (deviceObject,data,cb) {
        var devContain = false;

        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.changeContrlModuleV1(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            callback({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        add_task_contrl_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}

kmlc_server.prototype.query_task_paramer = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the query_task_paramer function--------');
    var devContain = false;
    for (var iix = 0; iix < this.deviceObject.length; iix++) {
        if (data.Id == this.deviceObject[iix].deviceId) {
            devContain = true;
            if (this.deviceObject[iix].DObject) {
                this.deviceObject[iix].DObject.queryParamer(data, function(res) {
                    callback(res);
                });
            }
        }
    }
    if (!devContain) {
        callback({errCode:1,Id:data.Id,info:'设备编号不存在'});
    }
}

kmlc_server.prototype.query_task_paramer_batch = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var _this = this;

    query_task_paramer_async = function (deviceObject,data,cb) {
        var devContain = false;
        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.queryParamer(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        query_task_paramer_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}




//green_wave_band_paramer

kmlc_server.prototype.special_task_paramer = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var _this = this;

    special_task_paramer_async = function (deviceObject,data,cb) {
        var devContain = false;

        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.configSpecialParameter(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        special_task_paramer_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}

kmlc_server.prototype.special_start_paramer = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var _this = this;

    special_start_paramer_async = function (deviceObject,data,cb) {
        var devContain = false;

        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.startSpecialParameter(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        special_start_paramer_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}

kmlc_server.prototype.special_stop_paramer = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the add_task_contrl function--------');
    var _this = this;

    special_start_paramer_async = function (deviceObject,data,cb) {
        var devContain = false;

        for (var iix = 0; iix < deviceObject.length; iix++) {
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {

                    deviceObject[iix].DObject.stopSpecialParameter(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        special_start_paramer_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}


kmlc_server.prototype.green_wave_band_paramer = function (data,callback) {
    /*数据从此处进行分发，分发到相应的设备对象中去*/
    console.log('-----call the green_wave_band_paramer function--------');
    var _this = this;

    green_wave_band_paramer_async = function (deviceObject,data,cb) {
        var devContain = false;
        for (var iix = 0; iix < deviceObject.length; iix++) {
            console.log('ID:', data.Id);
            if (data.Id == deviceObject[iix].deviceId) {
                devContain = true;
                if (deviceObject[iix].DObject) {
                    deviceObject[iix].DObject.configGreenWaveBandParamer(data, function(res) {
                        cb(res);
                    });
                }
            }
        }
        if (!devContain) {
            cb({errCode:1,Id:data.Id,info:'设备编号不存在'});
        }
    }

    thenjs.each(data.Signals,function (cont,signalData) {
        green_wave_band_paramer_async(_this.deviceObject,signalData,function (err) {
            cont(null,err);
        });
    }).then(function (cont,res) {
        console.log(res);
        console.log('call end');
        callback(res);
    });
    return;
}




kmlc_server.prototype.getDeviceInformationListLocal = function (cb) {
    var _this = this;

    {
        var tmp = {};
        tmp.url = 'kmlc://192.168.12.201:6666';
        tmp.deviceId = 5303260169;
        tmp.deviceType = 211;
        _this.deviceIdList.push(tmp.deviceId);
        _this.deviceList.push(tmp);
    }
    {
        var tmp = {};
        tmp.url = 'kmlc://53.15.72.29:6666';
        tmp.deviceId = 5303260168;
        tmp.deviceType = 211;
        //_this.deviceList.push(tmp);
    }
    cb();
    //cb(_this.deviceList);
}

kmlc_server.prototype.getDeviceInformationList = function(callback) {
    var _this = this;
//    var sql = 'SELECT * from tb_device where DeviceId=5326212709';
    var sql = 'SELECT * from tb_device where TypeValue=211';
    var dbObj = new db({
        host: config.mysql.host,
        user: config.mysql.user,
        pwd: config.mysql.pwd,
        database: config.mysql.database
    });
    dbObj.open(function(err) {
        if (err) {
            console.log(err);
        } else {
            dbObj.select(sql, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    for (var iix = 0; iix < data.length; iix++) {
                        var tmp = {};
                        tmp.url = data[iix].Url;
                        tmp.deviceId = data[iix].DeviceId;
                        _this.deviceIdList.push(tmp.deviceId);
                        tmp.deviceType = data[iix].TypeValue;
                        console.log(tmp);
                        _this.deviceList.push(tmp);
                    }
                    _this.deviceIdList.sort();
                    callback();
                }
            });
        }
    });
}

module.exports = kmlc_server;