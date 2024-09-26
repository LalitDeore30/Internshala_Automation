const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { runScraper } = require('./main2'); // Import the function from main.js

const app = express();
const port = 8000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/internshipDB1', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a User schema with categories field
const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    coverLetter: { type: String, required: true },
    categories: { type: [String], required: true }, // Add categories field
});

// Create a User model
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For form data
app.use(express.static('public')); // Serve static files from the 'public' directory

// Route to handle form submission
app.post('/apply', async (req, res) => {
    const { email, password, coverLetter, categories } = req.body;

    if (!email || !password || !coverLetter || !Array.isArray(categories)) {
        return res.status(400).json({ message: 'All fields are required and categories must be an array.' });
    }

    try {
        // Save user data to MongoDB
        const newUser = new User({ email, password, coverLetter, categories });
        await newUser.save();

        // Run the scraper with the user data
        await runScraper(email, password, coverLetter, categories); // Pass categories to the scraper
        res.json({ message: 'Application submitted successfully!' });
    } catch (err) {
        console.error('Error running scraper or saving user:', err);
        res.status(500).json({ message: 'Failed to submit application.' });
    }
});

// Serve the HTML file for the form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index2.html'); // Serve the HTML file
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
