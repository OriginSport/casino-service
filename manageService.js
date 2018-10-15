var redisPool = require("./redisPool")
const conf = require('./config/config')

var Tx = require('ethereumjs-tx')
const {promisify} = require('util');
const getAsync = promisify(redisPool.get).bind(redisPool);

const web3 = conf.getWeb3();

async function syncNonce(from) {
  const key = 'NONCE:' + conf.debug + ':' + from
  const nonce = await web3.eth.getTransactionCount(from)
  console.log('syncing nonce: ', nonce)
  redisPool.set(key, nonce, 'EX', 3600*24)
}

async function getNonce(from) {
  const key = 'NONCE:' + conf.debug + ':' + from
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
  const pk = conf.pk
  const from = conf.address
  const gasPrice = await web3.eth.getGasPrice()
  let nonce = await getNonce(from)
  const nonceOnline = await web3.eth.getTransactionCount(from)

  if (nonce < 0 || (nonce != 0 && !nonce) || nonce < nonceOnline) {
    console.log('redis nonce is not correct, sync nonce online')
    nonce = nonceOnline
  }
  var privateKey = new Buffer(pk, 'hex')
  var data = conf.casinoContract.methods.closeBet(reveal).encodeABI()

  var rawTx = {
    nonce: web3.utils.toHex(nonce),
    gasPrice: web3.utils.toHex(gasPrice), // 2 Gwei 2000000000
    gasLimit: web3.utils.toHex(60000),
    from: from,
    to: conf.casinoContract._address,
    value: web3.utils.toHex(0),
    data: data
  }
  var tx = new Tx(rawTx);
  tx.sign(privateKey);
  
  var serializedTx = tx.serialize();
  
  return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), callback)
}

syncNonce(conf.address)
//closeBet('0x36c3b7aa855b06e4c0d38c31b88edb823ca0af6dcc555cc208404e11877653c8', console.log)
//closeBet('0x' + 'bfbca8ab55b013bea34cb7ed0436b4069d90b00d271eee0d6b627514e0c117df', console.log)
module.exports = {
    closeBet: closeBet 
}
