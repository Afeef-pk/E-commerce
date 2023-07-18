const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const User = require('../models/userModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const Wishlist = require('../models/wishlistModel')
const nodemailer = require("nodemailer")
const { ObjectId } = require('mongodb')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const instance = new Razorpay({
    key_id: process.env.razorpayKeyId,
    key_secret: process.env.razorpayKeySecret,
});

const loadLandingPage = async (req, res, next) => {
    try {
        const categoryData = await Category.find()
        const userData = req.session.user_id
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const product = await Product.find({ disabled: false }).populate('category')
        res.render("landingPage", { product, userData, userCart, wishlist, categoryData })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadProductPage = async (req, res, next) => {
    try {
        const categoryData = await Category.find({})
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const userData = req.session.user_id
        const category = (req.query.categoryId)
        const search = (req.query.search) || "";
        const sort = (req.query.sort) || "";
        let isRender = false;
        if (req.query.isRender) {
            isRender = true
        }
        const searchData = new String(search).trim()
        const query = {
            disabled: false,
        }
        let sortQuery = null
        if (sort == '-1') {
            sortQuery = { price: -1 }
        } else if (sort == '1') {
            sortQuery = { price: 1 }
        }
        if (search) {
            query["$or"] = [
                { name: { $regex: ".*" + searchData + ".*", $options: "i" } }
            ];
        }
        if (category) {
            query["$or"] = [
                { category: { $in: category } }
            ];
        }
        const product = await Product.find(query).sort(sortQuery)
        const productsPerPage = 8;
        const page = req.query.page || 1;
        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const products = product.slice(startIndex, endIndex);
        const totalPages = Math.ceil(product.length / productsPerPage);
        if (isRender == true) {
            res.json({
                products,
                totalPages,
                currentPage: parseInt(page),
                product
            })
        } else {
            res.render('products', {
                products,
                totalPages,
                currentPage: parseInt(page, 10),
                product,
                userCart,
                wishlist,
                categoryData,
                userData
            });
        }

    } catch (error) {
        console.log(error.message)
        next(error)

    }
}

const loadSingleProduct = async (req, res, next) => {

    try {
        const userData = req.session.user_id
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        if (wishlist) {
            const userProducts = wishlist.products
            var wishlistExist = userProducts.find(obj => obj.productID == req.query.id);
        }
        const product = await Product.findById({ _id: req.query.id }).populate('category')
        const productsData = await Product.find()
        if (product) {
            res.render('single-product', { product, productsData, userData, userCart, wishlist, wishlistExist })
        } else {
            res.render('404')
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const addToWishList = async (req, res, next) => {
    try {
        const singleProduct = await Product.findOne({ _id: req.body.productID })
        const userWishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const count = userWishlist.products.length
        const product = {
            productID: singleProduct._id,
            name: singleProduct.name,
            price: singleProduct.price
        }
        var addedToWishList, alreadyExist = false
        if (userWishlist) {
            const itemExist = await Wishlist.findOne({ userID: req.session.user_id, "products.productID": req.body.productID })
            if (!itemExist) {
                const updateWishlist = await Wishlist.updateOne({ userID: req.session.user_id }, { $push: { products: product } })
                res.send({ addedToWishList: true, count })
            } else {
                const updateWishlist = await Wishlist.findByIdAndUpdate(
                    { _id: userWishlist._id },
                    { $pull: { products: { productID: req.body.productID } } })
                res.send({ alreadyExist: true, count })
            }
        } else {
            const wishlist = new Wishlist({
                userID: req.session.user_id,
                products: product
            })
            const wishlistData = await wishlist.save()
            res.send({ addedToWishList: true, count })
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const cartAddWishlist = async (req, res, next) => {
    try {
        const productData = await Product.findOne({ _id: req.query.id })
        const userWishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const product = {
            productID: productData._id,
            name: productData.name,
            price: productData.price
        }
        if (userWishlist) {
            const itemExist = await Wishlist.findOne({ userID: req.session.user_id, "products.productID": req.query.id })
            if (!itemExist) {
                const updateWishlist = await Wishlist.updateOne({ userID: req.session.user_id }, { $push: { products: product } })
                const userCart = await Cart.findOne({ userID: req.session.user_id })
                const removedProduct = userCart.products.find(item => item.productID == req.query.id)
                const updateCart = await Cart.findByIdAndUpdate(
                    { _id: userCart._id },
                    {
                        $pull:
                            { products: { productID: req.query.id } },
                        $inc: { Total: -removedProduct.price }
                    })
                res.redirect('/cart')
            } else {
                res.redirect('/cart')
            }
        } else {
            const wishlist = new Wishlist({
                userID: req.session.user_id,
                products: product
            })
            const wishlistData = await wishlist.save()
            res.redirect('/cart')
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadWishList = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        let count = 0
        if (wishlist) {
            const pid = wishlist.products
            const wishlistProductsId = pid.map(values => values.productID)
            var products = await Product.aggregate([
                {
                    $match: {
                        _id: { $in: wishlistProductsId }
                    }
                }, {
                    $project: {
                        name: 1,
                        image: 1,
                        price: 1,
                        order: { $indexOfArray: [wishlistProductsId, "$_id"] }
                    }
                },
                { $sort: { order: 1 } }
            ])
            count = products.length
        }
        res.render('wishlist', { products, count, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const removeFromWishlist = async (req, res, next) => {
    try {
        const userWishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const removedProduct = userWishlist.products.find(item => item.productID == req.query.id)
        const updateWishlist = await Wishlist.findByIdAndUpdate(
            { _id: userWishlist._id },
            {
                $pull:
                {
                    products:
                        { productID: req.query.id }
                }
            })
        if (updateWishlist) {
            res.redirect('/wishlist')
        } else {
            res.render('404')
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const addingToCart = async (req, res, next) => {

    try {
        const singleProduct = await Product.findOne({ _id: req.query.id })
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const product = {
            productID: singleProduct._id,
            name: singleProduct.name,
            price: singleProduct.price,
            quantity: 1
        }
        let wishExist = await Wishlist.findOne({ userID: req.session.user_id, 'products.productID': req.query.id })
        if (wishExist) {
            await Wishlist.findOneAndUpdate({ userID: req.session.user_id },
                { $pull: { products: { productID: req.query.id } } })
        }
        const cartProducts = await Cart.findOne({
            userID: req.session.user_id,
            "products": {
                "$elemMatch": { "productID": req.query.id }
            }
        }, { "products.$": 1, _id: 0 })
        let quantity = 0
        if (cartProducts != null) {
            quantity = cartProducts.products[0].quantity
        }
        if (singleProduct.stock > 0 && quantity < singleProduct.stock) {
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.productID == req.query.id)
                if (proExist != -1) {
                    const checkProduct = await Cart.updateOne({ userID: req.session.user_id, 'products.productID': req.query.id },
                        { $inc: { 'products.$.quantity': 1, 'products.$.price': singleProduct.price, Total: singleProduct.price } }
                    )
                    res.redirect('/cart')
                } else {
                    const newProduct = await Cart.findByIdAndUpdate({ _id: userCart._id }, { $push: { products: product }, $set: { Total: userCart.Total + singleProduct.price } })
                    res.redirect('/cart')
                }
            } else {
                const cart = new Cart({
                    products: product,
                    userID: req.session.user_id,
                    Total: singleProduct.price,
                })
                const cartData = await cart.save()
                if (cartData) {
                    res.redirect('/cart')
                } else {
                    res.sendStatus(404)
                }
            }
        } else {
            res.redirect('/shop')
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadCart = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        if (userCart != null) {
            const cartProducts = userCart.products
            const userCartProductsId = cartProducts.map(values => values.productID)
            var products = await Product.aggregate([
                {
                    $match: {
                        _id: { $in: userCartProductsId }
                    }
                }, {
                    $project: {
                        name: 1,
                        image: 1,
                        price: 1,
                        cartOrder: { $indexOfArray: [userCartProductsId, "$_id"] }
                    }
                },
                { $sort: { cartOrder: 1 } }
            ])
            var count = products.length
        } else {
            count = 0
        }
        res.render('cart', { products, userCart, count, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const removeFromCart = async (req, res, next) => {
    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const removedProduct = userCart.products.find(item => item.productID == req.query.id)
        const updateCart = await Cart.findByIdAndUpdate(
            { _id: userCart._id },
            {
                $pull:
                {
                    products:
                        { productID: req.query.id }
                },
                $inc: {
                    Total: -removedProduct.price,
                }
            })
        res.redirect('/cart')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const changeQuantity = async (req, res, next) => {
    try {
        const productData = await Product.findOne({ _id: req.body.product })
        const count = parseInt(req.body.count)
        const quantity = parseInt(req.body.quantity)
        let currentTotal = parseInt(req.body.currentTotal)
        let empty = false
        if (count == -1 && quantity == 1) {
            let removeItemFromcart = await Cart.updateOne({ _id: req.body.cart },
                {
                    $pull: { products: { productID: req.body.product } }
                })
            empty = true
        } else {
            if (count == 1 && quantity < productData.stock) {
                currentTotal = productData.price + currentTotal
                let changeQuantity = await Cart.updateOne({ _id: req.body.cart, 'products.productID': req.body.product },
                    {
                        $inc: { 'products.$.quantity': count },
                        $set: { 'products.$.price': currentTotal }
                    })
            } else if (count == -1) {
                currentTotal = currentTotal - productData.price
                let changeQuantity = await Cart.updateOne({ _id: req.body.cart, 'products.productID': req.body.product },
                    {
                        $inc: { 'products.$.quantity': count },
                        $set: { 'products.$.price': currentTotal }
                    })
            } else {
                var stockReached = true
            }
        }
        const newQuantity = await Cart.findOne({
            userID: req.session.user_id,
            "products": {
                "$elemMatch": {
                    "productID": req.body.product
                }
            }
        }, { "products.$": 1, _id: 0 })
        const userCart = await Cart.findOne({ _id: req.body.cart })
        let sum = userCart.products.reduce((acc, cur) => {
            return acc += cur.price;
        }, 0)
        const updateTotalPrice = await Cart.findByIdAndUpdate({ _id: req.body.cart },
            { $set: { Total: sum } })
        res.json({ empty, currentTotal, sum, newQuantity, stockReached })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const applyCouponCode = async (req, res, next) => {
    try {
        const userCart = await Cart.findById({ _id: req.body.cartID })
        const couponData = await Coupon.findOne({ couponCode: req.body.couponCode })
        const currentDate = new Date();
        if (couponData) {
            var userAlreadyUsed = couponData.users.find(item => item.userID == req.session.user_id)
        }
        if (userCart.discountPrice == 0) {
            let message;
            if (couponData && couponData.count > 0 && currentDate.getTime() < couponData.expire.getTime()) {
                if (!userAlreadyUsed) {
                    if (userCart.Total >= couponData.minAmount) {
                        var removed = false
                        let discount = Math.ceil(userCart.Total * couponData.discount / 100)
                        if (discount <= couponData.maxDiscount) {
                            const afterdiscount = userCart.Total - discount
                            const updateCart = await Cart.findByIdAndUpdate({ _id: req.body.cartID }, { $set: { discountPrice: discount } })
                            message = 'Coupon Succesfully Applied'
                            res.send({ discountAmount: discount, message: message, removed, afterdiscount })
                        } else {
                            const afterdiscount = userCart.Total - couponData.maxDiscount
                            discount = couponData.maxDiscount
                            const updateCart = await Cart.findByIdAndUpdate({ _id: req.body.cartID }, { discountPrice: couponData.maxDiscount })
                            message = 'Coupon maximum Discount Succesfully Applied'
                            res.send({ discountAmount: discount, message: message, removed, afterdiscount })
                        }
                    } else {
                        message = 'Minimum Purchase value of this coupon is ' + couponData.minAmount
                        let minimum = true
                        res.send({ message: message, minimum })
                    }
                } else {
                    message = ' Coupon Already Used Once'
                    let invalid = true
                    res.send({ message: message, invalid })
                }
            } else {
                message = 'Invalid Coupon Code'
                let invalid = true
                res.send({ message: message, invalid })
            }
        } else {
            const discountRemove = await Cart.findByIdAndUpdate({ _id: req.body.cartID }, { $set: { discountPrice: 0 } })
            removed = true
            res.send({ removed })
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadCheckOutPage = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        if (userCart != null && userCart.Total > 0) {
            const coupon = await Coupon.find()
            const user = await User.findOne({ _id: req.session.user_id })
            const discountRemove = await Cart.findOneAndUpdate({ userID: req.session.user_id }, { $set: { discountPrice: 0 } })
            const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
            res.render('checkout', { user, userCart, wishlist, coupon })
        } else {
            res.redirect('/shop')
        }

    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const saveCheckOutAddress = async (req, res, next) => {

    try {
        const address = {
            name: req.body.name,
            pincode: req.body.pincode,
            landmark: req.body.landmark,
            address: req.body.newAddress,
            mobile: req.body.phone
        }
        const userData = await User.findByIdAndUpdate(
            { _id: req.session.user_id },
            {
                $push: {
                    address: {
                        ...address
                    }
                }
            })

        if (userData) {
            res.redirect('/checkout')
        } else {
            res.sendStatus(404)
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const orderplaced = async (req, res, next) => {
    try {
        const couponUsed = {
            userID: req.session.user_id
        }
        const coupon = await Coupon.findOne({ couponCode: req.body.couponValue })
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const user = await User.findById({ _id: req.session.user_id })
        const total = Math.ceil(userCart.Total - userCart.discountPrice)
        const currentDate = new Date();
        const orderDate = currentDate.toISOString().slice(0, 10)
        const paymentStatus = req.body.paymentMethod === 'Cash On Delivery' ? 'placed' : 'pending'
        const decreaseCouponCount = await Coupon.findOneAndUpdate({ couponCode: req.body.couponValue }, { $inc: { count: -1 }, $push: { users: couponUsed } })
        const order = new Order({
            orderDate: orderDate,
            userID: req.session.user_id,
            products: userCart.products,
            address: user.address[req.body.address]._id,
            Total: total,
            paymentMethod: req.body.paymentMethod,
            paymentStatus: paymentStatus,
            orderStatus: 'Placed',
        })
        var orderSave = await order.save()
        req.session.order_id = orderSave._id
        if (req.body.paymentMethod == 'Cash On Delivery') {

            res.json({ Status: true })
        } else {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: '' + orderSave._id
            };
            instance.orders.create(options, function (err, order) {
                res.json({ order })
            });
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const verifyPayment = async (req, res, next) => {
    try {
        const payment = req.body.payment
        const order = req.body.order
        const secret = 'vK70i8djjOB3NsMeeUK5BTgu'
        const hmac_sha256 = (data, secret) => {
            return crypto.createHmac('sha256', secret)
                .update(data)
                .digest('hex')
        }
        const generated_signature = hmac_sha256(order.id + "|" + payment.razorpay_payment_id, secret);
        if (generated_signature == payment.razorpay_signature) {
            const updatePaymentStatus = await Order.findByIdAndUpdate({ _id: order.receipt }, { $set: { paymentStatus: 'completed' } })
            res.json({ Status: true })
        } else {
            const removeOrder = await Order.findOneAndDelete({ $and: [{ _id: order.receipt }, { paymentStatus: 'pending' }] })
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const loadOrderPlacedPage = async (req, res, next) => {
    try {
        if (req.session.order_id) {
            const userCart = await Cart.findOne({ userID: req.session.user_id })
            const order = await Order.findOne({ userID: req.session.user_id }).sort({ createdAt: -1 }).limit(1)
            const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
            const discount = await Cart.findOne({ userID: req.session.user_id })
            const updateUserCart = await Cart.findOneAndUpdate({ userID: req.session.user_id },
                {
                    $set: {
                        products: [],
                        Total: 0,
                        discountPrice: 0
                    }
                })
            for (const product of order.products) {
                const collectionProduct = await Product.findOne({ _id: product.productID })
                const newStock = collectionProduct.stock - product.quantity
                const update = await Product.findByIdAndUpdate(
                    { _id: product.productID },
                    { stock: newStock })
            }
            req.session.order_id = null
            res.render('order-placed', { order, wishlist, discount })
        } else {
            res.redirect('/shop')
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const loadUserOrders = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const removePendingOrder = await Order.findOneAndDelete({ $and: [{ userID: req.session.user_id }, { paymentStatus: 'pending' }] })
        const orderedProducts = await Order.find({ userID: req.session.user_id }).populate('products.productID').sort({ createdAt: -1 })
        res.render('orders', { userCart, wishlist, orderedProducts })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadSingleOrderDetails = async (req, res, next) => {

    try {
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const order = await Order.findOne({ _id: req.query.id }).populate('products.productID')
        const userAddress = await User.findOne({
            _id: order.userID, 'address._id': order.address
        }, { "address.$": 1, _id: 0 })
        const address = userAddress.address[0]
        res.render('order-details', { userCart, order, wishlist, address })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById({ _id: req.query.id })
        for (const product of order.products) {
            const collectionProduct = await Product.findOne({ _id: product.productID })
            const newStock = collectionProduct.stock + product.quantity
            const update = await Product.findByIdAndUpdate(
                { _id: product.productID },
                { stock: newStock })
        }
        const cancelOrder = await Order.findByIdAndUpdate({ _id: req.query.id }, { orderStatus: 'Cancelled', paymentStatus: 'Cancelled' })
        res.redirect('/orders')
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const returnOrder = async (req, res, next) => {
    try {
        const id = req.query.id
        const order = await Order.findById({ _id: id })

        const returnOrder = await Order.findByIdAndUpdate({ _id: req.query.id }, { orderStatus: 'Return Processing', paymentStatus: 'Processing' })
        res.redirect('/order-view?id=' + id)
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const loadContact = async (req, res, next) => {

    try {

        const userData = await User.findOne({ _id: req.session.user_id })
        const wishlist = await Wishlist.findOne({ userID: req.session.user_id })
        const userCart = await Cart.findOne({ userID: req.session.user_id })
        res.render('contact', { userData, userCart, wishlist })
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}

const submitContactForm = async (req, res, next) => {
    try {
        if (req.session.user_id) {
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
                from: req.body.email,
                to: process.env.email,
                subject: req.body.email,
                text: `Contact Form of Your Fashion Store ${req.body.msg} `
            }
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.redirect('/contact')
                } else {
                    console.log("Email has been sent:- ", info.response);
                }
            })
            let sts = true
            res.json({ sts })
        } else {
            res.json({ sts:false })
        }
    } catch (error) {
        console.log(error.message)
        next(error)
    }
}


module.exports = {
    loadLandingPage,
    loadProductPage,
    loadSingleProduct,

    loadWishList,
    addToWishList,
    removeFromWishlist,
    cartAddWishlist,

    addingToCart,
    removeFromCart,
    loadCart,
    changeQuantity,

    applyCouponCode,
    loadCheckOutPage,
    saveCheckOutAddress,
    orderplaced,
    verifyPayment,
    loadOrderPlacedPage,

    loadUserOrders,
    loadSingleOrderDetails,
    cancelOrder,
    returnOrder,
    loadContact,
    submitContactForm,
}