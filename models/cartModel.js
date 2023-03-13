const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({

    productID: {
        type: ObjectId,
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

const cartSchema = new mongoose.Schema({

 userID: {
        type: ObjectId,
        required: true
    },
    products: [productSchema],
    Total: {
        type: Number,
        required: false
    },
    discountPrice: {
        type: Number,
        required: false,
        default: 0
    }
})

module.exports = mongoose.model('cart', cartSchema)