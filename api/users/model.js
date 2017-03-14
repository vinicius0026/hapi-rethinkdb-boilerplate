/*
  This is a fake implementation, with json + memory database stub, not suitable
  for use in production. Replace this with a real database connection and
  lookups and don't forget to secure user's passwords and to remove
  sensitive data like salt and password hash when returning users from this file
*/

'use strict'

const Boom = require('boom')
const Joi = require('joi')

const internals = {}

internals.model = {
  id: Joi.number().min(0),
  username: Joi.string().min(3).max(50).description('User\'s username, used for login'),
  password: Joi.string().min(3).max(50).description('User\'s password, used for login'),
  scope: Joi.array().items(Joi.string().valid('user', 'admin'))
    .description('User\'s role, used for determining what the user will be able to do in the system')
}

module.exports = function (_di) {
  const di = _di || {}

  Object.assign(internals, di)

  return {
    getValidatedUser,
    model: internals.model,
    create,
    read,
    update,
    remove,
    list
  }
}

function create (data) {
  const { r } = internals

  return r.table('users').filter({ username: data.username }).run()
    .then(users => {
      if (users.length) {
        return Promise.reject(Boom.badRequest('Username already taken'))
      }
    })
    .then(() => r.table('users').insert(data).run())
    .then(result => {
      return Promise.resolve(result.generated_keys[0])
    })
}

function read (id) {
  return internals.r.table('users').get(id).pluck('id', 'username', 'scope').run()
    .catch(err => {
      if (err.message.match(/^Cannot perform pluck on a non-object non-sequence `null`/)) {
        return Promise.reject(Boom.notFound('User not found'))
      }
      throw err
    })
}

function update (id, data) {
  return internals.r.table('users').get(id).update(data, { returnChanges: true }).run()
    .then(result => {
      if (result.skipped === 1) {
        return Promise.reject(Boom.notFound('User not found'))
      }
      return Promise.resolve(result.changes[0].new_val)
    })
}

function remove (id) {
  return new Promise((resolve, reject) => {
    const index = internals.db.findIndex(user => user.id === Number(id))

    if (index < 0) {
      return reject(Boom.notFound('User not found'))
    }

    internals.db.splice(index, 1)
    resolve()
  })
}

function list () {
  return internals.r.table('users').withFields('id', 'username', 'scope').run()
}

function getValidatedUser (username, password) {
  return new Promise((resolve, reject) => {
    const user = internals.db.find(user => user.username === username)

    if (!user) {
      return resolve()
    }

    // Replace this for a constant time criptographic comparison of passwords
    if (password === user.password) {
      // removing sensitive information from user object
      const _user = Object.assign({}, user)
      delete _user.password
      return resolve(user)
    }

    resolve()
  })
}
