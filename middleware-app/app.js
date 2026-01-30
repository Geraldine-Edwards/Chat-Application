import express from "express";


const app = express();

const usernameHeader = function(req, res, next) {
    //use req.get() to read the header
    const username = req.get('X-Username'); //or req.header['x-username']
    //modify the req to add a username property and set to the header value, or null if not set
    req.username = username ? username: null;
    next();
}

app.use (express.json()); //is built in middleware to parse JSON

const validateBodyIsArrayOfStrings = function(req, res, next) {

    if (!Array.isArray(req.body) || !req.body.every(item => typeof item === 'string')) {
        return res.status(400).send("Expected the request body to be a JSON array of strings")
    }
    next()
}

app.post('/', usernameHeader, validateBodyIsArrayOfStrings, (req, res) => {
    let authenticatedResponse;
    if (!req.username) {
        authenticatedResponse = "You are not authenticated.";
    }
    authenticatedResponse = `You are authenticated as ${req.username}.`;

    const subjects = req.body;
    const count = subjects.length;
    //get the right plural ending (0 or  > 1 = 'subjects')
    const subjectName = count === 1 ? "subject" : "subjects";
    const subjectList = count > 0 ? `: ${subjects.join(", ")}` : "";
    
    const subjectsResponse = `You have requested information about ${count} ${subjectName}: ${subjectList}.`;
    res.send(`${authenticatedResponse}\n\n${subjectsResponse}`);
})

//when you test this with curl make sure that the Content-Tpe header is set as application/Json

//missing it: curl -X POST --data '["Bees"]' -H "X-Username: Ahmed" http://localhost:3000
//returns: Expected the request body to be a JSON array of strings

//using it: curl -X POST --data '["Bees"]' -H "Content-Type: application/json" -H "X-Username: Ahmed" http://localhost:3000
//returns: You are authenticated as Ahmed. You have requested information about 1 subject: : Bees.

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});