const router = require("express").Router();

// TODO: Implement the /dishes routes needed to make the tests pass
//Import controller
const controller = require("./dishes.controller");

//import error handlers
const methodNotAllowed = require("../errors/methodNotAllowed");


//Dishes routes

router.route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed);

router.route("/:dishId")
  .get(controller.read)
  .put(controller.update)
  .all(methodNotAllowed);

module.exports = router;