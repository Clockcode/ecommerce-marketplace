const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const async = require("async");
const userModel = require("../model/users.js");
const productModel = require("../model/products.js");
const categoryModel = require("../model/categories");
const isAuthenticated = require("../middleware/auth");
const dashboardLoader = require("../middleware/authorization");
const path = require("path");
const Cart = require("../model/cart");

// ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET ! GET
router.get("/", (req, res) => {
  productModel
    .find()
    .then((products) => {
      const productData = products.map((product) => {
        return {
          _id: product._id,
          title: product.title,
          price: product.price,
          pic: product.pic,
          category: product.category,
          best: product.best,
        };
      });
      // categoryModel
      //   .find()
      //   .then((categories) => {
      //     const category = categories.map((category) => {
      //       return {
      //         title: category.title,
      //         img: category.img,
      //         name: category.name,
      //       };
      //     });
      //   })
      //   .catch((err) =>
      //     console.log(`Error occured while uploading categories ${err}}`)
      //   );
      // , categories: category
      res.render("index", { data: productData });
    })
    .catch((err) => {
      console.log(`Error Occured: ${err}`);
    });
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/products", (req, res) => {
  productModel
    .find()
    .then((products) => {
      const productData = products.map((product) => {
        return {
          _id: product._id,
          title: product.title,
          price: product.price,
          pic: product.pic,
          category: product.category,
          best: product.best,
        };
      });
      res.render("products", { data: productData });
    })
    .catch((err) => {
      console.log(`Error Occured: ${err}`);
    });
});

router.get("/product-page/:id", (req, res) => {
  var productId = req.params.id;
  productModel
    .findById(productId)
    .then((product) => {
      let data = {
        id: product.id,
        title: product.title,
        price: product.price,
        pic: product.pic,
        category: product.category,
        best: product.best,
      };
      res.render("product-page", { data: data });
      // console.log(data.title);
    })
    .catch((err) => {
      console.log(`Error Occured: ${err}`);
    });
});

router.get("/profile", isAuthenticated, dashboardLoader);

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

//Route to direct use to Add a Product
router.get("/add", isAuthenticated, (req, res) => {
  res.render("user/admin-dashboard");
});

router.get("/add-to-cart/:id", (req, res) => {
  let productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  productModel
    .findById(productId)
    .then((product) => {
      cart.add(product, product.id);
      req.session.cart = cart;
      console.log(req.session.cart);
      res.redirect("/shopping-cart");
    })
    .catch((err) => {
      console.log(`Erorr occured adding a product ${err}`);
      res.redirect("/");
    });
});

router.get("/reduce/:id", (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect("/shopping-cart");
});

router.get("/remove/:id", (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect("/shopping-cart");
});

router.get("/shopping-cart", (req, res, next) => {
  if (!req.session.cart) {
    return res.render("shopping-cart", { products: null });
  }
  var cart = new Cart(req.session.cart);
  res.render("shopping-cart", {
    products: cart.generateArray(),
    totalPrice: cart.totalPrice,
  });
});

// ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST ! POST

router.post("/login", (req, res) => {
  userModel
    .findOne({ email: req.body.email })
    .then((user) => {
      const errors = [];
      //email not found
      if (user == null) {
        errors.push("Sorry, your email and/or password incorrect");
        res.render("login", {
          errors,
        });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((isMatched) => {
            if (isMatched) {
              //cretae our session
              req.session.userInfo = user;

              res.redirect("/profile");
            } else {
              errors.push("Sorry, your email and/or password incorrect ");
              res.render("login", {
                errors,
              });
            }
          })
          .catch((err) => console.log(`Error while comparing ${err}`));
      }
    })
    .catch((err) => console.log(`Error while finding a user ${err}`));
});

router.post("/register", (req, res) => {
  //User object
  const userObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    userCreated: req.body.userCreated,
  };
  //userModel type newUser created
  const newUser = new userModel(userObj);
  // newUser saved to the collection
  newUser
    .save()
    .then((user) => {
      console.log("User Created");

      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SEND_GRID_API_KEY);
      const msg = {
        to: `${user.email}`,
        from: `noreply@hotmail.com`,
        subject: "SendGrid message",
        html: `
      Hi ${user.firstName}, you have succesfully created an account.<br>
      You can start shopping and enjoy the services of our store.<br>
  
      `,
      };
      sgMail
        .send(msg)
        .then(() => {
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(`Error while sending an email ${err}`);
        });
    })
    .catch((err) => {
      console.log(`Error Occured: ${err}`);
    });
});

router.post("/add", (req, res) => {
  const newProd = {
    title: req.body.title,
    description: req.body.desc,
    price: req.body.price,
    quantity: req.body.quant,
    category: req.body.cat,
    best: req.body.best,
    pic: req.files.pic.name,
  };

  const product = new productModel(newProd);
  product
    .save()
    .then((product) => {
      req.files.pic.name = `pic_${product._id}${
        path.parse(req.files.pic.name).ext
      }`;

      req.files.pic.mv(`public/uploads/${req.files.pic.name}`).then(() => {
        productModel
          .updateOne(
            { _id: product._id },
            {
              pic: req.files.pic.name,
            }
          )
          .then(() => {
            res.redirect(`/login`);
          });
      });
    })
    .catch((err) => console.log(`Error while inserting into the data ${err}`));
});

module.exports = router;
