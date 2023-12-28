const express = require('express');
const { loginController, registerController, getCurrentUserData, forgotPasswordController, changeResetPasswordController, verifyEmailController, resendOtpController, verifyEmailResetController, logOutController, deleteUserController } = require('../Controllers/UserController');
const Router = express.Router()

Router.post('/login', loginController);
Router.post('/register', registerController);
Router.get('/get-data', getCurrentUserData);
Router.post('/forgot-password', forgotPasswordController);
Router.post('/reset-password', changeResetPasswordController)
Router.post('/verifyEmail', verifyEmailController)
Router.post('/verifyEmailReset', verifyEmailResetController);
Router.post('/resendOtp', resendOtpController)
Router.post('/logout', logOutController)
Router.post('/deleteUser', deleteUserController)

module.exports = Router