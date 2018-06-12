var express=require('express')
var util = require('util')

var app = express();

//app.use(app.router)
app.use(function (err,req,res,next) {
    res.send(500,err.message);
})


/*
app.get('/',function (req,res) {
    //next();
    res.send('<p style="color:blueviolet;">Hello World...</p>');
});
*/



app.get('/', function(req, res, next){
//    res.redirect('http://www.baidu.com');
    res.redirect(302, 'demo');
    res.end();
});



app.get('/demo', function(req, res){
    res.send('<p style="color:blueviolet;">Hello World...</p>');
    res.end();
});




app.listen(1337,"0.0.0.0");
