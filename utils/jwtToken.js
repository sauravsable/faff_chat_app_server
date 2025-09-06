// Creating Token and Saving it into the Cookie

const sendToken = (user,statusCode,res,message)=>{

    const token = user.getJWTToken();

    res.status(statusCode).json({
        success: true,
        user,
        isAuthenticated: true,
        message: message,
        token: token 
    });
    
};

module.exports = sendToken;