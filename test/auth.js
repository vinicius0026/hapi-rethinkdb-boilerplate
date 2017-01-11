'use strict'

const Code = require('code')
const Lab = require('lab')
const Path = require('path')

const lab = exports.lab = Lab.script()
const describe = lab.experiment
const expect = Code.expect
const it = lab.test

const Server = require('../lib')
const UserModel = require('../api/users/model')()

const internals = {}

internals.User = require('../api/users/users.json')

describe('Auth', () => {
  it('allows user to authenticate via POST /login', done => {
    let server

    Server.init(internals.manifest, internals.composeOptions)
      .then(_server => {
        server = _server

        const admin = internals.User[0]

        return server.inject({
          method: 'POST',
          url: '/login',
          payload: {
            username: admin.username,
            password: admin.password
          }
        })
      })
      .then(res => {
        expect(res.statusCode).to.equal(200)
        server.stop(done)
      })
      .catch(done)
  })

  it('returns 401 if wrong password is used', done => {
    let server
    Server.init(internals.manifest, internals.composeOptions)
      .then(_server => {
        server = _server

        const admin = internals.User[0]

        return server.inject({
          method: 'POST',
          url: '/login',
          payload: {
            username: admin.username,
            password: 'wrong-pass'
          }
        })
      })
      .then(res => {
        expect(res.statusCode).to.equal(401)
        server.stop(done)
      })
      .catch(done)
  })

  it('returns 401 if user doesn exist', done => {
    let server
    Server.init(internals.manifest, internals.composeOptions)
      .then(_server => {
        server = _server

        return server.inject({
          method: 'POST',
          url: '/login',
          payload: {
            username: 'non-user',
            password: 'doent matter'
          }
        })
      })
      .then(res => {
        expect(res.statusCode).to.equal(401)
        server.stop(done)
      })
      .catch(done)
  })

  it('logs user out when logged user requests GET /logout', done => {
    let server
    Server.init(internals.manifest, internals.composeOptions)
      .then(_server => {
        server = _server

        const admin = internals.User[0]

        return server.inject({
          method: 'POST',
          url: '/login',
          payload: {
            username: admin.username,
            password: admin.password
          }
        })
        .then(res => {
          const cookie = internals.getCookieFromResponse(res)

          return server.inject({
            url: '/logout',
            headers: { cookie }
          })
        })
        .then(res => {
          expect(res.statusCode).to.equal(200)
          server.stop(done)
        })
        .catch(done)
      })
  })
})

internals.getCookieFromResponse = res => {
  const header = res.headers['set-cookie']
  /* eslint-disable */
  const cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)
  /* eslint-enable */
  return cookie[0]
}

internals.manifest = {
  connections: [
    { port: 0 }
  ],
  registrations: [
    { plugin: { register: './lib/auth', options: { getValidatedUser: UserModel.getValidatedUser } } },
    { plugin: 'hapi-auth-cookie' }
  ]
}

internals.composeOptions = {
  relativeTo: Path.resolve(__dirname, '..')
}
