const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

// mongoose.connect("mongodb://SungjunHong:alclsth1@ds141641.mlab.com:41641/web322_sungjunhong");

var userSchema = new Schema({
  "userName": {
    "type" : String,
    "unique" : true
  },
  "password": String,
  "email": String,
  "loginHistory": [{
    "dateTime": Date,
    "userAgent": String
  }]},
  {versionKey : false}
);

let User; // to be defined on new connection (see initialize)

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb://SungjunHong:alclsth1@ds141641.mlab.com:41641/web322_sungjunhong", { useNewUrlParser: true });
        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open', ()=>{
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if(userData.password != userData.password2){
            reject("Passwords do not match");
        }
        else{
            bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
                bcrypt.hash(userData.password, salt, function(err, hash) { // encrypt the password: "myPassword123"
                // TODO: Store the resulting "hash" value in the DB
                if(err){
                    reject("There was an error encrypting the password");
                } else{
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save((err) => {
                        if(err){
                            if(err.code == 11000){
                                reject("User Name already taken");
                            }
                            else{
                                reject("There was an error creating the user: ");
                            }
                        }  
                        else{
                            resolve();
                        }
                    }
                )}
            })
        })
    }})
};

module.exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.find({userName : userData.userName}).exec().then((users) => { // not {user} // users -> userData.userName 과 같은 userName을 가지는 DB 내 정보
        if(users[0].length == 0){
            reject("Unable to find user: " + userData.userName);
        }
        else{
            bcrypt.compare(userData.password, users[0].password).then((res) => {
                if (res === true){
                    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                    User.update({userName: userData.userName},
                                {$set: {loginHistory: users[0].loginHistory}},
                                {multi: false}
                    ).exec().then(() => {
                        resolve(users[0]);
                    }).catch((err) => {
                        reject( "There was an error verifying the user: " + err)
                    });
                } else {
                    reject("Incorrect Password for user: " + userData.userName);
                }
        }).catch(() => {
            reject("Unable to find user: " + userData.userName);
        })
    }})})};
