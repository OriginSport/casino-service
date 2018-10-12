const properties = require('./propertyConfig')

const defaultProperties = {
  /**
  * development: {
  *   networkID: '5777',
  *   contractAbi: [],
  *   contractAddress: '',
  *   url: 'http://127.0.0.1:7545',
  *   from: '',
  *   pk: '',
  *   gasPrice: 10000000000,
  *   gasLimit: 4100000
  * },
  */
  development: {

  },
  ropsten: {

  },
  mainnet: {

  }
}

const expProperties = Object.assign(defaultProperties, properties)
module.exports = expProperties