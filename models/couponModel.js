const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({

    couponCode: {
        type: String,
        required: true
    },
    discount:{
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true
    },
    maxDiscount:{
        type:Number,
        required:true
    },
    count:{
        type:Number,
        required:true
    },
    expire:{
         type: Date,
    },
    users:{
        type:Array
    }
    
})

module.exports = mongoose.model('coupon', couponSchema)