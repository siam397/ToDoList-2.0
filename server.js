require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const { static } = require("express");
const ejs=require("ejs")
const mongoose=require("mongoose")
const encrypt = require("mongoose-encryption");
const session = require('express-session');
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose");
const _=require("lodash");
const app = express();
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect('mongodb://localhost:27017/Usertodo', {useNewUrlParser: true,  useUnifiedTopology: true });
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const itemSchema=new mongoose.Schema({
    name:String
})
const todoSchema=new mongoose.Schema({
    listName:String,
    items:[itemSchema]
})

const userSchema= new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    todo:{
        type:[todoSchema]
    }
})
userSchema.plugin(passportLocalMongoose);
const Item=new mongoose.model("Item",itemSchema)
const Todo= new mongoose.model("Todo",todoSchema)
const User = new mongoose.model("Person",userSchema)
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/register",function(req,res){
    res.render("register");
})
app.get("/",function(req,res){
    if(req.isAuthenticated()){
        res.render("userHome",{name:_.upperCase(req.user.username),items:req.user.todo})
    }
    else{
        res.render("home")
    }
})
app.get("/login",function(req,res){
    res.render("login");
})
app.get("/:topic",function(req,res){
    var nameoflist=req.params.topic;
    if(req.isAuthenticated()){
        var arr=req.user.todo;
        var found=false
        for(let i=0;i<arr.length;i++){
            if(arr[i].listName===nameoflist){
                found=true;
                res.render("body",{title:nameoflist,items:arr[i].items})
                break;
            }
        }
        if(!found){
            const tewdew=new Todo({
                listName:nameoflist,
                items:[]
            })
            tewdew.save()
            arr.push(tewdew)
            req.user.save()
            res.render("body",{title:nameoflist,items:[]})
        }
    }
    else{
        res.redirect("/")
    }
})

app.post("/register",function(req,res){
    User.findOne({email:req.body.email},function(err,user){
        if(user){
            res.send("email exists")
        }
        else
        {
            if(req.body.password===req.body.confirmPassword){
                User.register({username:req.body.username, email:req.body.email},req.body.password,function(err,user){
                if(err){
                    console.log(err);
                    res.redirect("/register");
                }
                else{
                    passport.authenticate("local")(req,res,function(){
                        res.redirect("/");
                    })
                }
            })
        }else{
            res.send("password doesnt match")
        }
    }
})
})

app.post("/logout",function(req,res){
    req.logout();
    res.redirect("/")
})
app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/");
            })
        }
    })
})

app.post("/add",function(req,res){
    var title=req.body.title;
    var input=req.body.newItem;
    if(req.isAuthenticated()){
        var arr=req.user.todo;
        var found=false
        for(let i=0;i<arr.length;i++){
            if(arr[i].listName===title){
                const item=new Item({
                    name:input
                })
                found=true;
                arr[i].items.push(item);
                req.user.save()
                res.redirect("/"+title)
                break;
            }
        }
    }else{
        res.redirect("/")
    }
})

app.post("/delete",function(req,res){
    var title=req.body.hiddeninput;
    var button=req.body.button;
    var arr=req.user.todo;
    function finded(todolist){
        return todolist.name===button
    }
    for(let i=0;i<arr.length;i++){
        if(arr[i].listName===title){
            arr[i].items.find(finded).name="";
            // lodash.js
            arr[i].items = _.reject(arr[i].items, function(el) { return el.name === ""; });
            req.user.save()
        }
    }
    res.redirect("/"+title)
})
app.post("/addNewList",function(req,res){
    var input=req.body.newList
    var todos=new Todo({
        listName:input,
        items:[]
    })
    req.user.todo.push(todos);
    req.user.save()
    res.redirect("/")
})
app.post("/deleteList",function(req,res){
    var toDelete=req.body.button;
    console.log(req.user.todo)
    User.findOneAndUpdate({username:req.user.username},{$pull:{todo:{listName:toDelete}}},function(err,result){
        console.log(result)
    })
    res.redirect("/");
})

app.listen(3000,function(){
    console.log("server started");
})



