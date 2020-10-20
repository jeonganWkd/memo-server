const express = require("express");

const router = express.Router();

const {
  getmemos,
  creatememo,
  updatememo,
  deletememo,
} = require("../controllers/memo");

router.route("/").get(getmemos).post(creatememo);
router.route("/:id").put(updatememo).delete(deletememo);

module.exports = router;
