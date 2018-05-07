var paraData = require('./paramData.js');

kmlcChannelConfigs = [
    {phaseId:1	,channelId:7	,cornerId:1,laneType:1,name:'北-左'},
    {phaseId:2	,channelId:1	,cornerId:1,laneType:2,name:'北-直'},
    {phaseId:3	,channelId:13	,cornerId:1,laneType:3,name:'北-右'},
    {phaseId:4	,channelId:3	,cornerId:1,laneType:4,name:'北-人'},
    {phaseId:5	,channelId:8	,cornerId:3,laneType:1,name:'东-左'},
    {phaseId:6	,channelId:2	,cornerId:3,laneType:2,name:'东-直'},
    {phaseId:7	,channelId:14	,cornerId:3,laneType:3,name:'东-右'},
    {phaseId:8	,channelId:6	,cornerId:3,laneType:4,name:'东-人'},
    {phaseId:9	,channelId:10	,cornerId:5,laneType:1,name:'南-左'},
    {phaseId:10 ,channelId:4	,cornerId:5,laneType:2,name:'南-直'},
    {phaseId:11 ,channelId:16	,cornerId:5,laneType:3,name:'南-右'},
    {phaseId:12 ,channelId:9	,cornerId:5,laneType:4,name:'南-人'},
    {phaseId:13 ,channelId:11	,cornerId:7,laneType:1,name:'西-左'},
    {phaseId:14 ,channelId:5	,cornerId:7,laneType:2,name:'西-直'},
    {phaseId:15 ,channelId:17	,cornerId:7,laneType:3,name:'西-右'},
    {phaseId:16 ,channelId:12	,cornerId:7,laneType:4,name:'西-人'}
];

module.exports = kmlcChannelConfigs;
function getkmlcChannelCfg(cornerId,lanType,callback) {
    for (var i=0;i<kmlcChannelConfigs.length;i++){
        if (cornerId==kmlcChannelConfigs[i].cornerId&&lanType==kmlcChannelConfigs[i].laneType){
            callback(kmlcChannelConfigs[i]);
        }
    }
    callback(null);
}


function configParameterV1(data, cb) {
    var _this = this;
    this.setCb = cb;
    var DeviceId = data.Id;
    console.log('*************V1 is********************');
    //   console.log(JSON.stringify(data));
    var ScheduleTable = []; /*时基表*/
    var PeriodTable = []; /*时段表*/
    var SchemeTable = []; /*方案表*/
    var StageTable = []; /*阶段表*/
    var PhaseTable = []; /*相位表*/
    var PeriodTimeTable = [];
    var ChannelTable = [];
    PhaseTable = data.PhaseTable;
    ChannelTable = data.ChannelTable;
    SchemeTable = data.SchemeTable;
    PeriodTimeTable = data.PeriodTimeTable;
    ScheduleTable = data.ScheduleTable;
    var kmlcchannelcfgs=[];
    for(var i=0;i<PhaseTable.length;i++){
        PhaseTable[i].ConflictPhase=0;
        getkmlcChannelCfg(PhaseTable[i].Cornor,PhaseTable[i].LaneType,function (res) {
            if(res){
                PhaseTable[i].Channel = res.channelId;
                PhaseTable[i].kmlcPhaseId = res.phaseId;
                PhaseTable[i].name = res.name;
            }
        });
    }
    //console.log(PhaseTable);

    for(var i=0;i<SchemeTable.length;i++){
        SchemeTable[i].schemeId =  SchemeTable[i].StageTabelId;
        SchemeTable[i].Cycle = SchemeTable[i].RecycleTime;
        SchemeTable[i].Offset = SchemeTable[i].Offset;
        SchemeTable[i].Coordphase = SchemeTable[i].Coordphase
        SchemeTable[i].stageTableId =SchemeTable[i].StageTabelId;
    }

    //console.log('阶段表:'+ScheduleTable);
    console.log(PeriodTimeTable);
    //console.log('方案表'+SchemeTable);

    SettingStageTableV1(SchemeTable,PhaseTable);
}





function getkmlcPhaseId(phaseId,phaseTables,callback) {
    var lcPhaseId=0;
    var name;
    for(var i=0;i<phaseTables.length;i++){
        if(phaseTables[i].PhaseId==phaseId){
            lcPhaseId=phaseTables[i].kmlcPhaseId;
            name=phaseTables[i].name;
            break;
        }
    }
    if(lcPhaseId!=0){
        callback(lcPhaseId,name);
    }
}



function genkmlcPhaseBitmap(phaseBitmap,phaseTables,callback) {
    var bitmapstrings = (phaseBitmap>>1).toString(2);
    //console.log('srs:',phaseBitmap.toString(2));
    console.log('dst:',bitmapstrings);
    var arrPhaseId=[];
    for (var i=bitmapstrings.length-1,j=1;i>=0,j<=16;i--,j++){
        if(bitmapstrings[i]=='1'){
            getkmlcPhaseId(j,phaseTables,function (lcphaseid,name) {
                arrPhaseId.push({srcId:j,kmlcPhaseId:lcphaseid,name:name});
            });

        }
    }
    var desBitmap=0;
    for(var i=0;i<arrPhaseId.length;i++){
        desBitmap|=(1<<(arrPhaseId[i].kmlcPhaseId-1));
    }
    console.log(arrPhaseId,desBitmap.toString(2));
    callback(desBitmap);
}



function SettingStageTableV1(data,phaseTables){
    //console.log('配置阶段表:', JSON.stringify(data));
    var result = '';
    var m = data.length;
    var n = 0;
    var counter = 0;
    for (var iix = 0; iix < data.length; iix++) {
        var stageTableId = data[iix].StageTabelId;
        for (var iiy = 0; iiy < data[iix].StageData.length; iiy++) {
            var tmp = {};
            tmp.stageTableId = stageTableId;
            tmp.stageId = data[iix].StageData[iiy].StageId;
            tmp.PhaseBitmap = data[iix].StageData[iiy].PhaseBitmap;
            tmp.Green = data[iix].StageData[iiy].Green;
            tmp.GreenFlash = data[iix].StageData[iiy].GreenFlash;
            tmp.Yellow = data[iix].StageData[iiy].Yellow;
            tmp.Red = data[iix].StageData[iiy].Red;
            tmp.WalkLight = data[iix].StageData[iiy].WalkLight;
            tmp.WalkFlash = data[iix].StageData[iiy].WalkFlash;
            tmp.Delta = data[iix].StageData[iiy].Delta;
            tmp.MinGreen = data[iix].StageData[iiy].MinGreen;
            tmp.MaxGreen = data[iix].StageData[iiy].MaxGreen;
            counter = counter + 1;
            //console.log(tmp.PhaseBitmap.toString(2));
            genkmlcPhaseBitmap(tmp.PhaseBitmap,phaseTables,function (res) {
                tmp.lcPhaseBitmap = res;
            });
        }
    }

    if (counter == 0) {
        console.log('-------------no stage table!!!-------------');
        return;
    }

    if (counter % m == 0) {
        n = counter / m;
    } else {
        n = parseInt(counter / m) + 1;
    }
    console.log('m:', m);
    console.log('n:', n);
    console.log('counter:', counter);
    console.log('n*m:', m * n);
    while (n * m - counter) {
        result = result + '00000000000000000000000000000000';
        counter++;

    }
}

