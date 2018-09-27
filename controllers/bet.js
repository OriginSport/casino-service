var express = require('express')
var router = express.Router()
var conf = require('../config/config.js')
var redisPool = require("../redis_pool");

router.get("/saveSecret", function (req, res, next) {
    let success = conf.requestSuccess()
    let fail = conf.requestFaild()
    console.log(req.query)
    res.json(success)
})

module.exports = router
