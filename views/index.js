const express = require("express");

const app = express();

const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const routes = require("./controllers/routes");
const MongoStore = require("connect-mongo")(session);

// Loads the enviorenment variables
require("dotenv").config({ path: "./config/keys.env" });

// express-handlebars configuration
const hbs = exphbs.create({
  defaultView: "default",
  layoutsDir: __dirname + "/views/layouts/",
  partialsDir: __dirname + "/views/partials/",

  // Custom helper functions
  helpers: {
    eachFrom: (context, count, options) => {
      var ret = "";
      context.slice(Math.max(context.length - count, 0)).forEach((elem) => {
        ret += options.fn(elem);
      });
      return ret;
      // const slicing = function (context, count) {
      //   if (context == null) return void 0;
      //   if (count == null) return context[context.length - 1];
      //   return context.slice(Math.max(context.length - count, 0));
      // };
    },
  },
});

// Handlebars
app.set("view engine", "handlebars");
app.engine("handlebars", hbs.engine);

// Uploading static files
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

/*
    This is to allow specific forms and/or links that were submitted/pressed
    to send PUT and DELETE request respectively!!!!!!!
*/
app.use((req, res, next) => {
  if (req.query.method == "PUT") {
    req.method = "PUT";
  } else if (req.query.method == "DELETE") {
    req.method = "DELETE";
  }

  next();
});

app.use(fileUpload());

// Session
app.use(
  session({
    secret: `${process.env.SECRET_KEY}`,
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
    cookie: { maxAge: 180 * 60 * 1000 },
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.userInfo;
  res.locals.session = req.session;
  next();
});

// map the controller to the app object
app.use("/", routes);

// !MONGODB;
mongoose
  .connect(process.env.ATLAS_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDBAtlas ");
  })
  .catch((err) => console.log(`Error occured as connecting to ${err}`));

//This creates an Express Web Server that listens to HTTP Reuqest on port 3000
app.listen(process.env.PORT || 3000, () => {
  console.log("Express server listening on port 3000");
});
