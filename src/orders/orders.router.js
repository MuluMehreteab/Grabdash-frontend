const router = require("express").Router();

// TODO: Implement the /orders routes needed to make the tests pass
const controller = require("./orders.controller");

//import error handlers
const methodNotAllowed = require("../errors/methodNotAllowed");


//Orders routes

router.route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed);

router.route("/:orderId")
  .get(controller.read)
  .put(controller.update)
  .delete(controller.destroy)
  .all(methodNotAllowed);


module.exports = router;