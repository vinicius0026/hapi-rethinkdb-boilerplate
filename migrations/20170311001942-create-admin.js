'use strict'

exports.up = function (r, connection) {
  return r.table('users').insert({
    username: 'admin',
    password: 'p4$$w0Rd',
    scope: ['user', 'admin']
  })
}

exports.down = function (r, connection) {
  return Promise.resolve()
}
