
const express = require('express')
const parser = require('body-parser')
const encodedParser = parser.urlencoded({extended: true})
const multer = require('multer')
const uploadProcesser = multer({dest:'public/upload'})
const nodemailer = require('nodemailer');
const nedb = require("@seald-io/nedb");


const app = express()


let database = new nedb({
  filename: "database.txt",
  autoload: true
});


app.use(express.static('public'))

app.use(encodedParser)


app.set('view engine', 'ejs')


app.get('/', (req, res) => {
  let query = {};

  
  let sortQuery = {
      timestamp: -1
  };

  
  database.find(query).sort(sortQuery).exec((err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.render('index.ejs', { posts: data });
  });
});


app.get('/upload', (req, res) => {
    res.render('upload');
});


app.get("/search", (req, res) => {
  let searchTerm = req.query.searchTerm;

  
  let query = {
    text: new RegExp(searchTerm, 'i')
  };

  
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




app.get('/blessings', (req, res) => {
  let query = {};

  
  let sortQuery = {
      timestamp: -1
  };

  
  database.find(query).sort(sortQuery).exec((err, data) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.render('blessings', { blessings: data });
  });
});


app.get('/about', (req, res) => {
  res.render('about');
});


app.get('/contact', (req, res) => {
  res.render('contact');
});


app.post('/upload', uploadProcesser.single('theimage'), (req, res) => {
  let now = new Date();

 
  let message = {
      text: req.body.text,
      date: now.toLocaleString(),
      timestamp: now.getTime() 
  };

  
  if (req.file) {
      message.imgSrc = 'upload/' + req.file.filename; 
  }

  
  database.insert(message, (err, newData) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }
      res.redirect('/');
  });
});



app.post('/submit-blessing', (req, res) => {
    const blessing = {
      text: req.body.blessingText,
      date: new Date().toLocaleString()
    };
    
    database.insert(blessing, (err, newBlessing) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/blessings');
    });
});


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


app.listen(5558, ()=> {
    console.log('Server starts');
})
