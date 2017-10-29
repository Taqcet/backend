module.exports = {
  development: {
    client: 'pg',
    debug: false,
    connection: {
      host: "localhost",
      database: 'taqcet'
    }
  },
  production: {
    client: 'pg',
    debug: false,
    connection: {
      host: "188.226.145.225",
      database: 'affiliation',
      user:"brantu_app",
      password:"elbrices2017"
    }
  },
}
