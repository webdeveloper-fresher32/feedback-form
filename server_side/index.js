const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const connectString = 'mongodb+srv://Ganesh:ndO5tDZQkMrbTDlp@feedback.aqim4am.mongodb.net/';
require('dotenv').config();
const axios=require('axios');


const port=process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

mongoose.connect(connectString,{ dbName: 'Feedback', useNewUrlParser: true, useUnifiedTopology: true });

const feedbackSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: String,
    category: { type: String, enum: ['Product-Features', 'Product-Pricing', 'Product-Usability'] },
    rating: { type: Number, min: 1, max: 5 },
    comments: String
});
const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports=Feedback;



const newUser=new Feedback({
    email:'ganesh1234@gmail.com',
    category:'Product-Features',
    rating:3,
    comments:'nice product'
})
newUser.save()
console.log(newUser)



app.post('/feedback', passport.authenticate('google'), async (req, res) => {
    const feedback = new Feedback(req.body);
    feedback.user = req.user._id; // Assign logged-in user
    try {
       const savedFeedback = await feedback.save();
       await axios.post('https://feedback-form.frill.co/b/6vrpd4ml/feature-ideas/idea/new', {
         title: savedFeedback.title, // Replace with your feedback title field
         description: savedFeedback.description, // Replace with your feedback description field
         category: savedFeedback.category, // Replace with your feedback category field
         user: {
           id: req.user._id,
           name: req.user.displayName,
           email: req.user.email
         }
       }, {
         headers: {
           'Content-Type': 'application/json',
           'Authorization': '09a85845-710c-4861-8c27-f9091e77ae7e' // Replace with your Frill API key
         }
       });
       res.json({ message: 'Feedback submitted!' });
    } catch (error) {
       res.status(400).json({ error: error.message });
    }
   });

   app.post('/https://feedback-form.frill.co/b/6vrpd4ml/feature-ideas/idea/new', async (req, res) => {
    try {
        // Get feedback data from the request
        const feedbackData = req.body;

        // Send feedback to the website's feedback form (adapt this part)
        const response = await axios.post(
            'https://feedback-form.frill.co/b/6vrpd4ml/feature-ideas/idea/new', // Replace with actual API endpoint
            feedbackData,
            {
                headers: {
                    'Authorization': '09a85845-710c-4861-8c27-f9091e77ae7e', // If required
                },
            }
        );

        res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});



























passport.use(new GoogleStrategy({
    clientID: "1088443915516-dk5dcsinm1u03dmif3ng9ku19refa2gt.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ googleId: profile.id })
        .then(existingUser => {
            if (existingUser) {
                return done(null, existingUser); // User already exists
            } else {
                // Create a new user
                const newUser = new User({
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value, // Assuming you want to store email
                    // ... other fields you want to store
                });
                return newUser.save()
                    .then(user => done(null, user))
                    .catch(error => done(error));
            }
        })
        .catch(error => done(error));
}));


app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.json({ message: 'Login successful!' });
});
app.post('/feedback', passport.authenticate('google'), async (req, res) => {
    const feedback = new Feedback(req.body);
    feedback.user = req.user._id; // Assign logged-in user
    try {
        await feedback.save();
        res.json({ message: 'Feedback submitted!' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
app.get('/feedback/categories', async (req, res) => {
    const categories = await Feedback.distinct('category');
    res.json(categories);
});

app.get('/feedback/:category', async (req, res) => {
    const feedback = await Feedback.find({ category: req.params.category })
        .select({ _id: 0, user: 0 })
        .aggregate([
            { $group: { _id: null, averageRating: { $avg: '$rating' } } },
            { $project: { averageRating: 1, comments: { $push: '$comments' } } }
        ]);
    res.json(feedback);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
