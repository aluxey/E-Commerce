const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get(
  "/me",
  (req, res, next) => {
    console.log("🚀 Route /me atteinte !");
    next();
  },
  userController.getCurrentUser
);
router.get("/:id", userController.getUserById);


module.exports = router;
