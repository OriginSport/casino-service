var redis = require("redis")
const conf = require('./config/config.js')

var perRedisPool = redis.createClient({db: conf.persistenceRedisDBNumber})

//redisPool.get('sportAmount', function(err, data) {
//  console.log(err, data)
//})

//perRedisPool.set('test', 't1')

module.exports = perRedisPool
