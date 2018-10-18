const axios = require('axios')
const Web3 = require('web3')

const redisPool = require('./redisPool')
const redisUtils = require('./redisUtils')
const conf = require('./config/config.js')
const manage = require('./manageService')
const utils = require('./utils')
const redlock = require('./redlock')

const getProvider = () => {
    const provider = new Web3.providers.WebsocketProvider(conf.geth_ws_url)
    provider.on('connect', () => console.log(new Date().toLocaleString(), ' WebSocket -------start--------'))
    provider.on('error', e => {
      console.error(new Date().toLocaleString(), ' WS Error: ', e)
      web3.setProvider(getProvider())
      startListen()
    })
    provider.on('end', e => {
      console.error(new Date().toLocaleString(), ' WS End: ', e)
      web3.setProvider(getProvider())
      startListen()
    })

    return provider
}
const web3 = new Web3(getProvider())

setInterval(() => web3.eth.getBlockNumber()
    .then(number => {
      console.log(new Date() + ' set interval get block nubmer: ', number)
    }).catch(err => {
      console.log(new Date() + ' set interval error: ', err)
      web3.setProvider(getProvider())
      startListen()
    }), 1000*5*60)

function listenbetClosed() {
  console.log('start listening close bet transaction')
  web3.eth.subscribe('logs', {
    address: conf.casinoContract._address,
    topics: ['0x0b69c882106d473936244e69933a842887f623d0eb2bb247dcb75215d461bd7b'],
  }, function(error, result) {
    if (error) {
      console.error(new Date().toLocateString(), ' listen close bet transaction error: ' + JSON.stringify(error));
    } else {
      console.log('listen close bet data[' + new Date().toLocaleString() + ']:', result.transactionHash)
      const address = '0x' + result.topics[1].slice(26, 66)
      const winAmount = parseInt('0x' + result.data.slice(258, 322))
      console.log('win amount is: ', winAmount, 'player is: ', address)
      if (winAmount > 0) {
        redisUtils.updateLastWinner(address, winAmount)
        const url = 'http://' + conf.inetAddr + ':' + conf.inetPort +  '/v1/api/dataUpdate'
        const type = 'closeBetUpdateData'
        utils.pushUpdate(url, type)
      }
    }
  })
}

function listenPlaceBet() {
  console.log('start listening place bet transaction')
 
  web3.eth.subscribe('logs', {
    address: conf.casinoContract._address,
    topics: ['0xca8973a7d00c5301c999a74e4b27b70ea2391f4575d08e0bf037c435ebd753c0'],
  }, function(error, result) {
    if (error) {
      console.error(new Date().toLocateString(), ' listen place bet transaction error: ' + JSON.stringify(error));
    } else {
      const data = result.data
      const modulo = parseInt(result.topics[2])
      const choice = parseInt(data.slice(0, 66))
      const value = parseInt('0x' + data.slice(66, 130))
      const commit = '0x' + data.slice(130,194)
      const blockHash = result.blockHash
      const txhash = result.transactionHash
      console.log('listen place bet data[' + new Date().toLocaleString() + ']:', txhash, commit)

      // update relate data
      redisUtils.placeBetUpdate(value, modulo)
      const dataUpdateUrl = 'http://' + conf.inetAddr + ':' + conf.inetPort +  '/v1/api/dataUpdate'
      utils.pushUpdate(dataUpdateUrl, 'dataUpdate')


      const ttl = 1000
      redlock.lock(conf.redlockKey, ttl).then(lock => {
        redisPool.get(commit, function(err, reply) {
          if (!reply) {
            return
          }
          const result = utils.getResult(reply, blockHash, modulo)
          console.log('calculate result: txhash, reveal, blockHash, modulo, result', txhash, reply, blockHash, modulo, result)
          const commitRevealUrl = 'http://' + conf.inetAddr + ':' + conf.inetPort +  '/v1/api/betClosed?commit=' + commit + '&result=' + result + '&modulo=' + modulo
          utils.pushUpdate(commitRevealUrl, 'commit-reveal')
          manage.closeBet(commit, function(err, hash) {
            if (err) {
              console.log('[' + new Date().toLocaleString() + ']:' + 'close bet error occur, has return: ', err, commit)
              redisPool.sadd('MISSING_COMMITS', commit)
              return
            }
            console.log('close bet, place txhash and commit: ', txhash, commit, modulo, choice, result)
            redisPool.incr('NONCE:' + conf.debug + ':' + conf.address, function(err, reply) {
              console.log('incr nonce ', err, reply, hash)
              redisPool.del(commit)
            })
          }).catch(error => {
            console.log('[' + new Date().toLocaleString() + ']:' + 'close bet error occur: ', error, commit)
            redisPool.sadd('MISSING_COMMITS', commit)
          })
        })
        return lock.unlock(error => {
          if (error) {
            console.log('[' + new Date().toLocaleString() + ']:', error)
          }
        })
      })
    }
  })
}

function startListen() {
  listenPlaceBet()
  listenbetClosed()
}

startListen()

module.exports = {
  listenPlaceBet: listenPlaceBet
}
