'use strict';

const User = require('../models/user');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');

const Accounts = {
    index: {
        auth: false,
        handler: function(request, h) {
            return h.view('main', { title: 'Welcome to Donations' });
        }
    },

    showSignup: {
        auth: false,
        handler: function(request, h) {
            return h.view('signup', { title: 'Sign up for Donations' });
        }
    },

    signup: {
        auth: false,
        validate: {
            payload: {
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string()
                    .email()
                    .required(),
                password: Joi.string().required()
            },
            options: {
                abortEarly: false
            },
            failAction: function(request, h, error) {
                return h
                    .view('signup', {
                        title: 'Sign up error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },
        handler: async function (request, h) {
            const payload = request.payload;
            const previousUser = await User.findByEmail(payload.email);
            try {
                if (!previousUser) {
                    const newUser = new User({
                        firstName: payload.firstName,
                        lastName: payload.lastName,
                        email: payload.email,
                        password: payload.password
                    });
                    const user = await newUser.save();
                    request.cookieAuth.set({id: user.id});
                    return h.redirect('/home');
                } else {
                    const message = 'Email address is already in use!';
                    throw Boom.badData(message);
                }
            }
        catch (err) {
                return h.view('signup', { errors: [{ message: err.message }] });
            }
        }
    },


    showSettings: {
        handler: async function(request, h) {
            try {
                const id = request.auth.credentials.id;
                const user = await User.findById(id).lean();
                return h.view('settings', {title: 'Settings', user: user});
            }
        catch (err) {
                return h.view('login', { errors: [{ message: err.message }] });
        }
    }
    },

    settings: {
            validate: {
                payload: {
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                    email: Joi.string()
                        .email()
                        .required(),
                    password: Joi.string().required()
                },
                options: {
                    abortEarly: false
                },
                failAction: function(request, h, error) {
                    return h
                        .view('settings', {
                            title: 'Sign up error',
                            errors: error.details
                        })
                        .takeover()
                        .code(400);
                }
            },
        handler: async function(request, h) {
            try {
                const userEdit = request.payload;
                const id = request.auth.credentials.id;
                const user = await User.findById(id);
                user.firstName = userEdit.firstName;
                user.lastName = userEdit.lastName;
                user.email = userEdit.email;
                user.password = userEdit.password;
                await user.save();
                return h.redirect('/settings');
            }
            catch (err) {
                return h.view('settings', { errors: [{ message: err.message }] });
            }
        }
    },


    showLogin: {
        auth: false,
        handler: function(request, h) {
            return h.view('login', { title: 'Login to Donations' });
        }
    },

    login: {
        auth: false,
        validate: {
            payload: {
                email: Joi.string()
                    .email()
                    .required(),
                password: Joi.string().required()
            },
            options: {
                abortEarly: false
            },
            failAction: function(request, h, error) {
                return h
                    .view('login', {
                        title: 'Log in error',
                        errors: error.details
                    })
                    .takeover()
                    .code(400);
            }
        },
        handler: async function(request, h) {
            const { email, password } = request.payload;
            try {
                let user = await User.findByEmail(email);
                if (!user) {
                    const message = 'Email address is not registered';
                    throw Boom.unauthorized(message);
                }
                user.comparePassword(password);
                request.cookieAuth.set({ id: user.id });
                return h.redirect('/home');
            } catch (err) {
                return h.view('login', { errors: [{ message: err.message }] });
            }
        }
    },



    logout: {
        handler: function(request, h) {
            request.cookieAuth.clear();
            return h.redirect('/');
        }
    }
};

module.exports = Accounts;