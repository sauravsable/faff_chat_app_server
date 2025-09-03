const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel');
const sendToken = require("../utils/jwtToken");
const { semanticSearchForUser } = require('../utils/semantic');

// User Signup 
exports.registerUser = async (req, res) => { 
    const {name,email,password} = req.body;

    console.log(name,email, password);
    

    const existingUserName = await User.findOne({ name: name });

    if (existingUserName) {
        return res.status(400).json({ success: false, message: 'User Name is not available' });
    }

    const existingUserEmail = await User.findOne({ email: email });

    if (existingUserEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    const user = await User.create({name,email,password});

    sendToken(user,200,res, "Register Successfully" );

};

// Login User
exports.loginUser = async (req,res,next)=>{

    const {email,password} = req.body;

    console.log(email, password);
    

    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email & Password",400));
    }

    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid email or password",401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password",401));
    }

    sendToken(user,200,res,"Login Successfull");

};

//Logout user
exports.logout =  async(req,res,next)=>{

    res.clearCookie('token');

    console.log("logout");
    
    
    res.status(200).json({
        success:true,
        message:"Logged out"
    })
};

// Get user detail
exports.getUserDetails = async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
        success:true,
        user,
        isAuthenticated: true
    })
}

//Get All Users
exports.getAllUsers = async(req,res,next)=>{
    const users = await User.find({ _id: { $ne: req.user._id } });
      
    res.status(200).json({
        success:true,
        users
    })
};  


exports.semanticSearch = async (req, res) => {
  try {
    const { userId, q, top = 10 } = req.query;
    if (!userId || !q)
      return res.status(400).json({ error: "userId and q query required" });

    const hits = await semanticSearchForUser(userId, q, parseInt(top, 10));

    const results = hits.map((h) => ({
      id: h.id,
      message: h.payload?.message || "",
      score: h.score,
      createdAt: h.payload?.createdAt || null,
      senderId: h.payload?.senderId,
      receiverId: h.payload?.receiverId,
    }));

    res.json(results);
  } catch (err) {
    console.error("semantic-search error", err);
    res.status(500).json({ error: "server error" });
  }
}
