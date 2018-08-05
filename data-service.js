const Sequelize = require('sequelize');

var sequelize = new Sequelize('de5bpj58v7114q', 'emispgisdhtncc', 'bf497392e8cca9207f649c39481b95c4441ec9bcdb3262a07cc50a586c1bca07', {
    host: 'ec2-54-227-243-210.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: true
    },
    operatorsAliases: false    
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "employeeNum" as a primary key
        autoIncrement: true // automatically increment the value
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addresCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
}, {
    createdAt: false,
    updatedAt: false
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "departmentId" as a primary key
        autoIncrement: true // automatically increment the value
    },
    departmentName: Sequelize.STRING
}, {
    createdAt: false,
    updatedAt: false
});

module.exports.initialize = function(){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(Employee){
            resolve();
        }).then(function(Department){
            resolve();
        }).catch(function(err){
            reject("unable to sync the database");
        })
    });
}

module.exports.getAllEmployees = function(){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll());
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

// There is no mention about getManagers()
module.exports.getManagers = function(){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where : {
                    isManager : true
                }
            }));
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.getDepartments = function(){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Department.findAll({
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.addDepartment = function(departmentData){ // problem.
    return new Promise(function(resolve, reject) {
        // sequelize.sync().then(function(){            
            for(let a in departmentData){
                if(departmentData[a] == ""){
                    departmentData[a] = null;
                }
            }
            Department.create({
                departmentId : departmentData.departmentId,
                departmentName : departmentData.departmentName
            }).then(function(){
                resolve(Department);
            }).catch(function(err){
                reject("unable to create department");
            })
    // }.catch(function(){
    //     reject("unable to create department");
    // }));
})}

module.exports.updateDepartment = function(departmentData){
    return new Promise(function (resolve, reject) {
        // sequelize.sync().then(function(){
            for(let a in departmentData){
                if(departmentData[a] == ""){
                    departmentData[a] = null;
                }
            }
            Department.update(
            {
                departmentName : departmentData.departmentName
            },
            {
                where : 
                {
                    departmentId : departmentData.departmentId,
                }
            }).then(function(){
                resolve(Department);
            }).catch(function(err){
                reject("unable to update department");
            })
    // }.catch(function(){
    //     reject("unable to update department");
    // }));
})}

module.exports.getDepartmentById = function(id){
    return new Promise(function(resolve, reject){
        sequelize.sync().then(function(){
            resolve(Department.findAll({
                where : {
                    departmentId : id // filter the results by "id" (using the value passed to the function - ie: 1 or 2 or 3 … etc
                }
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    })
}

module.exports.addEmployee = function(employeeData){
    employeeData.isManager = (employeeData.isManager) ? true : false;
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            for(const obj in employeeData){ // not in Employee
                
                // if(obj.employeeManagerNum == ""){
                //     obj.employeeManagerNum == null;
                // }

                if(employeeData[obj] == ""){
                    employeeData[obj] = null;
                }
            }
            resolve(Employee.create({
                employeeNum: employeeData.employeeNum,
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                email: employeeData.email,
                SSN: employeeData.SSN,
                addressStreet: employeeData.addressStreet,
                addresCity: employeeData.addresCity,
                addressState: employeeData.addressState,
                addressPostal: employeeData.addressPostal,
                maritalStatus: employeeData.maritalStatus,
                isManager: employeeData.isManager,
                employeeManagerNum: employeeData.employeeManagerNum,
                status: employeeData.status,
                department: employeeData.department,
                hireDate: employeeData.hireDate
            }))
        }).catch(function(err){
            reject("unable to create employee");
        })
    });
}

module.exports.getEmployeesByStatus = function(status){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where : {
                    status : status
                }
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.getEmployeesByDepartment = function(department){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where : {
                    department : department
                }
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.getEmployeesByManager = function(manager){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where : {
                    employeeManagerNum : manager
                }
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.getEmployeeByNum = function(num){
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            resolve(Employee.findAll({
                where : {
                    employeeNum : num
                }
            }))
        }).catch(function(err){
            reject("no results returned");
        })
    });
}

module.exports.updateEmployee = function(employeeData){
    employeeData.isManager = (employeeData.isManager) ? true : false;
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function(){
            for(const obj in employeeData){ // not in Employee
                
                // if(obj.employeeManagerNum == ""){
                //     obj.employeeManagerNum == null;
                // }

                if(employeeData[obj] == ""){
                    employeeData[obj] = null;
                }
            }
            resolve(Employee.update({
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                email: employeeData.email,
                SSN: employeeData.SSN,
                addressStreet: employeeData.addressStreet,
                addresCity: employeeData.addresCity,
                addressState: employeeData.addressState,
                addressPostal: employeeData.addressPostal,
                maritalStatus: employeeData.maritalStatus,
                isManager: employeeData.isManager,
                employeeManagerNum: employeeData.employeeManagerNum,
                status: employeeData.status,
                department: employeeData.department,
                hireDate: employeeData.hireDate},
                {
                    where : // to filter
                    {
                        employeeNum : employeeData.employeeNum
                    }
            }))
        }).catch(function(err){
            reject("unable to update employee");
        })
    });
}

module.exports.deleteEmployeeByNum = function(empNum){
    return new Promise(function(resolve, reject){
        sequelize.sync().then(function(){
            resolve(Employee.destroy({
                where : {
                    employeeNum : empNum
                }
            }));
        }).catch(function(err){
            reject();
        })
    })
}