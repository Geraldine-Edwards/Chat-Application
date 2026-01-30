import express from "express";


const app = express();

//custom middleware
const usernameHeader = function(req, res, next) {
    //use req.get() to read the header
    const username = req.get('X-Username'); //or req.header['x-username']
    //modify the req to add a username property and set to the header value, or null if not set
    req.username = username ? username: null;
    next();
}

//built in, off-the-shelf middleware to parse JSON
app.use (express.json()); 


app.post('/', usernameHeader, (req, res) => {
    let authenticatedResponse;
    if (!req.username) {
        authenticatedResponse = "You are not authenticated.";
    }
    authenticatedResponse = `You are authenticated as ${req.username}.`;

    //still check req.body is array of strings
    const subjects = Array.isArray(req.body) ? req.body : [];
    const count = subjects.length;
    //get the right plural ending (0 or  > 1 = 'subjects')
    const subjectName = count === 1 ? "subject" : "subjects";
    const subjectList = count > 0 ? `: ${subjects.join(", ")}` : "";
    const subjectsResponse = `You have requested information about ${count} ${subjectName}: ${subjectList}.`; 
    res.send(`${authenticatedResponse}\n\n${subjectsResponse}`);
})

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});