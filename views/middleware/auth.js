const isLoggedIn = (req, res, next) => {
  req.session.userInfo ? next() : res.redirect("/login");
};

module.exports = isLoggedIn;
