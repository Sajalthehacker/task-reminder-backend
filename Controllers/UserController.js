const UserModel = require('../Models/UserModel')
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const nodemailer = require('nodemailer')
const EmailVerifyModel = require('../Models/EmailVerifyModel')
const ReminderModel = require('../Models/ReminderModel')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
}

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD
    }
});

// if token is expired after 1 day then getCurrentUserData() controller will not be able to fetch the data 

const getCurrentUserData = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.json({
                status: "TOKEN_MISSING",
                message: "No token provided in the request headers."
            });
        }
        const isTokenCorrect = jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                return {
                    status: "TOKEN_EXPIRED",
                    message: err
                }
            }
            return {
                status: "TOKEN_VALID",
                message: data
            }
        });

        if (isTokenCorrect.status === "TOKEN_EXPIRED") {
            return res.json({
                status: "TOKEN_EXPIRED",
                message: isTokenCorrect.message
            })
        }

        const userID = isTokenCorrect.message.id;

        const dbdata = await UserModel.findOne({ _id: userID });

        if (dbdata) {
            return res.json({
                status: "DATA_FETCHED_SUCCESSFULLY",
                data1: dbdata,
                data2: isTokenCorrect,
            });
        } else {
            return res.json({
                status: "INVALID_TOKEN",
                data1: dbdata,
                data2: isTokenCorrect,
            });
        }
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message,
        });
    }
}

const loginController = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({
            status: "EMPTY_CREDENTIALS",
            message: "PLEASE ENTER VALID / NOT NULL EMAIL, PASSWORD",
        });
    }

    try {
        const isUserExists = await UserModel.findOne({ email });

        if (!isUserExists) {
            return res.json({
                status: "NO_ACCOUNT_EXISTS",
                message: "Sorry !! No account exists with this email id please first create an account and then proceed to login",
            });
        }

        const isPasswordCorrect = await bcryptjs.compare(password, isUserExists.password);

        if (isPasswordCorrect) {
            const token = generateToken(isUserExists._id);
            await UserModel.findOneAndUpdate({ email: email }, { isLoggedIn: true, isEmailVerified: true });
            const v1 = true;
            
            return res.json({
                status: "LOGIN_SUCCESSFULL",
                name: isUserExists.name,
                email: isUserExists.email,
                isEmailVerified: isUserExists.isEmailVerified,
                isLoggedIn: v1,
                token: token,
            });
        } else {
            return res.json({
                status: "PASSWORD_NOT_MATCHED",
                message: "Sorry !! You entered an incorrect password. Please enter the correct password or try resetting the password.",
            });
        }
    } catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message,
        });
    }
}

