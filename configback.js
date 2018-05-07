var config = {
	port: 1555,
	mysql:{
		host:'53.28.100.34',
		port:3306,
		user:'wsjj_p',
		pwd:'kmlckj@wsjj_2016',
		database:'trafficcenter'
	},
	UDPListenPort:7777,
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
		changeScheme:{
			CtrlType:0xDB,
			CtrlMode:0x01
		}
	}
}


module.exports = config;
