const axios = require('axios')
const Web3 = require('web3')

const redisPool = require('./redis_pool')
const redisUtils = require('./redisUtils')
const conf = require('./config/config.js')
const manage = require('./manageService')
const utils = require('./utils')

let debug = true
if (process.env.NODE_ENV == 'pro') {
  debug = false
}

//web3.setProvider(new Web3.providers.WebsocketProvider('ws://' + conf.geth_http_host + ':' + conf.geth_ws_port, 5000));
const ws_url = debug ? 'wss://ropsten.infura.io/_ws' : 'wss://mainnet.infura.io/_ws'

const getProvider = () => {
    const provider = new Web3.providers.WebsocketProvider(ws_url)
    provider.on('connect', () => console.log(new Date().toLocaleString(), ' WebSocket -------start--------'))
    provider.on('error', e => {
      console.error(new Date().toLocaleString(), ' WS Error: ', e)
      web3.setProvider(getProvider())
    })
    provider.on('end', e => {
      console.error(new Date().toLocaleString(), ' WS End: ', e)
      web3.setProvider(getProvider())
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
    }), 1000*5*60)

function listenPlaceBet() {
  console.log('start listening place bet transaction')
 
  web3.eth.subscribe('logs', {
    address: conf.casinoContract._address,
    topics: ['0xca8973a7d00c5301c999a74e4b27b70ea2391f4575d08e0bf037c435ebd753c0'],
  }, function(error, result) {
    if (error) {
      console.error(new Date().toLocateString(), ' listen place bet transaction error: ' + JSON.stringify(error));
    } else {
      console.log('listen place bet data[' + new Date().toLocaleString() + ']:', result.transactionHash)
      const data = result.data
      const modulo = parseInt(result.topics[2])
      const value = parseInt('0x' + data.slice(66, 130))
      const commit = '0x' + data.slice(130,194)
      const blockHash = result.blockHash

      // update relate data
      redisUtils.placeBetUpdate(value, modulo)
      axios.get('http://' + conf.inetAddr + ':' + conf.inetPort +  '/v1/api/dataUpdate')
        .then(function (response) {
          console.log('place bet data update');
        })
        .catch(function (error) {
          console.log('place bet data update error[' + new Date().toLocaleString() + ']:', error);
        })

      redisPool.get(commit, function(err, reply) {
        if (!reply) {
          return
        }
        const result = utils.getResult(reply, blockHash, modulo)
        manage.closeBet(commit, function(err, hash) {
          redisPool.incr('NONCE:' + conf.debug + ':' + conf.address, function(err, reply) {
            console.log('incr nonce ', err, reply)
          })
          redisPool.del(commit)
          axios.get('http://' + conf.inetAddr + ':' + conf.inetPort +  '/v1/api/betClosed?commit=' + commit + '&result=' + result + '&modulo=' + modulo)
            .then(function (response) {
              console.log('push commit-reveal result to client');
            })
            .catch(function (error) {
              console.log('[' + new Date().toLocaleString() + ']:', error);
            })
          //io.sockets.emit('closeBet', commit)
        }).catch(error => {
          console.log('[' + new Date().toLocaleString() + ']:' + 'close bet error occur: ', error)
        })
      })
    }
  })
}

listenPlaceBet()

module.exports = {
  listenPlaceBet: listenPlaceBet
}
