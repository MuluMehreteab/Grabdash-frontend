const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Middleware functions:

//Middleware function to check if an order exists by orderId
function orderExists(req, res, next){
  //pull orderId from params
  const {orderId} = req.params;
  
  //try to find order and assign it to foundOrder
  const foundOrder = orders.find((order) => order.id === orderId);
  
  //check if order was found, if it was assign it to locals and go to next, if not throw error
  if(foundOrder){
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status : 404,
    message : `Order not found: ${orderId}`
  });
}

//Middleware that ensures that {param} is contained in the request body
function dataBodyContains(propertyName){
  return function (req,res,next){
    const {data = {}} = req.body;
    //check if data body contains the specified property
    if (data[propertyName]){
      return next();
    }
    next({
      status : 400,
      message : `Order must include a ${propertyName}`
    });
  }
}

//Middleware that checks if the dish qty is valid
function validDishQty(req, res, next){
  //pull dishes from req body
  const {data : {dishes} = {} } = req.body;
  
  //loop through dishes to determine if they have a valid qty using for...in
  for (index in dishes){
    //check if qty is valid, if not call next with error. Valid === integer, exists and >0. Number.isInteger() returns false if empty
    if (!(Number.isInteger(dishes[index].quantity) && dishes[index].quantity > 0)){
      next({
        status : 400,
        message : `dish ${index} must have a quantity that is an integer greater than 0`
      });
    }
  }
  
  //if no invalid dish qtys go to next
  return next();
  
}

//middleware that checks if the dishes array is valid
function validDishParam(req, res, next){
  //pull data from request body
  const {data : {dishes} = {} } = req.body;

  //check to see if dishes is an array and also checks if empty, go to next if true, throw error if false
  
  if (Array.isArray(dishes) && dishes.length !== 0){
    return next();
  }
  next({
    status : 400,
    message : "Order must include at least one dish"
  });
}

//middleware that checks if an order is already delivered
function isOrderDelivered(req, res, next){
  //order should already be shown as existing so should be stored in res.locals
  
  //test if the value of status is delivered, if true, throw error, if false continue
  
  if(res.locals.order.status === "delivered"){
    next({
      status : 400,
      message : "A delivered order cannot be changed"
    });
  }
  return next();
}

//middleware that checks the status of an order
//Order must have a status of pending, preparing, out-for-delivery, delivered
function isStatusValid(req, res, next){
  //pull status from the request body
  const {data : {status} = {} } = req.body;
  
  //check to see if status is valid
  
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  
  if(validStatus.includes(status)){
    return next();
  }
  next({
    status : 400,
    message : "Order must have a status of pending, preparing, out-for-delivery, delivered"
  });
}

//Middleware that checks if the orderId in the route matches that of the request body
function orderIdMatches(req, res, next){
  //pull the dishId from the param
  const {orderId} = req.params;
  const {data : {id} = {} } = req.body;
  
  //checks if both IDs are the same OR if body id exists, returns next if either are true, if not returns saying they do not match
  if (orderId === id || !(id)){
    return next();
  }
  next({
    status : 400,
    message : `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
  });
}

//Middleware function that checks if order is pending. Info: orders can only be deleted if pending.
function isOrderPending(req, res, next){
  //we have already checked that the order exists and it should be stored in res.locals
  //we can check the property in res.locals, if pending go to next, if not pending throw error
  if(res.locals.order.status === "pending"){
    return next();
  }
  next({
    status : 400,
    message : "An order cannot be deleted unless it is pending"
  });
}

//GET verb

//Handler that returns all orders
function list(req, res){
  //responds with all orders
  res.json({data : orders});
}

//Handler that returns order based on orderId
function read(req, res){
  //since we have already found the order or thrown an error using orderExists we can pull data from res.locals
  res.json({data : res.locals.order});
}

//POST verb

//Handler that allows user to create an order
function create(req, res){
  //we have already validated that it has the neccessary params with dataBodyContains
  //pull data from request body
  const {data : {deliverTo, mobileNumber, dishes, status} = {} } = req.body;
  
  
  //create new order variable
  const newOrder = {
    id : nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  };
  
  //push to orders
  orders.push(newOrder);
  
  //respond with data
  res.status(201).json({data : newOrder});
  
}


//PUT Verb

//This handler allows the user to modify an existing order by orderId
function update(req, res){
  //pull orderId from params and create foundOrder variable with the order found, cannot use res.locals as that is only for response
  const {orderId} = req.params;
  
  const foundOrder = orders.find((order) => order.id === orderId);
  
  //pull data from req body 
  const {data : {deliverTo, status, mobileNumber, dishes} = {} } = req.body;
  
  //replace foundDish params with the new values
  foundOrder.status = status;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  
  
  //respond with new data
  res.json({data : foundOrder});
}

//DELETE Verb
//This handler allows order to be deleted
//	An order cannot be deleted unless it is pending. Returns a 400 status code
function destroy(req, res){
  //pull id from params
  const {orderId} = req.params;
  
  //find index of order
  const index = orders.findIndex((order) => order.id === orderId);
  
  //store the delete entry in var + delete from orders
  const deletedOrder = orders.splice(index, 1);
  
  //send status to confirm
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    dataBodyContains("deliverTo"),
    dataBodyContains("mobileNumber"),
    dataBodyContains("dishes"),
    validDishParam,
    validDishQty,
    create
  ],
  update: [
    orderExists,
    isOrderDelivered,
    isStatusValid,
    dataBodyContains("deliverTo"),
    dataBodyContains("mobileNumber"),
    dataBodyContains("dishes"),
    validDishParam,
    validDishQty,
    orderIdMatches,
    update
  ],
  destroy : [
    orderExists,
    isOrderPending,
    destroy
  ],
}