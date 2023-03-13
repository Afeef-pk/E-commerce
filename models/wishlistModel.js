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
    }
})

const wishlistSchema = new mongoose.Schema({

 userID: {
        type: ObjectId,
        required: true
    },
    products: [productSchema],
})

module.exports = mongoose.model('wishlist', wishlistSchema)