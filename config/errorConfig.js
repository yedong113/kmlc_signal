
errorKeyString = {
    0x00:'successfull',
    0x01:'信号机编码不存在',
    0x02:'信号机不在线',
    0x03:'配置检查不通过',
    0x04:'其他人在配置中',
    0xff:'其他未知错误',
    0x9001:'调度计划未覆盖一整年',
    0x9002:'日计划表中需使用的某项不存在',
    0x9101:'日计划表中的第一项未从00：00开始',
    0x9102:'日计划表项中的hour不合法，应该在0~23之间',
    0x9103:'日计划表项中的minute不合法，应该在0~59之间',
    0x9105:'日计划表项中使用的方案不合法',
    0x9201:'方案中的阶段表不存在',
    0x9204:'方案中的协调相位大于PHASE_MAX（32）',
    0x9301:'阶段表中的某相位不存在',
    0x9303:'阶段表项中的最小绿灯时间大于最大绿灯时间，弹性延长时间等于0',
    0x9304:'阶段表项中的人行绿闪大于车行总时间'
};

errorMessage = [
    {code:0,errorString:'成功'},
    {code:1,errorString:'设备不在线'}
]


//module.exports = errorMessage;

module.exports = errorKeyString;
