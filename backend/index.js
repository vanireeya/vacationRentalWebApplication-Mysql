//import the require dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const multer = require('multer');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var cors = require('cors');
// app.set('view engine', 'ejs');
var bcrypt = require('bcryptjs');
var mysql = require('mysql');
var pool = require('./pool');
const path = require('path');
const fs = require('fs');



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        console.log(file)
        // const newFilename = `test${path.extname(file.originalname)}`;
        const newFilename = file.originalname;

        cb(null, newFilename);
    },
});
// const upload = multer({ storage });
var upload = multer({ storage }).array('photos', 5);
const upload1 = multer({ storage });



//use cors to allow cross origin resource sharing
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

//use express session to maintain session data
app.use(session({
    secret: 'cmpe273_homeaway',
    resave: false, // Forces the session to be saved back to the session store, even if the session was never modified during the request
    saveUninitialized: false, // Force to save uninitialized session to db. A session is uninitialized when it is new but not modified.
    duration: 60 * 60 * 1000,    // Overall duration of Session : 30 minutes : 1800 seconds
    activeDuration: 5 * 60 * 1000
}));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());








//Allow Access Control
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

//Route to handle Post Request Call
app.post('/login', function (req, res) {

    console.log("Inside Login Request");
    let email = req.body.email;
    let password = req.body.password;
    let type = req.body.type;

    var sql = "SELECT *  FROM userinfo WHERE email = " +
        mysql.escape(email) +
        // "and password = " + mysql.escape(password) + 
        "and flag=" + mysql.escape(type);
    // console.log(sql);
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            con.query(sql, async function (err, result) {
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    res.end("Invalid Credentials");
                } else {
                    // console.log(result)
                    res.cookie('cookie', "admin", { maxAge: 60 * 60 * 1000, httpOnly: false, path: '/' });
                    req.session.user = result;
                    // console.log("**********************")
                    // console.log(JSON.stringify(req.session));
                    // console.log("**********************")

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })
                    let data;
                    // console.log(result)
                    if (result && result.length > 0) {

                        if (bcrypt.compareSync(password, result[0].password)) {
                            console.log("Successful Login")

                            if (result[0].image) {

                                try {
                                    let newFileFormat = await changeFormat(result[0].image)
                                    console.log("Successful Login")
                                    let information = {
                                        uid: result[0].uid,
                                        firstname: result[0].firstname,
                                        lastname: result[0].lastname,
                                        type: result[0].flag,
                                        email: result[0].email,
                                        profileImage: newFileFormat
                                    }
                                    data = {
                                        status: 1,
                                        msg: "Successful login",
                                        info: information
                                    }

                                    res.end(JSON.stringify(data));
                                } catch (error) {
                                    let data = {
                                        status: -1,
                                        msg: "Error in file conversion"
                                    }
                                    res.end(JSON.stringify(data));
                                }

                            } else {
                                let information = {
                                    uid: result[0].uid,
                                    firstname: result[0].firstname,
                                    lastname: result[0].lastname,
                                    type: result[0].flag,
                                    email: result[0].email,
                                    profileImage: ""
                                }
                                data = {
                                    status: 1,
                                    msg: "Successful login",
                                    info: information
                                }

                                res.end(JSON.stringify(data));
                            }

                        } else {
                            data = {
                                status: -1,
                                msg: "Invalid credentials"
                            }
                            res.end(JSON.stringify(data));
                        }

                    } else {
                        data = {
                            status: -1,
                            msg: "Invalid credentials"
                        }
                        res.end(JSON.stringify(data));
                    }


                }
            });
        }
    });

});


