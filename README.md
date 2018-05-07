## 公司信号机配置程序参数配置 config.js

|字段|类型|说明|
|:----    |:---|:-----|
|port|Int|本地监听端口|
|mysql|object|数据库配置:<li>host-数据库连接地址</li><li>port-数据库端口</li><li>user-用户名</li><li>pwd-密码</li><li>database-数据库名称</li>|
|reportPara|Object|信号机状态上报配置：<li>kafkaHost-kafka地址加端口</li><li>topic-ITSCRealData topic</li>|
|UDPListenPort|Int|UDP监听端口：<br><font color="red">注：公司的信号机不用配置此参数</font>|
|localhost|String|本地服务器地址|
|kmlcControlMode|Object|公司信号机模式更改参数:<br><font color="red">注：不用修改</font>|



### 另程序如果不由转发程序发送  lightGate.js有两处要修改

```
app.post('/light/paramer',function(req,res){
  var data = JSON.parse(req.body.ITSCConfData);//不转发要这样写
  //var data = req.body;//转发这样写
  console.log('data=',data);
  user_app.add_task_paramer(data,function(resData){
    console.log('add_task_paramer return data:',resData)
    res.header({"Access-Control-Allow-Origin":"*"});
    if(resData.errCode){
      res.send({result:"fail",msg:{errCode:'0x'+resData.errCode.toString(16),info:resData.msg}});
    }
    else{
      res.send({result:"success"});
    }
  });
});
```


```
app.post('/light/contrl',function(req,res){
  var data = JSON.parse(req.body.ITSCConfData);//不转发要这样写
  //var data = req.body;//转发这样写
  user_app.add_task_contrl(data,function(result){
    console.log('contrl:',result);
    res.header({"Access-Control-Allow-Origin":"*"});
    if(result.errCode){
      res.send({result:"fail",msg:{errCode:result.errCode,info:result }});
    }else{
      res.send({result:"success"});
    }
  });
});

```




### config.js 配置


```
var config = {
	port: 1555,
	mysql:{
		host:'53.28.100.34',
		port:3306,
		user:'wsjj_p',
		pwd:'kmlckj@wsjj_2016',
		database:'trafficcenter'
	},
	reportPara:{
		kafkaHost:'Node3:9092',
		topic:"ITSCRealData"
	},
	UDPListenPort:10000,
	localhost:'53.28.100.107',
	kmlcControlMode:{
		fullRedMode:{
			CtrlType:0xDB,
			CtrlMode:0xFD
		},
		flashYellowMode:{
			CtrlType:0xDB,
			CtrlMode:0xFE
		},
		closeLightMode:{
			CtrlType:0xDB,
			CtrlMode:0xFF
		},
		cancelControlMode:{
			CtrlType:0xD0,
			CtrlMode:0xF1
		},
		stepControlMode:{
            CtrlType:0xD2,
            CtrlMode:0x00
        },
        cancelStepControlMode:{
            CtrlType:0xD1,
            CtrlMode:0x00
        },
		changeScheme:{
			CtrlType:0xDB,
			CtrlMode:0x01
		}
	}
}
module.exports = config;
```