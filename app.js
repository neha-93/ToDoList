const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const datee = require(__dirname + "/nk.js");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect('mongodb://localhost:27017/toDoListDB', {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
  name: "Welcome to your ToDoList!"
});

const Item2 = new Item({
  name: "Press + to add new Items."
});

const Item3 = new Item({
  name: "<-- Hit to delete items from your ToDoList!"
});

const defaultItems = [Item1, Item2, Item3];

const listsSchema = new mongoose.Schema({
  name: String,
  listItems: [itemsSchema]
});

const List = mongoose.model("List", listsSchema);

const date = datee.getDate();

app.get("/", function(req,res){

  Item.find({}, function(err, items){
    if(items.length === 0){
      Item.insertMany(defaultItems, function(err, docs){});
    }

    res.render("lists", {listType: date, itemList: items});
  });

});

app.get("/:customList", function(req, res){

  const customList = _.capitalize(req.params.customList);

  List.findOne({name: customList}, function(err, foundList){
    if(!err){
      if(!foundList){
        const newList = new List({
          name: customList,
          listItems: defaultItems
        });
        newList.save( function(err){
          if(!err) res.render("lists",{listType: customList, itemList: newList.listItems});
        });
      } else {
        res.render("lists",{listType: customList, itemList: foundList.listItems});
      }
    }
  });

});

app.post("/", function(req, res){

  const listName = req.body.list;
  const itemNew = new Item({
    name: req.body.newItem
  });

  if(date === listName){
    itemNew.save(function(err){
      if(!err) res.redirect("/");
    });
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.listItems.push(itemNew);
      foundList.save(function(err){
        if(!err) res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", function(req, res){

  const toRemoveId = req.body.checkbox;
  const listName = req.body.typeOfList;

  if(listName === date){
    Item.findByIdAndRemove({_id: toRemoveId}, {useFindAndModify: false}, function(err, result){
      if(!err) console.log("Item successfully deleted!");
    });

    res.redirect("/");
  } else{
    List.findOneAndUpdate({name: listName}, {$pull:{listItems: {_id:toRemoveId}}}, function(err, result){
      if(!err) console.log("Item successfully deleted!");
    });
    res.redirect("/" + listName);
  }


});

app.get("/about", function(req, res){
  res.render("about");
})

app.listen(3000, function(){
  console.log("Server running at 3000.");
});
