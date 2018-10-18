const {web3, property, sendSignedTxHelper} = require('./contractUtil.js')
const {getEvents} = require('./eventUtil')

const casinoAbi = require('../config/abis.js').casinoAbi
const casinoAddr = property.contractAddress
const contract = new web3.eth.Contract(casinoAbi, casinoAddr)

const croupierPk = property.croupierPk
const croupier = property.croupier
const fromBlock = property.fromBlock
let nonce = 0

async function autoRefundBet() {
  const events = getEvents(casinoAbi)
  const expirationBlocks = 250
  const logParticipant = events.LogParticipant
  const blockNumber = await web3.eth.getBlockNumber()
  console.log('blockNumber', blockNumber)
  web3.eth.getPastLogs({fromBlock: fromBlock, address: casinoAddr, topics: [logParticipant.signature]})
    .then(logs => {
      for (const log of logs) {
        const commit = '0x' + log.data.slice(130, 194)
        contract.methods.bets(commit)
          .call(async (error, result) => {
            if (error) {
              console.log('get bet [commit: ', commit, '] error!!!\r\n', error)
            } else {
              const isActive = result.isActive
              if (isActive) {
                const placeBlockNumber = parseInt(result.placeBlockNumber)
                // refund bet which is expired
                if (blockNumber > placeBlockNumber + expirationBlocks) {
                  const data = contract.methods.refundBet(commit).encodeABI()
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
  await autoRefundBet()

}
test()
