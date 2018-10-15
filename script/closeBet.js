const {web3, property, sendSignedTxHelper} = require('./contractUtil.js')
const {getEvents} = require('./eventUtil')
const redisPool = require("../redisPool")
const {promisify} = require('util')
const getAsync = promisify(redisPool.get).bind(redisPool)


const casinoAbi = require('../config/abis.js').casinoAbi
const casinoAddr = property.contractAddress
const contract = new web3.eth.Contract(casinoAbi, casinoAddr)

const croupierPk = property.pk
const croupier = property.from
let nonce = 0

let frozenBan = 0
let counter = 0

async function manualCloseBet() {
  const events = getEvents(casinoAbi)
  const fromBlock = property.fromBlock
  const expirationBlocks = 250
  const manualCloseBlocks = 12
  const logParticipant = events.LogParticipant
  web3.eth.getPastLogs({fromBlock: fromBlock, address: casinoAddr, topics: [logParticipant.signature]})
    .then(logs => {
      for (const log of logs) {
        const commit = '0x' + log.data.slice(130, 194)
          .call(async (error, result) => {
        contract.methods.bets(commit)
            if (error) {
              console.log('get bet [commit: ', commit, '] error!!!\r\n', error)
            } else {
              const isActive = result.isActive
              if (isActive) {
                const blockNumber = await web3.eth.getBlockNumber()
                const placeBlockNumber = parseInt(result.placeBlockNumber)
                // close bet which is unexpired but not auto closed
                if (blockNumber <= placeBlockNumber + expirationBlocks && blockNumber > placeBlockNumber + manualCloseBlocks) {
                  frozenBan += parseInt(result.amount)
                  console.log(counter++, frozenBan)
                  // get reveal by commit
                  const reveal = await getAsync(commit)
                  const data = contract.methods.closeBet(reveal).encodeABI()
                  // make nonce correctly in async function
                  const currNonce = await web3.eth.getTransactionCount(croupier)
                  nonce = nonce > currNonce ? nonce : currNonce
                  await sendSignedTxHelper(casinoAddr, data, null, croupierPk, nonce++)
                }
              }
            }
          })
      }
    })
}

async function test() {
  web3.eth.getBalance(casinoAddr).then(data => console.log('ban before', data))
  contract.methods.bankFund().call().then(data => {console.log('bankFund', data)})
  await manualCloseBet()

}
test()
