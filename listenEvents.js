const axios = require('axios')
const Web3 = require('web3');

const conf = require('./config/config.js');
const manage = require('./service/manageService')

let debug = true
if (process.env.NODE_ENV == 'pro') {
  debug = false
}

//web3.setProvider(new Web3.providers.WebsocketProvider('ws://' + conf.geth_http_host + ':' + conf.geth_ws_port, 5000));
const ws_url = debug ? 'wss://ropsten.infura.io/_ws' : 'wss://mainnet.infura.io/_ws'
const server_url = debug ? 'http://118.89.37.64:8100/new_trans_records/' : 'https://ors.ttnbalite.com:8100/new_trans_records/'

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
      console.log(result)
      const commit = 'test'
      manage.closeBet(commit, function(err, hash) {
        console.log(err, hash)
      }).catch(error => {
        console.log('close bet error occur: ', error)
      })
    }
  })
}

listenPlaceBet()
