const express = require("express");
const {
  createUser,
  loginUser,
  myInfo,
  logout,
  logoutAll,
  deleteUser,
  forgotPasswd,
  resetPasswd,
} = require("../controllers/users");
const auth = require("../middleware/auth");
const router = express.Router();

//server.js에 /api/v1/users작성
router.route("/").post(createUser);
router.route("/login").post(loginUser);
router.route("/me").get(auth, myInfo);
router.route("/logout").post(auth, logout);
router.route("/logoutAll").post(auth, logoutAll);
router.route("/deleteUser").post(auth, deleteUser);
router.route("/forgotpasswd").post(auth, forgotPasswd);
router.route("/resetPasswd/:resetPasswdToken").post(auth, resetPasswd);

module.exports = router;
