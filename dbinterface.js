var mysql = require('mysql')


function db_mysql(option_)
{
	this.option = option_;
}


db_mysql.prototype.open = function(callback)
{
	this.connectObj = mysql.createConnection({
    	host: this.option.host,
    	user: this.option.user,
    	password: this.option.pwd,
   	 	database:this.option.database
	});

	this.connectObj.connect(function(err){
		callback(err);
	});
}


db_mysql.prototype.close = function(callback)
{

}

db_mysql.prototype.select = function(sql,callback)
{
	this.connectObj.query(sql, function(err, rows, fields) {
  		callback(err,rows);
	});
}

db_mysql.prototype.insert = function(sql,callback)
{

}

db_mysql.prototype.delete = function(sql,callback)
{

}


db_mysql.prototype.update = function(sql,callback)
{
	
}

// var db  = new db_mysql({
// 	host:'53.28.100.34',
// 	user:'wsjj_p',
// 	pwd:'kmlckj@wsjj_2016',
// 	database:'trafficcenter'
// })

// db.open(function(err){
// 	if(err){
// 		console.log('open:',err);
// 	}
// 	else{
// 		console.log('connect mysql is ok!')
// 	}
// });

// db.select('SELECT * from tb_device where TypeValue=211',function(err,data){
// 	if(err){
// 		console.log(err);
// 	}else{
// 		console.log(data.length)
// 	}
// });

module.exports = db_mysql;