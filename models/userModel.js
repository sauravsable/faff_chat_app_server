const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// user schema
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter Your Name"],
        unique:true,
        maxLength:[30,"Name Cannot Exceed"],
        minLength:[4,"Name should have more than 4 characters"]
    },
    email:{
        type:String,
        required:[true,"Please Enter Your Email"],
        unique:true,
        validate:[validator.isEmail,"Please Enter a Valid Email"],
    },
    password:{
        type:String,
        required:[true,"Please Enter Your Password"],
        minLength:[8,"Password should be greater than 8 characters"],
        select:false
    },
    createdAt :{
        type: Date,
        default : Date.now
    },
});


// Password Hashing using BcryptJs before storing it into database
userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        next();    
    }

    this.password = await bcrypt.hash(this.password,10);
});

// Method to get JWT Token
userSchema.methods.getJWTToken = function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    })
};

// Method to Compare Password
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
};


module.exports = new mongoose.model("users",userSchema);
