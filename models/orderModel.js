const { ObjectID } = require("bson")
const mongoose = require("mongoose")

const orderedProductSchema = new mongoose.Schema({

    productID: {
        type: ObjectID,
        ref:'product'
    },
    name: {
        type: String
    },
    price: {
        type: Number,

    },
    quantity: {
        type: Number,
    }
})

const orderSchema = new mongoose.Schema({

    orderDate: {
        type: String,
        required: true
    },
    userID: {
        type: ObjectID,
        required: true,
        ref:'User'
    },
    products: [orderedProductSchema],
    address: {
        type: ObjectID,
        required: true,
        ref:'User'
    },
    Total: {
        type: Number
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String
    },
    orderStatus: {
        type: String
    },
    returnStatus: {
        type: Boolean,
        default:false
    },
    coupon:{
        type:ObjectID
    }
}  ,{ timestamps: true })

module.exports = mongoose.model('order', orderSchema)