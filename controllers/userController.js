const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const bcrypt = require('bcrypt')
const randormString = require("randomstring")
const nodemailer = require("nodemailer")
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken);

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadSignup = async (req, res, next) => {
    try {
        res.render("signup")
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const sendRegisterOtp = async (req, res, next) => {
    try {
        const checkExist = await User.findOne({ mobile: req.body.phone })
        if (checkExist) {
            res.render('signup', { exist: "Number Already Registered, Please Login" })
        } else {
            req.session.userData = req.body
            client.verify.v2.services('VA5cbb1853d0d0df5ffde3e55a126dd812')
                .verifications
                .create({ to: '+91' + req.body.phone, channel: "sms" })
                .then((verification) => console.log(verification.status))
            req.session.mobile = req.body.phone
            res.redirect('/verify')
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadEnterOtp = async (req, res, next) => {
    try {
        if (req.session.mobile) {
            res.render('enter-otp')
        } else {
            res.render('404')
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const verifyOtpAndSave = async (req, res, next) => {

    try {
        client.verify.v2.services('VA5cbb1853d0d0df5ffde3e55a126dd812')
            .verificationChecks
            .create({ to: '+91' + req.session.userData.phone, code: req.body.otp })
            .then((verification) => {
                if (verification.status === "approved") {
                    console.log(verification.status);
                    (async () => {
                        const spassword = await securePassword(req.session.userData.password);
                        const user = new User({
                            name: req.session.userData.name,
                            email: req.session.userData.email,
                            mobile: req.session.userData.phone,
                            password: spassword,
                            is_verified: 1
                        })
                        const userData = await user.save()
                        if (userData) {
                            req.session.user_id = userData._id
                            res.redirect('/')
                        } else {
                            res.sendStatus(404)
                        }
                    })()
                } else {
                    res.render('enter-otp', { message: " Incorrect otp" })
                }
            })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadLogin = async (req, res, next) => {
    try {
        res.render("login")
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const verifyLogin = async (req, res, next) => {

    try {
        const mobile = req.body.mobile
        const password = req.body.password
        const userData = await User.findOne({ mobile: mobile })

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_blocked === 0) {
                    req.session.user_id = userData._id
                    res.redirect('/')
                } else {
                    res.render('login', { message: "You were Blocked" })
                }
            } else {
                res.render('login', { message: "Phone or Password is incorrect" })
            }
        } else {
            res.render('login', { message: "Phone or Password is incorrect" })
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const forgetLoad = async (req, res, next) => {
    try {
        res.render('forgot')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const sendResetPasswordMail = async (name, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.email,
                pass: process.env.emailPass
            }
        })
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: 'Reset Your Password From New look Fashion',
            html: '<p> Hii  ' + name + ' , please click here to  <a href="http://localhost:3000/reset_password?token=' + token + ' " >Reset  </a> your Password.</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent:- ", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const forgetVerify = async (req, res, next) => {
    try {
        const email = req.body.email
        const userData = await User.findOne({ email: email })
        if (userData) {
            if (userData.is_verified === 0) {
                res.render('forgot', { message: "Please Verify your Mail" })
            } else {
                const randomString = randormString.generate()
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
                sendResetPasswordMail(userData.name, userData.email, randomString)
                res.render('forgot', { successmessage: "Please Check your mail" })
            }
        } else {
            res.render('forgot', { message: "Email is incorrect" })
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const resetPasswordLoad = async (req, res, next) => {

    try {
        const token = req.query.token
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {
            res.render('reset-password', { user_id: tokenData._id })
        } else {
            res.render('error')
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const password = req.body.password
        const user_id = req.body.user_id
        const secure_pass = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_pass, token: '' } })
        res.redirect("/login")
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadLoginWithOtp = async (req, res, next) => {
    try {
        res.render('otp-login')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const otpGeneration = async (req, res, next) => {
    try {
        const mobile_No = req.body.phone
        const userData = await User.findOne({ mobile: mobile_No })

        if (userData) {
            client.verify.v2.services('VA5cbb1853d0d0df5ffde3e55a126dd812')
                .verifications

                .create({ to: '+91' + mobile_No, channel: "sms" })
                .then((verification) => console.log(verification.status))
            req.session.mobile = req.body.phone
            res.redirect('/otp_verify')
        } else {
            res.render('otp-login', { message: "Your Number is not Registered" })
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const otpVerification = async (req, res, next) => {

    try {
        const userData = await User.findOne({ mobile: req.session.mobile })
        client.verify.v2.services('VA5cbb1853d0d0df5ffde3e55a126dd812')
            .verificationChecks
            .create({ to: '+91' + req.session.mobile, code: req.body.otp })
            .then((verification) => {
                if (verification.status === "approved") {
                    console.log(verification.status)
                    req.session.user_id = userData._id
                    res.redirect('/')
                } else {
                    res.render('enter-otp', { message: " Incorrect otp" })
                }
            })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadProfile = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        res.render('profile', { user, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadEditProfilePage = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        res.render('edit-Profile', { user, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const updateUserDeatails = async (req, res, next) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { name: req.body.name, email: req.body.email } })
        const address = {
            name: req.body.addressname,
            pincode: req.body.pin,
            landmark: req.body.landmark,
            address: req.body.address,
            mobile: req.body.mobile
        }
        if (req.body.addressname) {
            const userData = await User.findByIdAndUpdate({ _id: req.body.user_id }, { $set: { "address.0": address } })
        }
        res.redirect('/profile')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadAddress = async (req, res, next) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        res.render('address-section', { user, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}
const loadAddNewAddress = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        res.render('add-address', { user, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const updateNewAdress = async (req, res, next) => {

    try {
        const address = {
            name: req.body.name,
            pincode: req.body.pincode,
            landmark: req.body.landmark,
            address: req.body.address,
            mobile: req.body.phone
        }
        const userData = await User.findByIdAndUpdate(
            { _id: req.session.user_id }, { $push: { address: { ...address } } })
        if (userData) {
            res.redirect('/usraddress')
        } else {
            res.sendStatus(404)
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadEditAddress = async (req, res, next) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        const userAddress = user.address
        const editingAddress = userAddress.find(obj => obj._id == req.query.id);
        res.render('edit-address', { user, editingAddress, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const editAddress = async (req, res, next) => {
    try {
        const updated = await User.updateOne({ _id: req.session.user_id, 'address._id': req.query.id },
            {
                $set: {
                    'address.$.name': req.body.name,
                    'address.$.pincode': req.body.pincode,
                    'address.$.landmark': req.body.landmark,
                    'address.$.address': req.body.address,
                    'address.$.mobile': req.body.phone
                }
            })
        res.redirect('/usraddress')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const deleteAddress = async (req, res, next) => {
    try {
        const remove = await User.findByIdAndUpdate(
            { _id: req.session.user_id }, { $pull: { address: { _id: req.query.addressid } } })
        res.redirect('/usraddress')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const userLogout = async (req, res, next) => {

    try {
        delete req.session.user_id
        res.redirect('/login')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

module.exports = {

    loadSignup,
    sendRegisterOtp,
    loadEnterOtp,
    verifyOtpAndSave,
    loadLogin,
    verifyLogin,
    forgetLoad,
    forgetVerify,
    resetPasswordLoad,
    resetPassword,
    loadLoginWithOtp,
    otpGeneration,
    otpVerification,
    loadProfile,
    loadEditProfilePage,
    updateUserDeatails,
    loadAddress,
    loadAddNewAddress,
    updateNewAdress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    userLogout,
}