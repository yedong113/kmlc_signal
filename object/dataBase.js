var toolFunc = require('../commonTools.js');


/**
 * 数据域基类
 */
function dataBase() {
}


/**
 * 将数据写入 转换为16进制写入buffer
 */
dataBase.prototype.toBuffer = function () {

}


/**
 *解析数据
 * @param data
 */
dataBase.prototype.parseObject = function (data) {

}


/**
 * 设置数据域的值
 * @param option
 */
dataBase.prototype.setObject = function (option) {

}


//var db = new dataBase('periodTime');
//db.sellDataBase('periodTime');


exports = module.exports = dataBase;

