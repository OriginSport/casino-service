const redisPool = require('./redis_pool')
const bigNumber = require('bignumber.js')
const {promisify} = require('util')
const getAsync = promisify(redisPool.get).bind(redisPool)
const incrbyAsync = promisify(redisPool.incrby).bind(redisPool)

//redisPool.set('sportAmount', '676160000000000000000')
//redisPool.set('casinoAmount', '312160000000000000000')
//redisPool.set('dailyCasinoAmount', '12160000000000000000')
//redisPool.set('dailyCasinoBets', '1')
//redisPool.set('lastWinnerAmount', '1160000000000000000')
//redisPool.set('lastWinnerAddress', '0xb11F39e5B16fA8F60870E27F467a36Bc30853326')
//redisPool.set('dailyTopWinners', '2160000000000000000_0xb11F39e5B16fA8F60870E27F467a36Bc30853326_1860000000000000000_0x28e620f0bd68e8b8f3b50b1a61e54fd968e071b2_1360000000000000000_0xabgg39e5B16fA8F60870E27F467a36Bc30rrrrr7')
//redisPool.set('gameModulo2Amount', '1160000000000000000')
//redisPool.set('gameModulo2Bets', 1)
//redisPool.set('gameModulo6Amount', '1330000000000000000')
//redisPool.set('gameModulo6Bets', 2)
//redisPool.set('gameModulo36Amount', '1860000000000000000')
//redisPool.set('gameModulo36Bets', 3)
//redisPool.set('gameModulo100Amount', '2170000000000000000')
//redisPool.set('gameModulo100Bets', 4)

const data = {
  sportAmount: '676160000000000000000',
  casinoAmount: '312160000000000000000',
  dailyCasinoAmount: '12160000000000000000_213',
  lastWinner: '1160000000000000000_0xb11F39e5B16fA8F60870E27F467a36Bc30853326',
  dailyTopWinners: '2160000000000000000_0xb11F39e5B16fA8F60870E27F467a36Bc30853326_1860000000000000000_0x28e620f0bd68e8b8f3b50b1a61e54fd968e071b2'
}

async function incr(type, value) {
  const old = await getAsync(type)
  const newVal = (new bigNumber(old)).plus(value).toString()
  redisPool.set(type, newVal)
}

function placeBetUpdate(value, modulo) {
  const type = 'gameModulo' + modulo + 'Amount'
  const typeBets = 'gameModulo' + modulo + 'Bets'
  incr(type, value)
  incr(typeBets, 1)
  incr('casinoAmount', value)
  incr('dailyCasinoAmount', value)
  incr('dailyCasinoBets', 1)
}

function reset(type, value) {
  redisPool.set(type, value)
}

function getUnderscore(a, b) {
  return a + '_' + b
}

async function updateLastWinner(address, amount) {
  const key = 'lastWinnerAmount'
  const keyAddress = 'lastWinnerAddress'
  const old = await getAsync(key)
  if (parseInt(amount) >= old) {
    redisPool.set(key, amount)
    redisPool.set(keyAddress, address)
  }
}

async function getData() {
  let data = {}
  data['sportAmount'] = await getAsync('sportAmount')
  data['casinoAmount'] = await getAsync('casinoAmount')
  const dca = await getAsync('dailyCasinoAmount')
  const dcb = await getAsync('dailyCasinoBets')
  data['dailyCasinoAmount'] = getUnderscore(dca, dcb)
  const lwa = await getAsync('lastWinnerAmount')
  const lwad = await getAsync('lastWinnerAddress')
  data['lastWinner'] = getUnderscore(lwa, lwad)
  data['dailyTopWinners'] = await getAsync('dailyTopWinners')
  const gm2a = await getAsync('gameModulo2Amount')
  const gm2b = await getAsync('gameModulo2Bets')
  data['gameModulo2Amount'] = getUnderscore(gm2a, gm2b)
  const gm6a = await getAsync('gameModulo6Amount')
  const gm6b = await getAsync('gameModulo6Bets')
  data['gameModulo6Amount'] = getUnderscore(gm6a, gm6b)
  const gm36a = await getAsync('gameModulo36Amount')
  const gm36b = await getAsync('gameModulo36Bets')
  data['gameModulo36Amount'] = getUnderscore(gm36a, gm36b)
  const gm100a = await getAsync('gameModulo100Amount')
  const gm100b = await getAsync('gameModulo100Bets')
  data['gameModulo100Amount'] = getUnderscore(gm100a, gm100b)
  return data
}

//incr('sportAmount', '1160000000000000000')

placeBetUpdate('60000000000000000', 2)
getData().then(data => {
  console.log(data)
})

module.exports = {
  getData: getData,
  incr: incr,
  placeBetUpdate: placeBetUpdate
}
