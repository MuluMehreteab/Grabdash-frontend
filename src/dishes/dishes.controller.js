const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


//Middleware function that checks if the dish exists by dishId
function dishExists(req, res, next){
  //pull dishId from params
  const {dishId} = req.params;
  
  //try to find the dish in the data by searching for dishId and assign to foundDish
  const foundDish = dishes.find((dish) => dish.id === dishId);
  
  //check if the dish was found, if found go to next and assign data to res.locals, if false throw error that dish not found
  
  if (foundDish){
    res.locals.dish = foundDish;
    return next();
  }
  
  //throw error that dish was not found
  next({
    status: 404,
    message: `Dish Id not found: ${dishId}`
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
      message : `Dish must include a ${propertyName}`
    });
  }
}

//Middleware that checks if the dishId in the route matches that of the request body
function dishIdMatches(req, res, next){
  //pull the dishId from the param
  const {dishId} = req.params;
  const {data : {id} = {} } = req.body;
  
  //checks if both IDs are the same OR if body id exists, returns next if either are true, if not returns saying they do not match
  if (dishId === id || !(id)){
    return next();
  }
  next({
    status : 400,
    message : `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  });
}

//middleware that validates if price is valid. Price is valid if "Dish must have a price that is an integer greater than 0"
function isPriceValid(req, res, next){
  //pull price from req body
  const {data : {price} = {} } = req.body;
  
  //check if price is a >0 integer, if true go to next, if false throw error
  if(Number.isInteger(price) && price > 0){
    return next();
  }
  next({
    status : 400,
    message : "Dish must have a price that is an integer greater than 0"
  });
}

//GET Verbs

//Handler that deals with listing all dishes
function list(req, res){
  //responds with a list of dishes
  res.json({data : dishes});
}

//Handle that deals with returning a specific dish by dishId
function read(req, res){
  //dishExists already checks if this dish exists and stores the data in res.locals so we only need to respond with that
  res.json({data : res.locals.dish});
}

//Handler that adds a dish to the data
function create(req, res){
  //pull data from the request body
  const { data : {name, description, price, image_url} = {} } = req.body;
  
  //create newDish var and assign values from data obtained from body
  const newDish = {
    id : nextId(),
    name,
    description,
    price,
    image_url
  };
  
  //push the new dish to dishes and respond
  dishes.push(newDish);
  res.status(201).json({data: newDish});
  
}

//PUT Verb

//Handler that updates an existing dish entry
function update(req, res){
  //pull pasteId from params and create foundDish variable with the dish found, cannot use res.locals as that is only for response
  const {dishId} = req.params;
  
  const foundDish = dishes.find((dish) => dish.id === dishId);
  
  //pull data from req body 
  const {data : {name, description, price, image_url} = {} } = req.body;
  
  //replace foundDish params with the new values
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  
  
  //respond with new data
  res.json({data : foundDish});
}

module.exports = {
  list,
  read: [dishExists, read],
  dishExists,
  create: [
    dataBodyContains("name"),
    dataBodyContains("description"),
    dataBodyContains("price"),
    dataBodyContains("image_url"),
    isPriceValid,
    create
  ],
  update: [
    dishExists,
    dataBodyContains("name"),
    dataBodyContains("description"),
    dataBodyContains("price"),
    dataBodyContains("image_url"),
    isPriceValid,
    dishIdMatches,
    update
  ],
}
