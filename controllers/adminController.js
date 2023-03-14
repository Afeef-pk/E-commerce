const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const ejs = require('ejs')
const pdf = require('html-pdf')
const fs = require('fs')
const path = require('path')


const loadAdminLogin = async (req, res, next) => {
    try {
        res.render("adminLogin")
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const verifyLogin = async (req, res, next) => {
    try {
        const adminEmail = process.env.admin
        const adminPassword = process.env.adminPassword
        const email = req.body.email
        const password = req.body.password
        if (adminEmail == email && adminPassword == password) {
            req.session.admin_id = adminEmail
            res.redirect('/admin/dashboard')
        } else {
            res.render('adminLogin', { message: "email or password is incorrect" })
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadDashboard = async (req, res, next) => {
    try {
        const users = await User.find()
        const product = await Product.find()
        const orders = await Order.find().populate('userID')
        const totalSale = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "completed",
                    orderStatus: "Delivered"
                }
            },
            {
                $group:
                {
                    _id: null,
                    total: { $sum: '$Total' }
                }
            },
            { $project: { _id: 0, total: 1 } }
        ])
        const delivered = await Order.find({ orderStatus: "Delivered" })
        const coupons = await Coupon.find()
        const categorie = await Category.find()
        res.render('dashboard', { users, product, orders, totalSale, delivered, coupons, categorie })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadSales = async (req, res, next) => {
    try {
        const recentOrders = await Order.find({ orderStatus: "Delivered" }).populate('userID')
        res.render('sales', { recentOrders })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const dateSaleFilter = async (req, res, next) => {
    try {
        const startDate = req.body.fromInput
        const endDate = req.body.toInput
        const orders = await Order.find({
            orderStatus: "Delivered",
            orderDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).populate('userID')
        res.json(orders)
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const exportSalesPdf = async (req, res, next) => {
    try {
        
        const startDate = req.body.salesFrom
        const endDate = req.body.salesTo
        if (req.body.salesFrom != '' && req.body.salesTo != '') {
            var recentOrders = await Order.find({
                orderStatus: "Delivered",
                orderDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).populate('userID')
        } else {
            var recentOrders = await Order.find({
                orderStatus: "Delivered"
            }).populate('userID')
        }
        const total = recentOrders.reduce((acc, cur) => {
            return acc += cur.Total;
        }, 0)
        const data = {
            startDate: startDate,
            endDate: endDate,
            recentOrders: recentOrders,
            total
        }
        const filePathName = path.resolve(__dirname, '../views/admin/sales-pdf.ejs')
        const htmlString = fs.readFileSync(filePathName).toString()
        let options = {
            format: 'A4',
            orientation: "portrait",
            border: "10mm"
        }
        const ejsData = ejs.render(htmlString, data)
        pdf.create(ejsData, options).toStream((err, stream) => {
            if (err) {
                console.log(err);
            }
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="sales-report.pdf"'
            });
            stream.pipe(res);
        });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadUser_Manage = async (req, res, next) => {
    try {
        const users = await User.find()
        res.render('User_Manage', { users })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadUserDeatails = async (req, res, next) => {
    try {
        const users = await User.findOne({ _id: req.query.id })
        res.render('single-user', { users })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const blockUser = async (req, res, next) => {
    try {
        if (req.body.flexRadioDefault == 1) {
            const updateInfo = await User.updateOne({ _id: req.body.user_id }, { $set: { is_blocked: 1 } })
            delete req.session.user_id
            res.redirect('/admin/user_manage')
        } else {
            const updateInfo = await User.updateOne({ _id: req.body.user_id }, { $set: { is_blocked: 0 } })
            res.redirect('/admin/user_manage')
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadProducts = async (req, res, next) => {
    try {
        const product = await Product.find().populate('category')
        res.render('products', { product })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadAddNewProduct = async (req, res, next) => {
    try {
        const category = await Category.find()
        res.render('new-product', { category })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const insertNewProduct = async (req, res, next) => {
    try {
        let imageFile = []
        for (let i = 0; i < req.files.length; i++) {
            imageFile[i] = req.files[i].filename
        }
        const product = new Product({
            name: req.body.name.trim(),
            mrp: req.body.mrp.trim(),
            price: req.body.price.trim(),
            category: req.body.category,
            image: imageFile,
            stock: req.body.stock.trim(),
            description: req.body.description.trim(),
        })
        const productData = await product.save()
        if (productData) {
            res.redirect('/admin/product_manage')
        } else {
            res.render('products', { message: "something wrong" })
        }
    }
    catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadProductDeatails = async (req, res, next) => {
    try {
        const product = await Product.findOne({ _id: req.query.id }).populate('category')
        res.render('single-product', { product })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadEditProduct = async (req, res, next) => {
    try {
        const id = req.query.id
        const productData = await Product.findById({ _id: id }).populate('category')
        const categoryData = await Category.find()
        if (productData) {
            res.render('edit-product', { product: productData, category: categoryData })
        } else {
            res.redirect('/admin/product_manage')
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const imageDelete = async (req, res) => {
    try {
        const img = req.query.img;
        const imageData = await Product.updateMany({ $pull: { image: { $in: [img] } } })
        fs.unlink('./public/images/' + img, (err) => {
            if (err) throw err;
        });
        if (imageData) {
            res.redirect('/admin/edit_product?id=' + req.query.productId);
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateProduct = async (req, res, next) => {
    try {
        if (req.files.length > 0) {
            const imageFileNames = req.files.map(file => file.filename)
            const productData = await Product.findByIdAndUpdate(
                { _id: req.body.product_id },
                { $push: { image: { $each: imageFileNames } } }
            )
        }
        const productData = await Product.findByIdAndUpdate({ _id: req.body.product_id },
            {
                $set: {
                    name: req.body.name.trim(),
                    mrp: req.body.mrp.trim(),
                    price: req.body.price.trim(),
                    category: req.body.category,
                    stock: req.body.stock.trim(),
                    description: req.body.description.trim()
                }
            })
        if (productData) {
            res.redirect('/admin/product_manage')
        } else {
            res.sendstatus(400)
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const deleteProduct = async (req, res, next) => {
    try {
        const id = req.query.id
        const product = await Product.findOne({ _id: id })
        if (product.disabled) {
            await Product.updateOne({ _id: id }, { $set: { disabled: false } })
        } else {
            await Product.updateOne({ _id: id }, { $set: { disabled: true } })
        }
        res.redirect('/admin/product_manage')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const categoryManage = async (req, res, next) => {
    try {
        const categoryData = await Category.find()
        res.render('categories', { category: categoryData })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadAddNewCategory = async (req, res, next) => {
    try {
        res.render('new-categories')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const addNewCategory = async (req, res, next) => {
    try {
        const name = req.body.category.trim()
        const existCategory = await Category.findOne({ categoryName: { $regex: '.*' + name + '.*', $options: 'i' } })
        if (existCategory) {
            res.render('new-categories', { message: "Category already exist" })
        } else {
            const category = new Category({
                categoryName: name
            })
            const categoryData = await category.save()
            if (categoryData) {
                res.redirect('/admin/category_manage')
            } else {
                res.render('categories', { message: "something wrong" })
            }
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadEditCategory = async (req, res, next) => {
    try {
        const id = req.query.id
        const categoryData = await Category.findById({ _id: id })
        res.render('edit-category', { categoryData })
    } catch (error) {
        console.log(error.message);
    }
}

const updateCategory = async (req, res, next) => {
    try {
        const categoryUpdatedData = await Category.findByIdAndUpdate({ _id: req.body.category_id }, { $set: { categoryName: req.body.categoryname.trim() } })
        if (categoryUpdatedData) {
            res.redirect('/admin/category_manage')
        } else {
            res.render(404)
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const deleteCategory = async (req, res, next) => {
    try {
        const id = req.query.id
        const productExist = await Product.find({ category: id })
        if (productExist.length > 0) {
            res.json({ exist: true })
        } else {
            await Category.deleteOne({ _id: id })
            res.json({ removed: true })
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const orderListing = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('userID')
        res.render('order-list', { orders })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadOrderDeatails = async (req, res, next) => {
    try {
        const orderData = await Order.findOne({ _id: req.query.id }).populate('userID')
        const userAddress = await User.findOne({
            _id: orderData.userID, 'address._id': orderData.address
        }, { "address.$": 1, _id: 0 })
        const address = userAddress.address[0]
        res.render('single-order', { orderData, address })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const updateOrderDeatails = async (req, res, next) => {
    try {
        let paymentStatus = 'placed'
        let orderStatus = req.body.orderStatus
        if (req.body.orderStatus == 'Delivered' || req.body.return == 'false') {
            paymentStatus = 'completed'
        } else if (req.body.return == 'true') {
            paymentStatus = 'refunded',
                orderStatus = 'Returned'
        }
        const orderData = await Order.findByIdAndUpdate({ _id: req.query.id },
            {
                $set: {
                    paymentStatus: paymentStatus,
                    orderStatus: orderStatus,
                    returnStatus: req.body.return
                }
            })
        res.redirect('/admin/orders')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const couponManage = async (req, res, next) => {
    try {
        const coupons = await Coupon.find()
        res.render('coupons', { coupons })
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddNewCoupon = async (req, res, next) => {
    try {
        res.render('add-coupon')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const NewCoupon = async (req, res, next) => {
    try {
        const code = req.body.code.trim()
        const existCoupon = await Coupon.findOne({ couponCode: { $regex: '.*' + code + '.*', $options: 'i' } })
        if (existCoupon) {
            res.render('add-coupon', { message: "coupon already exist" })
        } else {
            const expire = req.body.expire.trim()
            const coupon = new Coupon({
                couponCode: req.body.code.trim(),
                discount: req.body.discount.trim(),
                minAmount: req.body.minAmount.trim(),
                maxDiscount: req.body.maxDiscount.trim(),
                count: req.body.count.trim(),
                expire: new Date(Date.now() + expire * 24 * 60 * 60 * 1000)
            })
            const couponData = await coupon.save()
            if (couponData) {
                res.redirect('/admin/coupons')
            } else {
                res.render('categories', { message: "something wrong" })
            }
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const loadEditCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById({ _id: req.query.id })
        res.render('edit-coupon', { coupon })
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const updateCoupon = async (req, res, next) => {
    try {
        const expire = req.body.expire.trim()
        const couponData = await Coupon.findByIdAndUpdate({ _id: req.query.id },
            {
                $set: {
                    couponCode: req.body.code.trim(),
                    discount: req.body.discount.trim(),
                    minAmount: req.body.minAmount.trim(),
                    maxDiscount: req.body.maxDiscount.trim(),
                    count: req.body.count.trim(),
                    expire: new Date(Date.now() + expire * 24 * 60 * 60 * 1000)
                }
            })
        if (couponData) {
            res.redirect('/admin/coupons')
        } else {
            res.sendstatus(400)
        }
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const deleteCoupons = async (req, res, next) => {
    try {
        await Coupon.deleteOne({ _id: req.query.id })
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const logout = async (req, res, next) => {
    try {
        delete req.session.admin_id
        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

module.exports = {
    loadAdminLogin,
    verifyLogin,
    loadDashboard,
    loadSales,
    dateSaleFilter,
    exportSalesPdf,

    loadUser_Manage,
    loadUserDeatails,
    blockUser,

    loadProducts,
    loadProductDeatails,
    loadAddNewProduct,
    insertNewProduct,
    loadEditProduct,
    imageDelete,
    updateProduct,
    deleteProduct,

    categoryManage,
    loadAddNewCategory,
    addNewCategory,
    loadEditCategory,
    updateCategory,
    deleteCategory,

    orderListing,
    loadOrderDeatails,
    updateOrderDeatails,

    couponManage,
    loadAddNewCoupon,
    NewCoupon,
    deleteCoupons,
    loadEditCoupon,
    updateCoupon,
    logout,
}