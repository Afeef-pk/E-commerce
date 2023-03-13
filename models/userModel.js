const mongoose= require("mongoose")

const addressSchema =new mongoose.Schema({
        name: {
            type:String,
            required:true
        },
        pincode: {
            type:Number,
            required:true
        },
        landmark: {
            type:String,
            required:true
        },
        address: {
            type:String,
            required:true
        },
        mobile: {
            type:Number,
            required:true
        }

})

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    is_blocked:{
        type:Number,
        default:0
    },
    address:[addressSchema],
})

module.exports = mongoose.model('User', userSchema)