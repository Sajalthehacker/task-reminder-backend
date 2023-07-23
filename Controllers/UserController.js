const UserModel = require('../Models/UserModel')
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "2d",
    });
}

const getCurrentUserData = async (req, res) => {
    const { token } = req.body;

    try {
        const isTokenCorrect = jwt.verify(token, process.env.JWT_SECRET);
        const userID = isTokenCorrect.id;

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
    } catch (error) {
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
        console.log(error.message)
        return res.json({
            status: "ERROR_OCCURED",
            message: error.message
        })
    }
}

module.exports = { loginController, registerController, getCurrentUserData }