app.get('/profile/:id', function (req, res) {
    console.log(req.params.id)
    let id = parseInt(req.params.id)
    console.log(typeof id)
    var sql = "SELECT * FROM userinfo WHERE uid = " + mysql.escape(id);
    console.log(sql)
    let data;
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            console.log("in con")
            con.query(sql, async function (err, result) {
                // console.log("INERROR")
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    console.log(err)
                    res.end("Something went wrong");
                } else {
                    console.log(result[0])
                    if (result && result.length > 0) {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        })

                        try {
                            if (result[0].image) {
                                let newFileFormat = await changeFormat(result[0].image)
                                result[0].profileImage = newFileFormat
                                data = {
                                    status: 1,
                                    msg: "Successful login",
                                    info: result[0]
                                }

                                res.end(JSON.stringify(data));
                            } else {

                                data = {
                                    status: 1,
                                    msg: "Successful login",
                                    info: result[0]
                                }

                                res.end(JSON.stringify(data));
                            }

                        } catch (error) {
                            console.error(error)
                            let data = {
                                status: -1,
                                msg: "Error in file conversion"
                            }
                            res.end(JSON.stringify(data));
                        }


                    } else {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        })
                        data = {
                            status: -1,
                            msg: "User not found"
                        }
                        res.end(JSON.stringify(data));
                    }


                }
            });
        }
    })

})


app.post('/updateProfile', function (req, res) {
    // console.log(req);
    // console.log(req.session)
    // console.log(req.body)
    console.log("Inside updateProfile Request Handler");
    // let information = {
    //     firstname: req.body.firstname,
    //     lastname: req.body.lastname,
    //     type: req.body.type,
    //     email: req.body.email
    // }


    var sql = "UPDATE  userinfo SET " +
        "firstname=" + mysql.escape(req.body.firstname) + "," +
        "lastname=" + mysql.escape(req.body.lastname) + "," +
        "description=" + mysql.escape(req.body.description) + "," +
        "country=" + mysql.escape(req.body.country) + "," +
        "company=" + mysql.escape(req.body.company) + "," +
        "school=" + mysql.escape(req.body.school) + "," +
        "hometown=" + mysql.escape(req.body.hometown) + "," +
        "languages=" + mysql.escape(req.body.languages) + "," +
        "gender=" + mysql.escape(req.body.gender) + "," +
        "city=" + mysql.escape(req.body.city) + "," +
        "phoneno=" + mysql.escape(req.body.phoneno) +
        " WHERE uid= " + mysql.escape(req.body.uid)
    console.log(sql);
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    res.writeHead(400, {
                        'Content-Type': 'application/json'
                    })
                    let data = {
                        status: -1,
                        msg: "Email address is already in use."
                    }
                    res.end(JSON.stringify(data));
                } else {
                    console.log(result)
                    console.log("Profile Successfully updated")
                    // console.log(result.insertId)
                    // res.cookie('cookie', "admin", { maxAge: 900000, httpOnly: false, path: '/' });
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })
                    // information.uid = result.insertId
                    // // 
                    // // req.session.user = result;

                    let data = {
                        status: 1,
                        msg: "Successfully updated",

                    }

                    res.end(JSON.stringify(data));
                }
            });
        }
    });


});

app.post('/updateProfilePic', function (req, res) {

    upload(req, res, function (err, result) {
        let filename = req.files[0].filename
        let data;
        if (err) {
            console.log(err)
            return res.end("Error uploading file.");
        } else {

            var sql = "UPDATE  userinfo SET " +
                "image=" + mysql.escape(filename) +
                " WHERE uid= " + mysql.escape(req.body.uid)
            console.log(sql);
            pool.getConnection(function (err, con) {
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    res.end("Could Not Get Connection Object");
                } else {
                    con.query(sql, async function (err, result) {
                        if (err) {
                            console.log(err)
                            res.writeHead(400, {
                                'Content-Type': 'application/json'
                            })
                            let data = {
                                status: -1,
                                msg: "Something went wrong."
                            }
                            res.end(JSON.stringify(data));
                        } else {
                            console.log("successfully updated profile pic")
                            res.writeHead(200, {
                                'Content-Type': 'application/json'
                            })
                            try {
                                let newFileFormat = await changeFormat(filename)
                                data = {
                                    status: 1,
                                    msg: "Successfully updated",
                                    info: {
                                        fileName: newFileFormat
                                    }
                                }
                                res.end(JSON.stringify(data));
                            } catch (error) {
                                let data = {
                                    status: -1,
                                    msg: "Error in file conversion"
                                }
                                res.end(JSON.stringify(data));
                            }


                        }
                    });
                }
            });

        }
    });
});

