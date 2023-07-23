const express = require('express');
const { loginController, registerController, getCurrentUserData } = require('../Controllers/UserController');
const Router = express.Router()

Router.post('/login', loginController);
Router.post('/register', registerController);
Router.get('/getData', getCurrentUserData)

module.exports = Router