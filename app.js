//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.qzk8tht.mongodb.net/todoListDB`);

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find().then((items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems).then(() => {
        console.log("Items added Successfully");
      }).catch((err) => {
        console.log(err);
      });
      res.redirect('/');
    }
    else {

      res.render("list", { listTitle: "Today", newListItems: items });
    }
  }).catch((err) => {
    console.log(err);
  });
});

app.get("/:listName", function (req, res) {

  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }).then((list) => {
    if (!list) {
      const list = new List({
        name: listName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + listName);
    }
    else {
      res.render('list', { listTitle: list.name, newListItems: list.items });
    }
  }).catch((err) => {
    console.log(err);
  })



});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName == "Today") {
    newItem.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/' + listName);
    }).catch((err) => {
      console.log(err);
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(() => {
      console.log("Item deleted Successfullly");
      res.redirect('/');
    }).catch((err) => {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then((item) => {
      console.log("Item Deleted Successfully");
      res.redirect('/' + listName);
    }).catch((err) => {
      console.log(err);
    })
  }

});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
