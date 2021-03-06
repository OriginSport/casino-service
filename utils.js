const web3 = require('web3')
const axios = require('axios')
const BigNumber = require('bignumber.js')

function getResult(reveal, blockHash, modulo) {
  const random = new BigNumber(web3.utils.soliditySha3(reveal, blockHash))
  const result = random.modulo(modulo)
  return result.toNumber()
}

function pushUpdate(url, logText) {
  axios.get(url)
    .then(function (response) {
      console.log('push ' + logText + ' to client');
    })
    .catch(function (error) {
      console.log(logText + '[' + new Date().toLocaleString() + ']:', error);
    })
}

const reveal = '0x' + '000000000000000000000000000000000000000000000000000ddee4def596f7'
const commit = web3.utils.sha3(reveal)
const blockHash = '0xac62d92f3c1eec9b2574db3a06c6b3cba28628bc4bb47b640e72515eaa9d65d3'
//console.log(commit)
//console.log(getResult(reveal, blockHash, 99))

module.exports = {
  getResult: getResult,
  pushUpdate: pushUpdate
}
