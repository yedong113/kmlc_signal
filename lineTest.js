
var deviceList = ['5303260173','5303260174'];






Date.prototype.Format = function(fmt)
{ //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}



var ITSCRealTrafficFlow={
    Id: "5303260173",
    UpTime: "2018-02-02 10:43:45",
    RealTrafficFlow: [{
    Corner: 1,
    LaneCount: 3,
    DetectorId: 1,
    SamplingPeriod: 5,
    Time: "2018-02-02 10:43:45",
    LaneFlow: [{
        LaneId: 1,
        Speed: 15,
        Type: 4,
        SmallCar: 3,
        MediumSizeCar: 1,
        FullSizeCar: 0,
        HeadwayTime: 1,
        HeadwaySpace: 1,
        SpaceOccupancy: 341,
        TimeOccupancy: 341
        },
        {
            LaneId: 2,
            Speed: 15,
            Type: 2,
            SmallCar: 10,
            MediumSizeCar: 1,
            FullSizeCar: 0,
            HeadwayTime: 1,
            HeadwaySpace: 1,
            SpaceOccupancy: 381,
            TimeOccupancy: 341
        },
        {
            LaneId: 3,
            Speed: 15,
            Type: 1,
            SmallCar: 5,
            MediumSizeCar: 0,
            FullSizeCar: 2,
            HeadwayTime: 1,
            HeadwaySpace: 1,
            SpaceOccupancy: 401,
            TimeOccupancy: 341
        }]
},
    {
        Corner: 2,
        LaneCount: 3,
        DetectorId: 1,
        SamplingPeriod: 5,
        Time: "2018-02-02 10:43:45",
        LaneFlow: [{
            LaneId: 4,
            Speed: 15,
            Type: 4,
            SmallCar: 3,
            MediumSizeCar: 1,
            FullSizeCar: 0,
            HeadwayTime: 1,
            HeadwaySpace: 1,
            SpaceOccupancy: 341,
            TimeOccupancy: 341
            },
            {
                LaneId: 5,
                Speed: 15,
                Type: 2,
                SmallCar: 10,
                MediumSizeCar: 1,
                FullSizeCar: 0,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 381,
                TimeOccupancy: 341
            },
            {
                LaneId: 6,
                Speed: 15,
                Type: 1,
                SmallCar: 5,
                MediumSizeCar: 0,
                FullSizeCar: 2,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 401,
                TimeOccupancy: 341
            }]
    },
    {
        Corner: 5,
        LaneCount: 3,
        DetectorId: 1,
        SamplingPeriod: 5,
        Time: "2018-02-02 10:43:45",
        LaneFlow: [{
            LaneId: 7,
            Speed: 15,
            Type: 4,
            SmallCar: 3,
            MediumSizeCar: 1,
            FullSizeCar: 0,
            HeadwayTime: 1,
            HeadwaySpace: 1,
            SpaceOccupancy: 341,
            TimeOccupancy: 341
             },
            {
                LaneId: 8,
                Speed: 15,
                Type: 2,
                SmallCar: 10,
                MediumSizeCar: 1,
                FullSizeCar: 0,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 381,
                TimeOccupancy: 341
            },
            {
                LaneId: 9,
                Speed: 15,
                Type: 1,
                SmallCar: 5,
                MediumSizeCar: 0,
                FullSizeCar: 2,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 401,
                TimeOccupancy: 341
            }]
    },
    {
        Corner: 7,
        LaneCount: 3,
        DetectorId: 1,
        SamplingPeriod: 5,
        Time: "2018-02-02 10:43:45",
        LaneFlow: [{
            LaneId: 10,
            Speed: 15,
            Type: 4,
            SmallCar: 3,
            MediumSizeCar: 1,
            FullSizeCar: 0,
            HeadwayTime: 1,
            HeadwaySpace: 1,
            SpaceOccupancy: 341,
            TimeOccupancy: 341
            },
            {
                LaneId: 11,
                Speed: 15,
                Type: 2,
                SmallCar: 10,
                MediumSizeCar: 1,
                FullSizeCar: 0,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 381,
                TimeOccupancy: 341
            },
            {
                LaneId: 12,
                Speed: 15,
                Type: 1,
                SmallCar: 5,
                MediumSizeCar: 0,
                FullSizeCar: 2,
                HeadwayTime: 1,
                HeadwaySpace: 1,
                SpaceOccupancy: 401,
                TimeOccupancy: 341
            }]
    }]
};


var ITSCRealLaneQueue={
    Id: "5303260173",
    UpTime: "2018-02-02 10:43:45",
    RealLaneQueue: [{
        Corner: 1,
        Time: "2018-02-02 10:43:45",
        RealLaneQueueItem: [{
            LaneId: 1,
            Type: 4,
            Length: 10
            },
            {
                LaneId: 2,
                Type: 2,
                Length: 30
            },
            {
                LaneId: 3,
                Type: 4,
                Length: 10
            }]
    },
        {
            Corner: 3,
            Time: "2018-02-02 10:43:45",
            RealLaneQueueItem: [{
                LaneId: 4,
                Type: 4,
                Length: 10
                },
                {
                    LaneId: 5,
                    Type: 2,
                    Length: 30
                },
                {
                    LaneId: 6,
                    Type: 4,
                    Length: 10
                }]
        },
        {
            Corner: 5,
            Time: "2018-02-02 10:43:45",
            RealLaneQueueItem: [{
                LaneId: 7,
                Type: 4,
                Length: 10
                },
                {
                    LaneId: 8,
                    Type: 2,
                    Length: 30
                },
                {
                    LaneId: 9,
                    Type: 4,
                    Length: 10
                }]
        },
        {
            Corner: 7,
            Time: "2018-02-02 10:43:45",
            RealLaneQueueItem: [{
                LaneId: 10,
                Type: 4,
                Length: 10
                },
                {
                    LaneId: 11,
                    Type: 2,
                    Length: 30
                },
                {
                    LaneId: 12,
                    Type: 4,
                    Length: 10
                }]
        }]
};



module.exports.ITSCRealTrafficFlow = ITSCRealTrafficFlow;
module.exports.ITSCRealLaneQueue = ITSCRealLaneQueue;
module.exports.deviceList = deviceList;