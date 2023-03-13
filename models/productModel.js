const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    mrp:{
        type: Number,
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: ObjectId,
        required: true,
        ref:'categorie'
    },
    image: {
        type: Array,
        required: false
    },
     stock: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    disabled:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model('product', productSchema)