var config = {
	port: 1555,
	mysql:{
        host:'53.15.72.81',
        port:3306,
        user:'hzjj_p',
        pwd:'kmlckj@hzjj_2017',
        database:'trafficcenter'
	},
	reportPara:{
        kafkaHost:'kafka01:19092,kafka02:19092,kafka03:19092',
		topic:"ITSCRealData",
        RealTrafficFlowTopic:'ITSCRealTrafficFlow',
        RealLaneQueueTopic:'ITSCRealLaneQueue'
	},
	UDPListenPort:10000,
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
		},
		timeSegmentResponse:{
            CtrlType:0xDB,
            CtrlMode:0x22
		},
        timeSegmentNoResponse:{
            CtrlType:0xDB,
            CtrlMode:0x21
        }

    }
}

module.exports = config;
