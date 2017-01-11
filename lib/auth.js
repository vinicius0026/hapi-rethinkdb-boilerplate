'use strict'

const Boom = require('boom')
const Joi = require('joi')

const Config = require('./config')

const internals = {}

exports.register = function (server, options, next) {
  internals.getValidatedUser = options.getValidatedUser
  server.dependency('hapi-auth-cookie', internals.setupAuth)
  next()
}

exports.register.attributes = {
  name: 'Auth'
}

internals.setupAuth = function (server, next) {
  server.auth.strategy('session', 'cookie', {
    password: Config.get('/cookieSecret'),
    cookie: 'hapi-cookie',
    ttl: 24 * 60 * 60 * 1000,
    isSecure: false
  })

  server.auth.default({
    strategy: 'session',
    scope: 'admin'
  })

  server.route([
    {
      method: 'POST',
      path: '/login',
      config: {
        auth: false,
        description: 'Login endpoint. Returns authentication cookie and creates session in server',
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().min(2).max(50).required()
          }
        },
        handler: (request, reply) => {
          internals.getValidatedUser(request.payload.username, request.payload.password)
            .then(user => {
              if (!user) {
                return reply(Boom.unauthorized('Bad email or password'))
              }

              request.cookieAuth.set(user)
              reply({ ok: true, message: 'login successful' })
            })
        }
      }
    },
    {
      method: 'GET',
      path: '/logout',
      config: {
        auth: {
          access: {
            scope: ['user', 'admin']
          }
        },
        description: 'Logout endpoint. Destroys server session and erases cookie',
        handler: (request, reply) => {
          request.cookieAuth.clear()
          reply({ ok: true, message: 'logout successful' })
        }
      }
    }
  ])

  next()
}
