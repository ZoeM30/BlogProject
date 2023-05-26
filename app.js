//ZIYU MA 8865319

const express = require("express");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const methodOverride = require("method-override");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const path = require("path");
const Article = require("./models/article");
const Admin = require("./models/admin");
const app = express();

//--------connect mongoose
mongoose.connect("mongodb://0.0.0.0:27017/project", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//---------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(fileUpload());
app.use(
  session({
    secret: "wodemima",
    resave: false,
    saveUninitialized: true,
  })
);

//------------ROUTES
app.get("/", async (req, res) => {
  const articles = await Article.find().sort({
    createAt: "desc",
  });
  res.render("home-guest", { articles: articles });
});

//login & logout
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/logout", (req, res) => {
  req.session.username = "";
  req.session.loggedIn = false;
  res.redirect("/");
});
//admin home page
app.get("/admin", async (req, res) => {
  const articles = await Article.find().sort({
    createAt: "desc",
  });
  res.render("home-admin", { articles: articles });
});
//admin: show article
app.get("/admin/:id", async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (article == null) res.redirect("/admin");
  res.render("show-admin", { article: article });
});
//create new article
app.get("/new", (req, res) => {
  res.render("new", { article: new Article() });
});
//edit article page
app.get("/edit/:id", async (req, res) => {
  const article = await Article.findById(req.params.id);
  res.render("edit", { article: article });
});

//delete article
app.delete("/admin/:id", async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});
//guest: show single article
app.get("/guest/:id", async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (article == null) res.redirect("/");
  res.render("show", { article: article });
});

//-----------post
app.post(
  "/articles",
  [
    check("title", "Blog title is required").not().isEmpty(),
    check("content", "Blog content is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("new", {
        errors: errors.array(),
      });
    }
    if (!req.files?.image) {
      return res.render("new", {
        errors: [{ msg: "Blog image is required" }],
      });
    }
    var imageName = req.files.image.name;
    var imageFile = req.files.image;
    var imagePath = "public/uploads/" + imageName;

    let article = new Article({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      imageName: req.files.image.name,
      imageFile: req.files.image,
      imagePath: "public/uploads/" + imageName,
    });

    imageFile.mv(imagePath, (err) => {
      console.log(err);
    });

    try {
      article = await article.save();
      res.redirect(`admin`);
    } catch (error) {
      console.log(error);
      res.send("error!");
    }
  }
);

//edit article
app.put("/edit/:id", async (req, res) => {
  req.article = await Article.findById(req.params.id);
  let article = req.article;
  article.title = req.body.title;
  article.description = req.body.description;
  article.content = req.body.content;
  if (req.files) {
    imageName = req.files.image.name;
    imageFile = req.files.image;
    imagePath = "public/uploads/" + imageName;
  }

  try {
    article = await article.save();
    res.redirect(`/admin`);
  } catch (e) {
    res.render("edit", { article: article });
  }
});

//------------LOGIN VALIDATION & SET UP
app.get("/setup", (req, res) => {
  var credential = {
    username: "admin",
    password: "admin",
  };
  let newAdmin = new Admin(credential);
  newAdmin.save();
  res.send("Setup Complete.");
});

app.post("/loginprocess", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  const admin = await Admin.findOne({
    username,
    password,
  }).exec();
  if (admin) {
    req.session.username = admin.username;
    req.session.loggedIn = true;
    res.redirect("/admin");
  } else {
    let message = {
      error: "credential incorrect",
    };
    res.render("login", message);
  }
});

//------------
app.listen(5000);