app.get('/getList/:id', function (req, res) {
    console.log(req.params.id)
    let id = req.params.id
    var sql = "SELECT * FROM property WHERE owner_email = " + mysql.escape(id);
    console.log(sql)
    let data;
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            console.log("in con")
            con.query(sql, async function (err, result) {
                // console.log("INERROR")
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    console.log(err)
                    res.end("Something went wrong");
                } else {
                    console.log(result[0])
                    if (result && result.length > 0) {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        })

                        let property = []

                        result.forEach(value => {
                            let imagesName = JSON.parse(value.images)
                            console.log(imagesName)
                            let imageFinal = [];
                            imagesName.forEach(filename => {
                                let file = filename;
                                let fileLocation = path.join(__dirname + '/uploads', file);
                                let img = fs.readFileSync(fileLocation);
                                let base64img = new Buffer(img).toString('base64');
                                imageFinal.push(base64img)
                            });
                            value.showImages = imageFinal;
                            property.push(value);
                        });
                        data = {
                            status: 1,
                            msg: "Success",
                            property: property
                        }
                        res.end(JSON.stringify(data));
                    } else {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        })
                        data = {
                            status: -1,
                            msg: "No property found"
                        }
                        res.end(JSON.stringify(data));
                    }


                }
            });
        }
    })

})

app.get('/getTrips/:id', function (req, res) {
    console.log("In get user trips")
    let id = req.params.id
    var sql = "SELECT  * FROM booked_property INNER JOIN property ON booked_property.pid=property.pid WHERE email=" + mysql.escape(id) + " ORDER BY booked_property.bookid DESC"

    // console.log(sql)
    let data;
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            console.log("in con")
            con.query(sql, async function (err, result) {
                // console.log("INERROR")
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    console.log(err)
                    res.end("Something went wrong");
                } else {
                    console.log(result[0])
                    // if (result && result.length > 0) {
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })

                    let property = []

                    result.forEach(value => {
                        let imagesName = JSON.parse(value.images)
                        // console.log(imagesName)
                        let imageFinal = [];

                        imagesName.forEach(filename => {
                            let file = filename;
                            let fileLocation = path.join(__dirname + '/uploads', file);
                            let img = fs.readFileSync(fileLocation);
                            let base64img = new Buffer(img).toString('base64');
                            imageFinal.push(base64img)
                        });
                        value.showImages = imageFinal;
                        property.push(value);
                    });
                    data = {
                        status: 1,
                        msg: "Success",
                        property: property
                    }
                    console.log("Success")
                    res.end(JSON.stringify(data));
                    // } else {
                    //     res.writeHead(200, {
                    //         'Content-Type': 'application/json'
                    //     })
                    //     data = {
                    //         status: -1,
                    //         msg: "No property found"
                    //     }
                    //     res.end(JSON.stringify(data));
                    // }


                }
            });
        }
    })

})

