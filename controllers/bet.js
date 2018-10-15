const express = require('express')
const router = express.Router()
const Account = require('eth-lib/lib/account')
const conf = require('../config/config.js')
const redisPool = require('../redisPool')
const redisUtils = require('../redisUtils')
const web3 = conf.getWeb3();

// router.get("/saveSecret", function (req, res, next) {
//     let success = conf.requestSuccess()
//     let fail = conf.requestFaild()
//     const commit = req.query.commit
//     const reveal = req.query.reveal
//     console.log(commit, reveal)
//     redisPool.set(commit, reveal)
//     res.json(success)
// })
//

const events = {
  betClosed: 'betClosed', //send bet result
  casinoDataUpdate: 'casinoDataUpdate', //send total amount of casino game, daily amount, last jackpot, daily top winners
  sportAmount: 'sportAmount', //send total amount sport betting
}

router.get('/betClosed', function(req, res, next) {
    if (!req.ip || req.ip.slice(7, req.ip.length) != conf.inetAddr) {
      const fail = conf.requestFaild()
      res.json(fail)
    }
    let success = conf.requestSuccess()
    const commit = req.query.commit
    const result = req.query.result
    const modulo = req.query.modulo
    const io = req.app.get('io')
    obj = {commit: commit, result: result, modulo: modulo}
    io.emit('betClosed', JSON.stringify(obj))
    res.json(success)
})

router.get('/dataUpdate', function(req, res, next) {
    let success = conf.requestSuccess()
    const io = req.app.get('io')
    redisUtils.getData().then(data => {
      io.emit('dataUpdate', JSON.stringify(data))
    })
    res.json(success)
})

router.get('/betPlaced', function(req, res, next) {
    let success = conf.requestSuccess()
    const value = req.query.value
    const io = req.app.get('io')
    obj = {commit: commit, result: result}
    io.emit('daily', JSON.stringify(obj))
    res.json(success)
})

router.get('/sportBetPlaced', function(req, res, next) {
    let success = conf.requestSuccess()
    const value = req.query.value
    const io = req.app.get('io')
    obj = { data: value }
    io.emit('sportAmount', JSON.stringify(obj))
    res.json(success)
})

router.get('/random', function(req, res, next) {
    let success = conf.requestSuccess()
    let fail = conf.requestFaild()
    const networkId = req.query.networkId
    const address = req.query.address
    const reveal = web3.utils.randomHex(32)
    const commit = web3.utils.soliditySha3(reveal)
    redisPool.setex(commit, 3750, reveal)
    const expiredBlockNumber = 8000000
    signData = getSignature(expiredBlockNumber, commit, conf.pk)
    data = {}
		data.commit = commit
    data.expiredBlockNumber = expiredBlockNumber
    data.signature = {}
    data.signature.signature = signData[0]
    data.signature.v = signData[1]
    data.signature.r = signData[2]
    data.signature.s = signData[3]
    success.data = data
    res.json(success)
})

function getSignature(expiredBlockNumber, commit, pk) {
  pk = '0x' + pk
  const msgHash = web3.utils.soliditySha3(expiredBlockNumber, commit)
  const signature = Account.sign(msgHash, pk)
  const r = signature.slice(0, 66)
  const s = '0x' + signature.slice(66, 130)
  const v = '0x' + signature.slice(130, 132)
  return [signature, v, r, s]
}

module.exports = router
