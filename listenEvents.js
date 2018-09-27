const conf = require('./config/config.js');
const axios = require('axios')
const Web3 = require('web3');

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
  // topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null],
 
  web3.eth.subscribe('logs', {
    address: conf.casinoContract._address,
    topics: ['sha3 of placeBet'],
  }, function(error, result) {
    if (error) {
      console.error(new Date().toLocateString(), ' listen place bet transaction error: ' + JSON.stringify(error));
    } else {
      console.log('listen place bet data[' + new Date().toLocaleString() + ']:', result.transactionHash)
      const txhash = result.transactionHash
    }
  })
}
