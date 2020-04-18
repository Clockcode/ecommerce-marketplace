const dashBoardLoader = (req, res) => {
  req.session.userInfo.type == "Admin"
    ? res.render("user/admin-dashboard")
    : res.render("user/user-dashboard");
};

module.exports = dashBoardLoader;
