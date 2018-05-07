var express = require('express');
var thenjs =require("thenjs")
var app = express();
var http=require('http');
var fs = require('fs');
var os = require('os');
var bodyParser = require('body-parser');
var config = require('./config.js');
var kmlc_server = require('./kmlc_server.js');

var url = require('url');
var user_app  = new kmlc_server();
user_app.start();

app.use(bodyParser.json({limit:"8mb"}));
app.use(bodyParser.urlencoded({limit:"8mb",extended: false}));

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

var os_platform=os.platform();


/*
* 单台设置信号机
*
*/
app.post('/light/paramer',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.add_task_paramer(data,function(resData){
    console.log('add_task_paramer return data:',resData)
    res.header({"Access-Control-Allow-Origin":"*"});
    if(resData.errCode){
            res.send({result:"fail",msg:{errCode:'0x'+resData.errCode.toString(16),info:resData.info}});
        }
        else{
            //res.send({result:"success"});
            res.send({result:"success",msg:{errCode:'0x'+resData.errCode.toString(16),info:'设置信号机参数成功'}});
        }
    });
});


/**
 * 批量设置信号机
 */
app.post('/light/paramerBatch',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    console.log(JSON.stringify(data));
    user_app.add_task_paramer_batch(data,function(resData){
        console.log('add_task_paramer return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        console.log(resData);
        res.send({result:resData});
    });
});




app.post('/light/contrl',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.add_task_contrl(data,function(result){
        console.log('contrl:',result);
        res.header({"Access-Control-Allow-Origin":"*"});
        if(result.errCode){
            res.send({result:"fail",msg:{errCode:result.errCode,info:result.errorString }});
        }else{
            res.send({result:"success"});
        }
    });
});

app.post('/light/contrlBatch',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.add_task_contrl_batch(data,function(resData){
        console.log('add_task_contrl_batch return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});








app.post('/light/specialcar',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.special_task_paramer(data,function(resData){
        console.log('special_task_paramer return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});


app.post('/light/specialcarStart',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.special_start_paramer(data,function(resData){
        console.log('special_start_paramer return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});


app.post('/light/specialcarStop',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.special_stop_paramer(data,function(resData){
        console.log('special_stop_paramer return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});



app.post('/light/queryParamer',function(req,res){
    var data={};
    console.log(req.body);
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.query_task_paramer(data,function(resData){
        res.header({"Access-Control-Allow-Origin":"*"});
        if(resData.errCode!=0){
            res.send({result:"fail",msg:{errCode:'0x'+resData.errCode.toString(16),info:resData.msg}});
        }
        else{
            res.send({result:"success",paramerInfo:resData.msg});
        }
    });
});

app.post('/light/queryParamerBatch',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    console.log(data);
    user_app.query_task_paramer_batch(data,function(resData){
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});


app.post('/light/greenWaveBandParamer',function(req,res){
    var data={};
    console.log('platform=',os_platform);
    if (os_platform=='linux'){
        data = JSON.parse(req.body.ITSCConfData);
    }
    else{
        data = req.body;
    }
    user_app.green_wave_band_paramer(data,function(resData){
        console.log('green_wave_band_paramer return data:',resData)
        res.header({"Access-Control-Allow-Origin":"*"});
        res.send({result:resData});
    });
});






var server = http.createServer(app);
server.listen(config.port);
console.log('ports:',config.port);



