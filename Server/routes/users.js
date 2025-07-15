const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get(
  "/me",
  (req, res, next) => {
    next();
  },
  authenticateToken,
  userController.getCurrentUser
);
router.get("/:id", authenticateToken, userController.getUserById);


module.exports = router;
