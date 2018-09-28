var redisPool = require("./redis_pool");
var config = require('./config/config');
var Tx = require('ethereumjs-tx')
const {promisify} = require('util');
const getAsync = promisify(redisPool.get).bind(redisPool);

const web3 = config.getWeb3();

async function syncNonce(from) {
  const key = 'NONCE:' + config.debug + ':' + from
  const nonce = await web3.eth.getTransactionCount(from)
  console.log(nonce)
  redisPool.set(key, nonce, 'EX', 3600*24)
}

async function getNonce(from) {
  const key = 'NONCE:' + config.debug + ':' + from
  const res = await getAsync(key)
  if (!res) {
    const nonce = await web3.eth.getTransactionCount(from)
    redisPool.set(key, nonce, 'EX', 3600*24)
    return nonce
  } else {
    return parseInt(res)
  }
  console.log('redis get error: ', err)
  return -1
}

async function closeBet(commit, callback) {
  const reveal = await getAsync(commit)
  const pk = config.pk
  const from = config.address
  const gasPrice = await web3.eth.getGasPrice()
  const nonce = await getNonce(from)
  if (nonce < 0 || (nonce != 0 && !nonce)) {
    console.log('nonce too small', nonce)
    return
  }
  var privateKey = new Buffer(pk, 'hex')
  var data = config.casinoContract.methods.closeBet(reveal).encodeABI()

  var rawTx = {
    nonce: web3.utils.toHex(nonce),
    gasPrice: web3.utils.toHex(gasPrice), // 2 Gwei 2000000000
    gasLimit: web3.utils.toHex(60000),
    from: from,
    to: config.casinoContract._address,
    value: web3.utils.toHex(0),
    data: data
  }
  var tx = new Tx(rawTx);
  tx.sign(privateKey);
  
  var serializedTx = tx.serialize();
  
  return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), callback)
}

syncNonce(config.address)
//closeBet(0, console.log)
module.exports = {
    closeBet: closeBet 
}
