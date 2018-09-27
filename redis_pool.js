var redis = require("redis")
var redisPool = redis.createClient()

//redisPool.set('test', 'xixi', function (err,reply) {
//    if(!err){
//        console.log(reply);
//    }
//
//    redisPool.get('test', function (err, reply1) {
//        console.log(reply1); // 'foobar'
//    });
//});

module.exports = redisPool
