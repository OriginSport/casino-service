var redis = require("redis")
const conf = require('./config/config.js')

var redisPool = redis.createClient({db: conf.redisDBNumber})

//redisPool.get('sportAmount', function(err, data) {
//  console.log(err, data)
//})

module.exports = redisPool
