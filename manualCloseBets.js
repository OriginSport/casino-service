const axios = require('axios')
const Web3 = require('web3')

const redisPool = require('./redisPool')
const redisUtils = require('./redisUtils')
const conf = require('./config/config.js')
const manage = require('./manageService')
const utils = require('./utils')
const redlock = require('./redlock')
const web3 = conf.getWeb3()

function closeWithSets() {
  redisPool.smembers('MISSING_COMMITS', (err, data) => {
    data.forEach(commit => {
      close(commit)
    })
  })
}

function close(commit) {
  redlock.lock('MANUAL_CLOSE', 1000).then(lock => { 
    console.log('[' + new Date().toLocaleString() + ']: start to manual close bet ', commit) 
    manage.closeBetWithAddress(commit, conf.manualPk, conf.manualAddress, function(err, hash) {
      if (err) {
        console.log('[' + new Date().toLocaleString() + ']:' + 'close bet error occur, has return: ', err, commit)
        redisPool.sadd('MISSING_COMMITS', commit)
        return
      }
      redisPool.incr('NONCE:' + conf.debug + ':' + conf.manualAddress, function(err, reply) {
        console.log('incr nonce ', err, reply, hash)
        redisPool.del(commit)
      })
      redisPool.srem('MISSING_COMMITS', commit)
    }).catch(error => {
      console.log('[' + new Date().toLocaleString() + ']:' + 'close bet error occur: ', error, commit)
      redisPool.sadd('MISSING_COMMITS', commit)
    })
    return lock.unlock(error => {
      if (error) {
        console.log('Redlock error: [' + new Date().toLocaleString() + ']:', error)
      }
    })
  })
}

async function closeWithEvents() {
  //const fromBlock = '0x638fd8'
  const expirationBlocks = 250
  const manualCloseBlocks = 12
  const blockNumber = await web3.eth.getBlockNumber()
  const fromBlock = '0x' + (blockNumber - expirationBlocks - manualCloseBlocks).toString(16)
  const toBlock = '0x' + (blockNumber - manualCloseBlocks).toString(16)
  web3.eth.getPastLogs({fromBlock: fromBlock, toBlock: toBlock, address: conf.casinoAddress, topics: ['0xca8973a7d00c5301c999a74e4b27b70ea2391f4575d08e0bf037c435ebd753c0']})
    .then(logs => {
      console.log('logs length is: ', logs.length)
      for (const log of logs) {
        const commit = '0x' + log.data.slice(130, 194)
        /* log data structure
         { address: '0x5085c5356129Ee11BffB523E3166d7153aC13C75',
					topics:
					 [ '0xca8973a7d00c5301c999a74e4b27b70ea2391f4575d08e0bf037c435ebd753c0',
						 '0x0000000000000000000000007525c82e0cf1832e79ff3aff259c5fe853cf95f4',
						 '0x0000000000000000000000000000000000000000000000000000000000000064' ],
					data: '0x000000000000000000000000000000000000000000000000000000000000004a000000000000000000000000000000000000000000000000016345785d8a0000b5cc6d84fba393e09fcc0cacd74c8add0edeb9823975d66127fcb88e3dfb7069',
					blockNumber: 6530049,
					transactionHash: '0xab313f62b6e8b638763ace04b94385886bd604394ec58f86988d008795a4364d',
					transactionIndex: 63,
					blockHash: '0x90f189484dfc7040c206d2d9eaee9c4d017df7f482eab4c9964e74b28a73be6a',
					logIndex: 31,
					removed: false,
					id: 'log_ea430d7d' }
         */
        conf.casinoContract.methods.bets(commit).call(async (error, result) => {
            if (error) {
              console.log('get bet [commit: ', commit, '] error!!!\r\n', error)
            } else {
              const isActive = result.isActive
              if (isActive) {
                const placeBlockNumber = parseInt(result.placeBlockNumber)
                // close bet which is unexpired but not auto closed
                if (blockNumber <= placeBlockNumber + expirationBlocks && blockNumber > placeBlockNumber + manualCloseBlocks) {
									console.log('start to close bet which place bet txhash is: ', log.transactionHash)
                  close(commit)
                }
              }
            }
          })
      }
    })
}

closeWithEvents()
setTimeout(function() {process.exit()}, 10000)