app.get('/search/:id', function (req, res) {
    console.log("in search")
    let id = req.params.id
    id = JSON.parse(id)
    id.guests = parseInt(id.guests)
    var sql = "SELECT * FROM property WHERE city = " + mysql.escape(id.city) + "and accomodates>=" + mysql.escape(id.guests);
    let data;
    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            con.query(sql, async function (err, result) {
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    // console.log(err)
                    res.end("Something went wrong");
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })
                    let startDate = Date.parse(id.tripStart)
                    let endDate = Date.parse(id.tripEnd)
                    let intermediate_property = [];
                    for (let i = 0; i < result.length; i++) {
                        if (Date.parse(result[i].availablefrom) < startDate && Date.parse(result[i].availabletill) > endDate) {
                            intermediate_property.push(result[i])
                        }
                    }
                    let sqlState = "("
                    for (let i = 0; i < intermediate_property.length; i++) {
                        if (i == 0) {
                            sqlState = sqlState + intermediate_property[i].pid
                        } else {
                            sqlState = sqlState + "," + intermediate_property[i].pid
                        }
                    }
                    sqlState = sqlState + ")"
                    let sql2 = " select * FROM booked_property WHERE pid IN " + sqlState
                    con.query(sql2, function (err, result1) {
                        if (err) {
                            console.log(err)
                            res.writeHead(400, {
                                'Content-Type': 'application/json'
                            })
                            let data = {
                                status: -1,
                                msg: "Something went wrong."
                            }
                            res.end(JSON.stringify(data));
                        } else {

                            // console.log(result1)
                            let finalResult = [];
                            for (let i = 0; i < intermediate_property.length; i++) {
                                let flag = true
                                for (let j = 0; j < result1.length && flag == true; j++) {
                                    if (result1[j].pid == intermediate_property[i].pid) {

                                        if (startDate < Date.parse(result1[j].block_from) && Date.parse(result1[j].block_from) < endDate) {
                                            flag = false;
                                        }
                                        if (startDate < Date.parse(result1[j].block_to) && Date.parse(result1[j].block_to) < endDate) {
                                            flag = false;
                                        }
                                        if (Date.parse(result1[j].block_from) < startDate && startDate < Date.parse(result1[j].block_to)) {
                                            flag = false;
                                        }
                                        if (Date.parse(result1[j].block_from) < endDate && endDate < Date.parse(result1[j].block_to)) {
                                            flag = false;
                                        }

                                    }
                                }
                                console.log(flag)
                                if (flag) {
                                    finalResult.push(intermediate_property[i])
                                }
                            }
                            // console.log(finalResult)
                            let property = []
                            finalResult.forEach(value => {
                                let imagesName = JSON.parse(value.images)
                                // console.log(imagesName)
                                let imageFinal = [];
                                var day = 24 * 60 * 60 * 1000;
                                var availableFrom = new Date(id.tripStart);
                                var availabletill = new Date(id.tripEnd);
                                var no_days = Math.round(Math.abs((availableFrom.getTime() - availabletill.getTime()) / (day)));
                                // console.log(no_days + 1)
                                value.days = no_days;
                                if (value.days == 0) {
                                    value.days++;
                                }
                                value.totalCost = value.days * parseInt(value.rent)
                                imagesName.forEach(filename => {
                                    let file = filename;
                                    let fileLocation = path.join(__dirname + '/uploads', file);
                                    let img = fs.readFileSync(fileLocation);
                                    let base64img = new Buffer(img).toString('base64');
                                    imageFinal.push(base64img)
                                });
                                value.showImages = imageFinal;
                                property.push(value);
                            });
                            data = {
                                status: 1,
                                msg: "Success",
                                property: property
                            }
                            console.log("Successfully sent")
                            res.end(JSON.stringify(data));
                        }
                    });



                }
            });
        }
    })

})


const changeFormat = (filename) => {
    return new Promise((resolve, reject) => {
        console.log("filename:" + filename)
        var file = filename;
        var fileLocation = path.join(__dirname + '/uploads', file);
        var img = fs.readFileSync(fileLocation);
        var base64img = new Buffer(img).toString('base64');

        if (base64img) {
            resolve(base64img);
        } else {
            reject(base64img);
        }
    });
};

app.post('/signup', function (req, res) {
    console.log("Inside Sign-up Request Handler");
    let information = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        type: req.body.type,
        email: req.body.email
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    // console.log(hash)
    var sql = "INSERT INTO userinfo VALUES ( null, " +
        mysql.escape(req.body.email) + " , " +
        mysql.escape(hash) + " , " +
        mysql.escape(req.body.firstname) + " , " +
        mysql.escape(req.body.lastname) + " , null, null,null,null,null, null,null,null,null,null," +
        mysql.escape(req.body.type) +
        " ) ";

    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    res.writeHead(400, {
                        'Content-Type': 'application/json'
                    })
                    let data = {
                        status: -1,
                        msg: "Email address is already in use."
                    }
                    res.end(JSON.stringify(data));
                } else {

                    console.log("User successfully  signed up")
                    // console.log(result.insertId)
                    res.cookie('cookie', "admin", { maxAge: 900000, httpOnly: false, path: '/' });
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })
                    information.uid = result.insertId
                    // 
                    // req.session.user = result;

                    let data = {
                        status: 1,
                        msg: "Successfully signed up",
                        info: information
                    }

                    res.end(JSON.stringify(data));
                }
            });
        }
    });


});

