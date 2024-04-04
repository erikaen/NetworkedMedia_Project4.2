// imports express library
const express = require('express')
const parser = require('body-parser')
const encodedParser = parser.urlencoded({extended: true})
const multer = require('multer')
const uploadProcesser = multer({dest:'public/upload'})
const nodemailer = require('nodemailer');
const nedb = require("@seald-io/nedb");

// Initialize express
const app = express()

// Initialize NeDB database
let database = new nedb({
  filename: "database.txt",
  autoload: true
});

// Initialize public folder for assets
app.use(express.static('public'))
// Initialize body parser with the app
app.use(encodedParser)

// Initialize template engine to look at views folder for rendering
app.set('view engine', 'ejs')

// Route to render index page
app.get('/', (req, res) => {
  let query = {};

  // Sorting query to display posts in reverse chronological order
  let sortQuery = {
      timestamp: -1
  };

  // Retrieve data from the database and sort it
  database.find(query).sort(sortQuery).exec((err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.render('index.ejs', { posts: data });
  });
});

// Route to render upload page
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Route to handle search
app.get("/search", (req, res) => {
  let searchTerm = req.query.searchTerm;

  // Define a regular expression to match the search term in 'text' field
  let query = {
    text: new RegExp(searchTerm, 'i') // 'i' flag for case-insensitive search
  };

  // Execute the search query
  database.findOne(query, (err, searchData) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    if (!searchData) {
      return res.status(404).send('No matching post found');
    }
    res.render('singlePost.ejs', { post: searchData });
  });
});



// Route to render blessings page
app.get('/blessings', (req, res) => {
  let query = {};

  // Sorting query to display blessings in reverse chronological order
  let sortQuery = {
      timestamp: -1
  };

  // Retrieve blessings from the database and sort them
  database.find(query).sort(sortQuery).exec((err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.render('blessings', { blessings: data });
  });
});

// Route to render about page
app.get('/about', (req, res) => {
  res.render('about');
});

// Route to render contact page
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Route to handle uploaded data
app.post('/upload', uploadProcesser.single('theimage'), (req, res) => {
  let now = new Date();

  // Message object that holds the data from the form
  let message = {
      text: req.body.text,
      date: now.toLocaleString(),
      timestamp: now.getTime() // Ensure that 'timestamp' field contains current timestamp
  };

  // Check if a file has been uploaded
  if (req.file) {
      message.imgSrc = 'upload/' + req.file.filename; // Make sure the path here matches where Multer is storing the files
  }

  // Insert message into database
  database.insert(message, (err, newData) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.redirect('/');
  });
});


// Handling the submission of blessings
app.post('/submit-blessing', (req, res) => {
    const blessing = {
      text: req.body.blessingText,
      date: new Date().toLocaleString()
    };
    // Add blessing to the database
    database.insert(blessing, (err, newBlessing) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/blessings');
    });
});

// Handling the contact form submission and email sending
app.post('/send-email', encodedParser, async (req, res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'yourgmail@gmail.com',
            pass: 'yourpassword'
        }
    });

    let mailOptions = {
        from: req.body.email,
        to: 'yinuoxiang@gmail.com',
        subject: 'Contact Form Submission',
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error sending message');
        }
        console.log('Email sent: ' + info.response);
        res.send('Message sent successfully');
    });
});

// Setting up the server to start
app.listen(5558, ()=> {
    console.log('Server starts');
})
