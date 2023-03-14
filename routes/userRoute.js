const userController = require("../controllers/userController")
const shopController = require("../controllers/shopController")
const auth = require("../middlewares/auth")
const express = require('express')
const user_route = express()

user_route.set('views', './views/users')

user_route.get('/',shopController.loadLandingPage)

user_route.get('/signup',userController.loadSignup)

user_route.post('/signup',userController.sendRegisterOtp)

user_route.get('/verify',userController.loadEnterOtp)

user_route.post('/verify',userController.verifyOtpAndSave)

user_route.get('/login',auth.isLogout,userController.loadLogin)

user_route.post('/login',userController.verifyLogin)

user_route.get('/forgot',userController.forgetLoad)

user_route.post('/forgot',userController.forgetVerify)

user_route.get('/reset_password',userController.resetPasswordLoad)

user_route.post('/reset_password',userController.resetPassword)

user_route.get('/login_with_otp',userController.loadLoginWithOtp)

user_route.post('/login_with_otp',userController.otpGeneration)

user_route.get('/otp_verify',userController.loadEnterOtp)

user_route.post('/otp_verify',userController.otpVerification)

user_route.get('/contact',shopController.loadContact)

user_route.post('/contact',shopController.submitContactForm)

user_route.get('/profile',auth.isLogin,userController.loadProfile)

user_route.get('/profile_edit',auth.isLogin,userController.loadEditProfilePage)

user_route.post('/profile_edit',userController.updateUserDeatails)

user_route.get('/usraddress',auth.isLogin,userController.loadAddress)

user_route.get('/new_address',auth.isLogin,userController.loadAddNewAddress)

user_route.post('/new_address',userController.updateNewAdress)

user_route.get('/edit_address',auth.isLogin,userController.loadEditAddress)

user_route.post('/edit_address',userController.editAddress)

user_route.get('/delete_address',auth.isLogin,userController.deleteAddress)

user_route.get('/shop',shopController.loadProductPage)

user_route.get('/product',shopController.loadSingleProduct)

user_route.post('/add-wishlist',auth.isLogin ,shopController.addToWishList)

user_route.get('/wishlist',auth.isLogin,shopController.loadWishList)

user_route.get('/remove-wishlist',auth.isLogin ,shopController.removeFromWishlist)

user_route.get('/cart-to-wishlist',auth.isLogin,shopController.cartAddWishlist)

user_route.get('/add-cart',auth.isLogin ,shopController.addingToCart)

user_route.get('/remove-cart',auth.isLogin ,shopController.removeFromCart)

user_route.get('/cart',auth.isLogin ,shopController.loadCart)

user_route.post('/change-product-quantity', shopController.changeQuantity)

user_route.post('/apply-code', shopController.applyCouponCode)

user_route.get('/checkout',auth.isLogin,shopController.loadCheckOutPage)

user_route.post('/checkout_address',auth.isLogin,shopController.saveCheckOutAddress)

user_route.post('/checkout',auth.isLogin,shopController.orderplaced)

user_route.get('/order_placed',auth.isLogin,shopController.loadOrderPlacedPage)

user_route.post('/verify-payment',auth.isLogin,shopController.verifyPayment)

user_route.get('/orders',auth.isLogin,shopController.loadUserOrders)

user_route.get('/order-view',auth.isLogin,shopController.loadSingleOrderDetails)

user_route.get('/cancel-order',auth.isLogin,shopController.cancelOrder)

user_route.get('/return-order',auth.isLogin,shopController.returnOrder)

user_route.get('/logout',auth.isLogin,userController.userLogout)

user_route.get('*', function (req, res) {
    res.render('404')
})

module.exports = user_route