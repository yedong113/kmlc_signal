var net = require('net');
var sqlite3 = require('sqlite3');
var frameObject = require('../object/frameObject.js');


function simulationSerever() {
    var _this=this;
//    _this.initSqliteDatabase();
    var db = new sqlite3.Database('./1.db');
    _this.createSignalLightTables(db);
    db.each("SELECT rowid AS id, name FROM test", function(err, row) {
        console.log(row.id + ": " + row.name);
    });
    _this.createTcpServer();
}


simulationSerever.prototype.createTcpServer = function () {
    var _this = this;
    var HOST = '0.0.0.0';
    var PORT = 6969;
    _this.server = net.createServer();
    _this.server.listen(PORT, HOST);
    _this.server.on('connection',function (sock) {
        console.log('CONNECTED: ' +
            sock.remoteAddress + ':' + sock.remotePort);

        // 为这个socket实例添加一个"data"事件处理函数
        sock.on('data', function(data) {
            console.log('DATA ' + sock.remoteAddress + ': ' + data);
            // 回发该数据，客户端将收到来自服务端的数据
            var frameObject2 = new frameObject();
            frameObject2.parseObject(data);
            console.log(frameObject2.dataContent);
            sock.write('Recv Data ');
        });

        // 为这个socket实例添加一个"close"事件处理函数
        sock.on('close', function(data) {
            console.log('CLOSED: ' +
                sock.remoteAddress + ' ' + sock.remotePort);
        });
    });
} 



simulationSerever.prototype.initSqliteDatabase = function () {
    var db = new sqlite3.Database('./1.db',function() {
        db.run("create table test(name varchar(15))",function(){
            db.run("insert into test values('hello,world1')",function(){
                db.all("select * from test",function(err,res){
                    if(!err)
                        console.log(JSON.stringify(res));
                    else
                        console.log(err);
                });
            })
        });
    });
}


simulationSerever.prototype.createSignalLightTables = function (db) {
    db.run('create table lightSignalGroup (Id int,Corner int,Lane int)',function (err) {
        console.log(err);
    });
    var sqlCommand='create table phaseInfo (Id int,lightSignalBitmap int,Green int,GreenFlash int,Red int,WalkLight int,WalkFlash int,Delta int,MinGreen int,MaxGreen)';
    db.run(sqlCommand,function (err) {
        console.log(err);
    });
    sqlCommand='create table PhaseSequence (Id int,PhaseId int)';
    db.run(sqlCommand,function (err) {
        console.log(err);
    });

    sqlCommand='create table scheme (Id int,PhaseSequence int,PhaseDifference int)';
    db.run(sqlCommand,function (err) {
        console.log(err);
    });
    //
    sqlCommand='create table periodTime (Id int,StartHour int,StartMinute int,WorkModule int ,SchemeId int)';
    db.run(sqlCommand,function (err) {
        console.log(err);
    });
    sqlCommand = 'create table schedule (Id int,)';
}
var option={
    Id:1,
    StartHour:0,
    StartMinute:0,
    WorkModule:1,
    SchemeId:1
};
var simServer = new simulationSerever();