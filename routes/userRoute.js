const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  getUserDetails,
  getAllUsers,
  semanticSearch,
} = require("../controller/userController");

const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

router.post("/register", registerUser);

router.route("/login").post(loginUser);

router.route("/logout").get(logout);

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/users").get(isAuthenticatedUser, getAllUsers);

router.route("/semantic-search").get(isAuthenticatedUser,semanticSearch);

module.exports = router;
