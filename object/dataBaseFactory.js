var periodTime = require('./periodTime.js');
var lightSignalGroup = require('./lightSignalGroup.js');
var phaseInfo = require('./phase.js');
var schemeInfo = require('./scheme.js');
var schedule = require('./schedule.js');
var dataBaseFactory = {
    createDataBaseModel:function (model) {
        var dataBase ;
        switch (model){
            case 'periodTime':{
                dataBase = new periodTime();
            }
            break;
            case 'lightSignalGroup':{
                dataBase = new lightSignalGroup();
            }
            break;
            case 'phase':{
                dataBase = new phaseInfo();
            }
            break;
            case 'scheme':{
                dataBase = new schemeInfo();
            }
            break;
            case 'schedule':{
                dataBase = new schedule();
            }
            break;
            default:{
                dataBase = new periodTime();
            }
            break;
        }
        return dataBase;
    }
}

module.exports = dataBaseFactory;

//var database = dataBaseFactory.createDataBaseModel('periodTime');