app.post('/book_property', function (req, res) {
    // console.log(req);
    // console.log(req.session)
    // console.log(req.body)
    console.log("Inside book property Request Handler");



    var sql = "INSERT INTO booked_property VALUES ( null, " +
        mysql.escape(req.body.pid) + " , " +
        mysql.escape(req.body.block_to) + " , " +
        mysql.escape(req.body.block_from) + " , " +
        mysql.escape(req.body.email) +
        " ) ";

    pool.getConnection(function (err, con) {
        if (err) {
            res.writeHead(400, {
                'Content-Type': 'text/plain'
            })
            res.end("Could Not Get Connection Object");
        } else {
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    res.writeHead(400, {
                        'Content-Type': 'application/json'
                    })
                    let data = {
                        status: -1,
                        msg: "Something went wrong."
                    }
                    res.end(JSON.stringify(data));
                } else {

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    })
                    // information.uid = result.insertId
                    // 
                    // req.session.user = result;

                    let data = {
                        status: 1,
                        msg: "Successfully booked",
                        // info: information
                    }
                    console.log("successfully booked the property")
                    res.end(JSON.stringify(data));
                }
            });
        }
    });


});

app.post('/test', (req, res) => {
    console.log("inside test");
    console.log(req.name)
    console.log("000000000000000000000000000000000000000000000000000000000000000000000")
    console.log(req);
    // res.send();


    upload(req, res, function (err, result) {
        console.log("------------------------------------------------------------------")
        console.log(req);
        // console.log(JSON.parse(req.body.location));
        // console.log(req.body.location.name);
        console.log("FILE NAMES:::::::::::")
        console.log(req.files);
        // console.log("inside upload");
        // console.log(err)
        // console.log(result)
        if (err) {
            console.log(err)
            return res.end("Error uploading file.");
        } else {
            res.end("File is uploaded");

        }
    });
});

app.post('/test1', upload1.single('selectedFile'), (req, res) => {
    console.log("inside test");
});



app.post('/listing', function (req, res) {
    // console.log("Inside listing Request");
    // console.log("--------------------------------------------------------")
    // console.log(req.body)
    // console.log("--------------------------------------------------------")
    // console.log(req.session.user)

    console.log("Inside posting of the property")
    upload(req, res, function (err, result) {
        let location = JSON.parse(req.body.location);
        let details = JSON.parse(req.body.details);
        let pricing = JSON.parse(req.body.pricing);
        let email = JSON.parse(req.body.email);
        // console.log(email)
        // console.log(req.files);
        let filenames = [];
        for (let i = 0; i < req.files.length; i++) {
            filenames.push(req.files[i].filename)
        }
        filenames = JSON.stringify(filenames)
        // console.log(filenames)
        if (err) {
            console.log(err)
            return res.end("Error uploading file.");
        } else {
            // res.end("File is uploaded");
            let sql = "INSERT INTO property VALUES ( null, " +
                mysql.escape(location.country) + " , " +
                mysql.escape(location.street) + " , " +
                mysql.escape(location.city) + " , " +
                mysql.escape(location.state) + " , " +
                mysql.escape(location.zipcode) + " , " +
                mysql.escape(details.headline) + " , " +
                mysql.escape(details.propDesc) + " , " +
                mysql.escape(details.aptType) + " , " +
                mysql.escape(details.bedrooms) + " , " +
                mysql.escape(details.accomodates) + " , " +
                mysql.escape(details.bathrooms) + " , " +
                mysql.escape(filenames) + " ," +
                mysql.escape(pricing.availableFrom) + " , " +
                mysql.escape(pricing.availableTill) + " , " +
                mysql.escape(pricing.rent) + " , " +
                mysql.escape(email) +
                " ) "
            // console.log(sql)
            pool.getConnection(function (err, con) {
                if (err) {
                    res.writeHead(400, {
                        'Content-Type': 'text/plain'
                    })
                    console.log("could not get connection object")
                    res.end("Could Not Get Connection Object");
                } else {
                    con.query(sql, function (err, result) {
                        if (err) {
                            console.log(err)
                            res.writeHead(400, {
                                'Content-Type': 'application/json'
                            })
                            let data = {
                                status: -1,
                                msg: "Property already listed"
                            }
                            res.end(JSON.stringify(data));
                        } else {

                            console.log("Property listed")
                            // console.log(result)
                            res.writeHead(200, {
                                'Content-Type': 'application/json'
                            })


                            let data = {
                                status: 1,
                                msg: "Successfully listed",

                            }

                            res.end(JSON.stringify(data));
                        }
                    });
                }
            });
        }
    });
})







//start your server on port 3001
app.listen(3001);
console.log("Server Listening on port 3001");