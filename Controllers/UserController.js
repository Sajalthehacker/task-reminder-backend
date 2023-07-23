const UserModel = require('../Models/UserModel')
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
}

// if token is expired after 1 day then getCurrentUserData() controller will not be able to fetch the data 

const getCurrentUserData = async (req, res) => {
    const { token } = req.body;

    try {
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
};


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

            return res.json({
                status: "LOGIN_SUCCESSFUL",
                name: isUserExists.name,
                email: isUserExists.email,
                isEmailVerified: isUserExists.isEmailVerified,
                isLoggedIn: isUserExists.isLoggedIn,
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
};


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
                message: "AA account already exists with this email please try a new email or proceed to login"
            })
        }

        const encryptedPassword = await bcryptjs.hash(password, 10);

        const newUser = await UserModel.create({
            name: name,
            email: email,
            password: encryptedPassword
        })

        if (newUser) {
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

        const forgotSecret = process.env.JWT_SECRET + isUserExists.password;
        const forgotToken = jwt.sign({ email: isUserExists.email, id: isUserExists._id }, forgotSecret, {
            expiresIn: "10m"
        })

        const forgotPasswordLink = `http://localhost:5000/api/user/reset-password/${isUserExists._id}/${forgotToken}`

        res.send(forgotPasswordLink)

    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

const resetPasswordController = async (req, res) => {
    const { id, token } = req.params
    const isUserExists = await UserModel.findOne({ _id: id });

    if (!isUserExists) {
        return res.json({
            status: "NO_ACCOUNT_EXISTS",
            message: "No Account Exists with this email address please enter valid email address or proceed to SignUp page"
        })
    }

    const forgotSecret = process.env.JWT_SECRET + isUserExists.password;
    try {
        const isTokenValid = jwt.verify(token, forgotSecret, (err, data) => {
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
        })

        return res.json({
            status: isTokenValid.status,
            message: isTokenValid.message
        })
    }
    catch (error) {
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

module.exports = { loginController, registerController, getCurrentUserData, forgotPasswordController, resetPasswordController }

// for logout functionality -> firstly delete the token and redirect/navigate to /login route

// keep user logged in/ stay logged in
// using local storage isLoggedin property 