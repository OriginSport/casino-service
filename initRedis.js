const redisPool = require('./redis_pool')

redisPool.set('sportAmount', '676160000000000000000')
redisPool.set('casinoAmount', '312160000000000000000')
redisPool.set('dailyCasinoAmount', '12160000000000000000')
redisPool.set('lastJackpot', '1160000000000000000')
redisPool.set('dailyTopWinners', '1160000000000000000')

const data = {
  sportAmount: '676160000000000000000',
  casinoAmount: '312160000000000000000',
  dailyCasinoAmount: '12160000000000000000_213',
  lastJackpot: '1160000000000000000_0xb11F39e5B16fA8F60870E27F467a36Bc30853326',
  dailyTopWinners: '2160000000000000000_0xb11F39e5B16fA8F60870E27F467a36Bc30853326_1860000000000000000_0x28e620f0bd68e8b8f3b50b1a61e54fd968e071b2'
}

module.exports = data
