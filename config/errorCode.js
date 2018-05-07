var errorCode = {
    noerror:0x00,
    signalnotexist:0x01,//信号机编码不存在
    signaloffline:0x02,//信号机不在线
    configcheckerror:0x03,//配置检查不通过
    settingsomeone:0x04,//其他人在配置中
    unkownerror:0xff//其他未知错误
};


module.exports = errorCode;

