var schedule = require('node-schedule');

var sportsOn = schedule.scheduleJob('0 2 * * *', function(){
    console.log('2 o clock UTC');
});