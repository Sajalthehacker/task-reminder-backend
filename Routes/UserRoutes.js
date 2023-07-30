const express = require('express');
const { loginController, registerController, getCurrentUserData, forgotPasswordController, resetPasswordController, changeResetPasswordController, verifyEmailController, resendOtpController, verifyEmailResetController } = require('../Controllers/UserController');
const Router = express.Router()

Router.post('/login', loginController);
Router.post('/register', registerController);
Router.get('/get-data', getCurrentUserData);
Router.post('/forgot-password', forgotPasswordController);
Router.post('/reset-password', changeResetPasswordController)
Router.post('/verifyEmail', verifyEmailController)
Router.post('/verifyEmailReset', verifyEmailResetController);
Router.post('/resendOtp', resendOtpController)

module.exports = Router