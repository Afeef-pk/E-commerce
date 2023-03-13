const adminController = require("../controllers/adminController")
const adminAuth = require("../middlewares/adminAuth")
const express = require('express')
const upload = require("../config/multer")
const admin_route = express()

admin_route.set('views', './views/admin')

admin_route.get('/', adminAuth.isLogout, adminController.loadAdminLogin)

admin_route.post('/', adminController.verifyLogin)

admin_route.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard)

admin_route.get('/sales', adminAuth.isLogin, adminController.loadSales)

admin_route.post('/sale-date-filter', adminAuth.isLogin, adminController.dateSaleFilter)

admin_route.post('/export-sales-pdf', adminAuth.isLogin, adminController.exportSalesPdf)

admin_route.get('/user_manage', adminAuth.isLogin, adminController.loadUser_Manage)

admin_route.get('/view_user', adminAuth.isLogin, adminController.loadUserDeatails)

admin_route.post('/view_user', adminAuth.isLogin, adminController.blockUser)

admin_route.get('/product_manage', adminAuth.isLogin, adminController.loadProducts)

admin_route.get('/new_product', adminAuth.isLogin, adminController.loadAddNewProduct)

admin_route.post('/new_product', adminAuth.isLogin,upload.array ('image' , 3), adminController.insertNewProduct)

admin_route.get('/view_product', adminAuth.isLogin, adminController.loadProductDeatails)

admin_route.get('/edit_product', adminAuth.isLogin, adminController.loadEditProduct)

admin_route.post('/edit_product', adminAuth.isLogin,upload.array ('image',3) ,adminController.updateProduct)

admin_route.get('/delete_product', adminAuth.isLogin, adminController.deleteProduct)

admin_route.get('/category_manage', adminAuth.isLogin, adminController.categoryManage)

admin_route.get('/add_new_category', adminAuth.isLogin, adminController.loadAddNewCategory)

admin_route.post('/add_new_category', adminAuth.isLogin, adminController.addNewCategory)

admin_route.get('/edit-category', adminAuth.isLogin, adminController.loadEditCategory)

admin_route.post('/edit-category', adminAuth.isLogin, adminController.updateCategory)

admin_route.get('/delete_category', adminAuth.isLogin, adminController.deleteCategory)

admin_route.get('/orders', adminAuth.isLogin, adminController.orderListing)

admin_route.get('/view_order', adminAuth.isLogin, adminController.loadOrderDeatails)

admin_route.post('/view_order', adminAuth.isLogin, adminController.updateOrderDeatails)

admin_route.get('/coupons', adminAuth.isLogin, adminController.couponManage)

admin_route.get('/add_new_coupon', adminAuth.isLogin, adminController.loadAddNewCoupon)

admin_route.post('/add_new_coupon', adminAuth.isLogin, adminController.NewCoupon)

admin_route.get('/edit-coupon', adminAuth.isLogin, adminController.loadEditCoupon)

admin_route.post('/edit-coupon', adminAuth.isLogin, adminController.updateCoupon)

admin_route.get('/delete_coupon', adminAuth.isLogin, adminController.deleteCoupons)

admin_route.get('/logout', adminController.logout)

admin_route.get('*', function (req, res) {
    res.render('404')
})
module.exports = admin_route