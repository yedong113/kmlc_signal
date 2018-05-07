var phaseInfo = require('./object/phase.js');
var schemeInfo = require('./object/scheme.js');
var periodTime = require('./object/periodTime.js');
var dataBase = require('./object/dataBase.js');


var data=new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72,0xD5,0xAE]);

var frameObject = require('./object/frameObject.js');

var light1=213;

var lightSignalStatusList=[];
console.log(light1.toString(2));


for (var ii=0;ii<8;ii++){
    var light=data[ii];
    for (var i=0;i<4;i++){
        var flag = 0b11<<(i*2)
        var status = (light&flag)>>(i*2);
        console.log(flag.toString(2));
        lightSignalStatusList.push(status);
    }
}

console.log(data);
//console.log(lightSignalStatusList);

/**
 * 1	联机
 2	交通流信息
 3	信号机工作状态
 4	灯色状态
 5	当前时间
 6	信号灯组
 7	相位
 8	信号配时方案
 9	调度计划表
 10	工作方式
 11	信号机故障
 12	信号机版本
 13	特征参数版本
 14	信号机识别码
 15	远程控制
 16	检测器
 17	上报项设置
 18	时段表
 * @type {{areaId: number, corner: number, OperType: number, ObjectIdent: number}}
 */
var option={areaId:0x01,corner:0x01,OperType:0x81,ObjectIdent:0x07};
var frameObject1 = new frameObject();
frameObject1.setFrameHead(option);
frameObject1.setObject({
    Id : 1,
    lampGroupBitmap:16811010,
    Green:0xC0,
    GreenFlash:3,
    Yellow:3,
    Red:3,
    WalkLight:10,
    WalkFlash:3,
    Delta:3,
    MinGreen:10,
    MaxGreen:60
});
frameObject1.setObject({
    Id : 2,
    lampGroupBitmap:16385,
    Green:0xC0,
    GreenFlash:3,
    Yellow:3,
    Red:3,
    WalkLight:10,
    WalkFlash:3,
    Delta:3,
    MinGreen:10,
    MaxGreen:60
});
console.log(frameObject1.dataContent);
var dataBuf = frameObject1.toBuffer();
console.log(dataBuf);

var frameObject2 = new frameObject();
frameObject2.parseObject(dataBuf);
console.log(frameObject2.dataContent);
/*
var frameObject1 = dataBaseFactory.createDataBaseModel('lightSignalGroup');
frameObject1.setObject({
    Id:1,
    Conner:1,
    Lane:2
});

frameObject1.setObject({
    Id:2,
    Conner:1,
    Lane:1
});

frameObject1.setObject({
    Id:3,
    Conner:1,
    Lane:4
});


frameObject1.setObject({
    Id:4,
    Conner:3,
    Lane:2
});

frameObject1.setObject({
    Id:5,
    Conner:3,
    Lane:1
});

frameObject1.setObject({
    Id:6,
    Conner:3,
    Lane:4
});

var frameObject1 = dataBaseFactory.createDataBaseModel('lightSignalGroup');
var buf = a.toBuffer();
frameObject1.parseObject(buf);
console.log(buf);
for(var i=0;i<a.lightSignalGroupList.length;i++){
    console.log(a.lightSignalGroupList[i].Id,
        a.lightSignalGroupList[i].Conner,
        a.lightSignalGroupList[i].Lane);
}
console.log(a1);

var frameObject1 = dataBaseFactory.createDataBaseModel('phase');
frameObject1.setObject({
    Id : 1,
    lightSignalBitmap:24582,
    Green:16,
    GreenFlash:3,
    Yellow:3,
    Red:0,
    WalkLight:15,
    WalkFlash:3,
    Delta:3,
    MinGreen:10,
    MaxGreen:60
});
frameObject1.setObject({
    Id : 2,
    lightSignalBitmap:0b11000,
    Green:16,
    GreenFlash:3,
    Yellow:3,
    Red:0,
    WalkLight:15,
    WalkFlash:3,
    Delta:3,
    MinGreen:10,
    MaxGreen:60
});


var buff1 = p1.toBuffer();

var p2 = dataBaseFactory.createDataBaseModel('phase');

p2.parseObject(buff1);
console.log(buff1);
console.log(p1);
console.log(p2);

//scheme
var scheme = dataBaseFactory.createDataBaseModel('scheme');
scheme.setObject({
    Id:1,
    PhaseSequence:[1,2,3,4],
    PhaseDifference:23
});
scheme.setObject({
    Id:2,
    PhaseSequence:[2,1,3,4],
    PhaseDifference:23
});
var scheme_buff = scheme.toBuffer();
var schemeInfo1 = dataBaseFactory.createDataBaseModel('scheme');
schemeInfo1.parseObject(scheme_buff);
console.log(scheme_buff);
console.log(scheme.schemeInfoList[1]);
console.log(schemeInfo1);



var periodTimeInfo = dataBaseFactory.createDataBaseModel('periodTime');
periodTimeInfo.setObject({
    Id:1,
    StartHour:0,
    StartMinute:0,
    WorkModule:1,
    SchemeId:1
});
periodTimeInfo.setObject({
    Id:1,
    StartHour:12,
    StartMinute:0,
    WorkModule:1,
    SchemeId:2
});
var periodTimeInfoBuff =  periodTimeInfo.toBuffer();
var periodTimeInfo1 = dataBaseFactory.createDataBaseModel('periodTime');
periodTimeInfo1.parseObject(periodTimeInfoBuff);
console.log(periodTimeInfoBuff);
console.log(periodTimeInfo);
console.log(periodTimeInfo1);


var schedule1 = dataBaseFactory.createDataBaseModel('schedule');
console.log(schedule1);
schedule1.setObject({
    weekInfo:{
        Mon:1,
        Tue:1,
        Wed:1,
        Thu:1,
        Fri:1,
        Sat:1,
        Sun:1
    },
    specialDayInfos:[
        {
            BeginMonth : 1,
            BeginDay:1,
            EndMonth : 1,
            EndDay:31,
            PeriodId:1,
            Retain : '00000000000000'
        },
        {
            BeginMonth : 2,
            BeginDay:1,
            EndMonth : 12,
            EndDay:31,
            PeriodId:1,
            Retain : '00000000000000'
        }
    ]
});

var dataBuf = schedule1.toBuffer();
console.log(schedule1);
console.log(dataBuf);


var schedule2 = dataBaseFactory.createDataBaseModel('schedule');
schedule2.parseObject(dataBuf);
console.log(schedule2);

*/