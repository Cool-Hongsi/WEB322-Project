/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or
* distributed to other students.
*
* Name: Sungjun Hong   Student ID: 146830161   Date: 2018.08.04
*
* Online (Heroku) Link: https://agile-cliffs-78034.herokuapp.com/
*
********************************************************************************/ 

const express = require('express');
const app = express();
const fs = require('fs');
const port = process.env.PORT || 8080;
// const employeesdata = require('./data/employees.json');
// const departmentsdata = require('./data/departments.json');
const moduleVariable = require('./data-service.js');
const dataServiceAuth = require('./data-service-auth.js');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const clientSessions = require('client-sessions');

var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/images/uploaded/');
    },
    filename : function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({storage:storage});

app.use(express.static('./public')); // set up the path
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
   });
   
app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

app.set('view engine', '.hbs');
app.set('views', './views');
// app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: "main",
    helpers: {
        navLink: function(url, options){ 
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
            '><a href="' + url + '">' + options.fn(this) + '</a></li>'; 
        },
        equal: function (lvalue, rvalue, options) { 
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters"); 
            if (lvalue != rvalue) {
                return options.inverse(this); } 
            else {
                return options.fn(this); 
            }
        }
    }
}));

// function onHttpStart() {
//     console.log("Express http server listening on: " + port);
// }

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
}

moduleVariable.initialize().then(dataServiceAuth.initialize().then(()=>{
    app.listen(port, () => {
        console.log("Express http server listening on: " + port);
    })}).catch((err) => {
        console.log("unable to start server: " + err);
})).catch((err) => {
    console.log(err);
});

app.get('/', (req,res) => {
    // res.sendFile(path.join(__dirname, './views/home.html'));
    res.render('home');
});

app.get('/about', (req,res) => {
    // res.sendFile(path.join(__dirname, './views/about.html'));
    res.render('about');
});

app.get('/login', (req,res) => {
    res.render('login');
});

app.post('/login', (req,res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then((user)=>{
        req.session.user = {
            userName: user.userName,// authenticated user's userName
            email: user.email,// authenticated user's email
            loginHistory: user.loginHistory// authenticated user's loginHistory
        }
        res.redirect('/employees');
    }).catch((err)=>{
        res.render('login', {errorMessage: err, userName: req.body.userName})
    })
});

app.get('/userHistory', ensureLogin, (req,res) => {
    res.render('userHistory');
});

app.get('/logout', (req,res) => {
    req.session.reset();
    res.redirect("/");
});

app.get('/register', (req,res) => {
    res.render('register');
});

app.post('/register', (req,res) => {
    dataServiceAuth.registerUser(req.body).then(()=>{
        res.render('register', {successMessage: "User created"});
    }).catch((err)=>{
        res.render('register', {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/employees/add", ensureLogin, (req, res) => {
    moduleVariable.getDepartments().then(function(data){
        res.render('addEmployee', {departments: data});
    }).catch(function(err){
        res.render('addEmployee', {departments: []});
    });
});

app.post('/employees/add', ensureLogin, (req, res) => {
    moduleVariable.addEmployee(req.body).then(function(param){
        res.redirect('/employees');
    }).catch(function(err){
        res.send(err);
    })
});

app.get('/departments/add', ensureLogin, (req, res) => {
    res.render('addDepartment');
});

app.post('/departments/add', ensureLogin, (req, res) => {
    moduleVariable.addDepartment(req.body).then(function(param){
        res.redirect('/departments');
    }).catch(function(err){
        res.send(err);
    })
});

app.get('/images/add', ensureLogin, (req, res) => {
    // res.sendFile(path.join(__dirname, './views/addImage.html'));
    res.render('addImage');
});

app.post('/images/add', upload.single("imageFile"), ensureLogin, (req, res) => {
    res.redirect('/images');
});

app.get('/images', ensureLogin, (req, res) => {
    var pictures = {
        images : []
    };

    fs.readdir('./public/images/uploaded/', (err, item) => {
        if(err){
            throw err;
        }
        else{
            for(let i=0; i<item.length; i++){
                pictures.images.push(item[i]);
            }
            // res.json(pictures);
            res.render("images", {data : pictures.images});
        }
    })
});

app.get('/employees', ensureLogin, (req,res) => {
    if(req.query.status){
        moduleVariable.getEmployeesByStatus(req.query.status).then(function(param){
            if(param.length > 0){
                res.render("employees", {employees: param});
                // res.json(param);
            }
            else{
                res.render("employees", {err : "no results"});
            }
        }).catch(function(err){
            res.render("employees", {err: "no results"});
            // res.json(err);
        })
    }
    else if(req.query.department){
        moduleVariable.getEmployeesByDepartment(req.query.department).then(function(param){
            if(param.length > 0){
                res.render("employees", {employees: param});
                // res.json(param);
            }
            else{
                res.render("employees", {err : "no results"});
            }
            // res.json(param);
        }).catch(function(err){
            res.render("employees", {err: "no results"});
            // res.json(err);
        })
    }
    else if(req.query.manager){
        moduleVariable.getEmployeesByManager(req.query.manager).then(function(param){
            if(param.length > 0){
                res.render("employees", {employees: param});
                // res.json(param);
            }
            else{
                res.render("employees", {err : "no results"});
            }
            // res.json(param);
        }).catch(function(err){
            res.render("employees", {err: "no results"});
            // res.json(err);
        })
    }
    else{
        moduleVariable.getAllEmployees().then(function(param){
            if(param.length > 0){
                res.render("employees", {employees: param});
                // res.json(param);
            }
            else{
                res.render("employees", {err : "no results"});
            }
            // res.json(param);
        }).catch(function(err){
            res.render("employees", {err: "no results"});
            // res.json(err);
        })
        /*
        var text = JSON.stringify(employeesdata); // convert it as json string
        res.send(text);
        */
    }
});

// app.get('/employee/:num', (req, res) => {
//     var number = req.params.num;
    
//     moduleVariable.getEmployeeByNum(number).then(function(param){
//         res.render("employee", { employee: param });
//         // res.json(param);
//     }).catch(function(err){
//         res.render("employee",{message:"no results"});
//         // res.json(err);
//     })
// });

/*
app.get("/employee/:empNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    moduleVariable.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        }
        else {
            viewData.employee = null; // set employee to null if none were returned
        }}).catch(() => {
            viewData.employee = null; // set employee to null if there was an error
        }).then(moduleVariable.getDepartments).then((data) => {
    viewData.departments = data; // store department data in the "viewData" object as "departments"
    // loop through viewData.departments and once we have found the departmentId that matches
    // the employee's "department" value, add a "selected" property to the matching
    // viewData.departments object
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }}).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error
                res.status(404).send("Employee Not Found");
            }
            else {
                res.render("employee", { viewData: viewData }); // render the "employee" view
            }
    });
});
*/

app.get("/employee/:empNum", ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    moduleVariable.getEmployeeByNum(req.params.empNum).then((data) => {
        viewData.data = data; //store employee data in the "viewData" object as "data"
    }).catch(() => {
        viewData.data = null; // set employee to null if there was an error
    }).then(moduleVariable.getDepartments).then((data) => {
        viewData.departments = data; // store department data in the "viewData" object as "departments"
                                     // loop through viewData.departments and once we have found the departmentId that matches
                                     // the employee's "department" value, add a "selected" property to the matching
                                     // viewData.departments object
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.data[0].department) {
                viewData.departments[i].selected = true;
            }
        }
        // if not add department set Selected to false and promto a message to user, message like "Please Choose Department" in html.
        if (viewData.departments[viewData.departments.length-1].departmentId != viewData.data[0].department) {
            viewData.departments.Selected = false;
        }
    }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.data == null){ // if no employee - return an error
            res.status(404).send("Employee Not Found!!!");
        } else {
            res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });
});

