const express = require('express');
const { loginController, registerController, getCurrentUserData, forgotPasswordController, resetPasswordController, changeResetPasswordController, verifyEmailController, resendOtpController } = require('../Controllers/UserController');
const Router = express.Router()

Router.post('/login', loginController);
Router.post('/register', registerController);
Router.get('/get-data', getCurrentUserData);
Router.post('/forgot-password', forgotPasswordController);
Router.get('/reset-password/:id/:token', resetPasswordController)
Router.post('/reset-password/:id/:token', changeResetPasswordController)
Router.post('/verifyEmail', verifyEmailController);
Router.post('/resendOtp', resendOtpController)

module.exports = Router