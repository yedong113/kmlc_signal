/**************************************************************
*用于kmkc信号机时间转换功能。
**************************************************************/

/*************************************************************
**************************************************************/
function kmlcDigit2Binary(startValue,len)
{
	var a = startValue.toString(2);
	while(a.length<len){
		a = '0'+ a;
	}

	if(a.length>len){
		a = a.substring(a.length-len);
	}

	console.log(a);
	return  a;
}

module.exports.kmlcDigit2Binary = kmlcDigit2Binary;
// kmlcDigit2Binary(4095,13);