const registerController = async (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
        return res.json({
            status: "EMPTY_CREDENTIALS",
            message: "PLEASE ENTER VALID / NOT NULL NAME, EMAIL, PASSWORD"
        })
    }

    try {
        const isUserAlreadyExists = await UserModel.findOne({ email });

        if (isUserAlreadyExists) {
            return res.json({
                status: "EMAIL_ALREADY_EXISTS",
                message: "A account already exists with this email please try a new email or proceed to login"
            })
        }

        const encryptedPassword = await bcryptjs.hash(password, 10);

        const newUser = await UserModel.create({
            name: name,
            email: email,
            password: encryptedPassword
        })

        if (newUser) {
            sendOtpVerificationEmail(newUser.email)
            return res.json({
                status: "REGISTRATION_SUCCESSFUL",
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                isEmailVerified: newUser.isEmailVerified,
                isLoggedIn: newUser.isLoggedIn,
            })
        }
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const forgotPasswordController = async (req, res) => {
    const { email } = req.body

    try {
        const isUserExists = await UserModel.findOne({ email });

        if (!isUserExists) {
            return res.json({
                status: "NO_ACCOUNT_EXISTS",
                message: "No Account Exists with this email address please enter valid email address or proceed to SignUp page"
            })
        }

        await sendOtpVerificationEmail(email)

        return res.json({
            status: "SUCCESSFULL",
            message: "A Otp is sent to your email address please use it to verify your email Note : This otp is valid only for 10 minutes"
        })
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const changeResetPasswordController = async (req, res) => {
    const { email, password } = req.body
    const isUserExists = await UserModel.findOne({ email: email });

    if (!isUserExists) {
        return res.json({
            status: "NO_ACCOUNT_EXISTS",
            message: "No Account Exists with this email address please enter valid email address or proceed to SignUp page"
        })
    }

    try {
        const encryptedPassword = await bcryptjs.hash(password, 10);
        UserModel.updateOne({
            email: email
        },
            {
                $set: {
                    password: encryptedPassword
                }
            }
        ).then(() => {
            return res.json({
                status: "PASSWORD_CHANGED_SUCCESSFULLY",
                message: "your password is changes successfully is our database and you can now proceed to login page "
            })
        }).catch(() => {
            return res.json({
                status: "ERROR_IN_CHANGING_PASSWORD",
                message: "some error in changing the password please try after some time"
            })
        })
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const sendOtpVerificationEmail = async (email) => {
    try {
        const OTP = `${Math.floor(Math.random() * 900000 + 100000)}`

        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: "Please Verify Your Email Address [Team DatesInfomer]",
            html: `<p>Enter <b> ${OTP} </b> in the website and complete the Sign Up Process. the above is valid for <b> 10 minutes </b></p>`
        }

        const encryptedOTP = await bcryptjs.hash(OTP, 10)

        const newEmailVerificationData = await EmailVerifyModel.create({
            email: email,
            otp: encryptedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000
        })

        await mailTransporter.sendMail(mailOptions)
        return {
            status: "SUCCESS",
            message: "Message Sent SuccessFully",
            data: {
                email: email
            }
        }
    }
    catch (error) {
        return {
            status: "FAILED",
            message: error.message
        }
    }
}

const verifyEmailController = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.json({
                status: "EMPTY_CREDENTIALS",
                message: "PLEASE ENTER VALID / NOT NULL EMAIL AND OTP"
            })
        }

        const emailVerifyRecord = await EmailVerifyModel.findOne({ email: email })
        if (!emailVerifyRecord) {
            return res.json({
                status: "EMAIL_ALREADY_VERIFIED",
                message: "Email has been already verified or no account exists with this email please proceed to sign up of login page"
            })
        }

        const expiresAt = emailVerifyRecord.expiresAt
        const encryptedOTP = emailVerifyRecord.otp

        if (expiresAt < Date.now()) {
            await emailVerifyRecord.deleteMany({
                email: email
            })
            return res.json({
                status: "OTP_EXPIRED",
                message: "The entered otp is expired please request a new otp by clicking on resend otp"
            })
        }

        const isOtpValid = await bcryptjs.compare(otp, encryptedOTP)

        if (!isOtpValid) {
            return res.json({
                status: "INVALID_OTP",
                message: "OTP is invalid. Please Enter Correct OTP "
            })
        }

        else {
            await UserModel.updateMany({ email: email }, {
                isEmailVerified: true,
                isLoggedIn: true
            })
            await EmailVerifyModel.deleteMany({ email: email })
            const UpdatedUserDetails = await UserModel.findOne({ email: email })

            return res.json({
                status: "VERIFICATION_SUCCESSFULL",
                message: "your email has been verified successfully you can now proceed to home page",
                data: {
                    name: UpdatedUserDetails.name,
                    email: UpdatedUserDetails.email,
                    isEmailVerified: UpdatedUserDetails.isEmailVerified,
                    isLoggedIn: UpdatedUserDetails.isLoggedIn
                }
            })
        }
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const resendOtpController = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.json({
                status: "EMPTY_CREDENTIALS",
                message: "PLEASE ENTER VALID / NOT NULL EMAIL"
            })
        }

        await EmailVerifyModel.deleteMany({ email: email })
        sendOtpVerificationEmail(email)

        return res.json({
            status: "RESENT_SUCCESSFULL",
            message: "new otp is sent to your email successfully"
        })
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const verifyEmailResetController = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.json({
                status: "EMPTY_CREDENTIALS",
                message: "PLEASE ENTER VALID / NOT NULL EMAIL AND OTP"
            })
        }

        const emailVerifyRecord = await EmailVerifyModel.findOne({ email: email })
        if (!emailVerifyRecord) {
            return res.json({
                status: "EMAIL_ALREADY_VERIFIED",
                message: "Email has been already verified or no account exists with this email please proceed to sign up of login page"
            })
        }

        const expiresAt = emailVerifyRecord.expiresAt
        const encryptedOTP = emailVerifyRecord.otp

        if (expiresAt < Date.now()) {
            await EmailVerifyModel.deleteMany({
                email: email
            })
            return res.json({
                status: "OTP_EXPIRED",
                message: "The entered otp is expired please request a new otp by clicking on resend otp"
            })
        }

        const isOtpValid = await bcryptjs.compare(otp, encryptedOTP)

        if (!isOtpValid) {
            return res.json({
                status: "INVALID_OTP",
                message: "OTP is invalid. Please Enter Correct OTP "
            })
        }

        else {
            await EmailVerifyModel.deleteMany({ email: email })
            const UpdatedUserDetails = await UserModel.findOne({ email: email })

            return res.json({
                status: "VERIFICATION_SUCCESSFULL",
                message: "your email has been verified successfully you can now proceed to reset your password",
                data: {
                    name: UpdatedUserDetails.name,
                    email: UpdatedUserDetails.email
                }
            })
        }
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const logOutController = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({
            status: "EMPTY_CREDENTIALS",
            message: "Please enter a valid email.",
        });
    }

    try {
        const isUserAlreadyExists = await UserModel.findOne({ email });

        if (!isUserAlreadyExists) {
            return res.json({
                status: "NO_ACCOUNT_EXIST",
                message:"Sorry! No account exists with the provided email address"
            })
        }

        // if user exists
        UserModel.updateOne({ email: email }, {
            $set: {
                isLoggedIn: false
            }
        }).then(() => {
            return res.json({
                status: "LOGOUT_SUCCESS",
                message: "user logged out successfully"
            })
        }).catch((err) => {
            return res.json({
                status: "LOGOUT_FAILURE",
                message: err.message
            })
        })
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const deleteUserController = async (req, res) => {
    const { email } = req.body; 

    if (!email) {
        return res.json({
            status: "INVALID_REQUEST",
            message: "Please provide an email to delete the user"
        });
    }

    try {
        // Delete user from UserModel
        const isUserExists = await UserModel.findOne({ email: email});
        if (isUserExists){
            await UserModel.deleteOne({ email: email });
        }
        
        // Delete user's reminders from ReminderModel
        const isReminderExists = await ReminderModel.findOne({ email: email});
        if(isReminderExists){
            await ReminderModel.deleteMany({ email: email });
        }
        return res.json({
            status: "USER_DELETED_SUCCESSFULLY",
            message: "User and associated data deleted successfully"
        });
    } catch (err) {
        console.log(err);
        return res.json({
            status: "ERROR_OCCURED",
            message: err.message
        });
    }
};

module.exports = { loginController, registerController, getCurrentUserData, forgotPasswordController, changeResetPasswordController, verifyEmailController, resendOtpController, verifyEmailResetController, logOutController, deleteUserController }

// for logout functionality -> firstly delete the token and redirect/navigate to /login route

// keep user logged in/ stay logged in
// using local storage isLoggedin property 