app.get('/department/:departmentId', ensureLogin, (req, res) => {
    var number = req.params.departmentId;
    
    moduleVariable.getDepartmentById(number).then(function(param){
        if(param == null){
            res.status(404).send("Department Not Found");
        }
        else{
            res.render("department", { department: param });
        }
        // res.json(param);
    }).catch(function(err){
        res.status(404).send("Department Not Found");
        // res.render("employee",{err:"no results"});
        // res.json(err);
    })
});

// app.get('/managers', (req,res) => {
//     moduleVariable.getManagers().then(function(param){
//         res.json(param);
//     }).catch(function(err){
//         res.json(err);
//     })

//     // document.querySelector(~).innerHTML(param);
    
//     /*
//     var text;
//     for(var i=0; i<employeesdata.length; i++){
//         if(employeesdata[i].isManager == true){
//             text += JSON.stringify(employeesdatas[i]);
//         }
//     }
//     res.send(text);
//     */
// });

app.get('/departments', ensureLogin, (req,res) => {
    moduleVariable.getDepartments().then(function(param){
        if(param.length > 0){
            res.render("departments", {departments: param});
            // res.json(param);
        }
        else{
            res.render("departments", {message: "no results"});
        }
    }).catch(function(err){
        res.render("departments", {err: "no results"});
    })
    /*
    var text = JSON.stringify(departmentsdata);
    res.send(text);
    */
});

app.post('/employee/update', ensureLogin, (req, res) => {
    //console.log(req.body);
    moduleVariable.updateEmployee(req.body).then(function(){
        res.redirect('/employees');
    }).catch(function(err){
        console.log(err);
    })
});

app.post('/department/update', ensureLogin, (req, res) => {
    //console.log(req.body);
    moduleVariable.updateDepartment(req.body).then(function(){
        res.redirect('/departments');
    })
    // }).catch(function(err){
    //     console.log(err);
    // })
});

// moduleVariable.initialize().then(function(param){
//     // console.log(param);
//     app.listen(port, () => {
//         console.log(`Express http server listening on ${port}`);
//     });
// }).catch(function(err){
//     // console.log(err);
//     console.log('Output Error');
// });

app.get('/employees/delete/:empNum', ensureLogin, (req, res) => {
    var number = req.params.empNum;
    moduleVariable.deleteEmployeeByNum(number).then(function(data){
        res.redirect('/employees');
    }).catch(function(err){
        res.status(500).send("Unable to Remove Employee / Employee not found");
    })
});

app.get('*', (req,res) => {
    res.status(404).send('Page Not Found');
});
