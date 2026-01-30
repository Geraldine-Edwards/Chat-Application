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

//custom middleware
const parseAndValidateBody = function(req, res, next) {
    // collect incoming data chunks (bytes) from the request body in addQuote() function from display-quotes.js
    const bodyBytes = [];
    req.on("data", chunk => bodyBytes.push(...chunk));

    // 'end' signals all data has been received, so can then process the complete body
    req.on("end", () => {
        //Buffer is a special object used to store raw binary data in memory
        const bodyString = Buffer.from(bodyBytes).toString();
        let body;
        try {
            body = JSON.parse(bodyString);
        } catch (error) {
            return res.status(400).json({ error: "Invalid data format: Please send valid JSON." });
        }
        if (!Array.isArray(body) || !body.every(item => typeof item === 'string')) {
            return res.status(400).send("Expected the request body to be a JSON array of strings")
        }
        req.body = body;
        next()
    });
}


app.post('/', usernameHeader, parseAndValidateBody, (req, res) => {
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
    
    const subjectsResponse = `You have requested information about ${count} ${subjectName}${subjectList}.`;
    res.send(`${authenticatedResponse}\n\n${subjectsResponse}`);
})

//when you test this with curl make sure that the Content-Type header is set as application/json
//as per the Sprint 3/Prep curl instructions:-

//missing it: curl -X POST --data '["Bees"]' -H "X-Username: Ahmed" http://localhost:3000
//returns: Expected the request body to be a JSON array of strings

//using it: curl -X POST --data '["Bees"]' -H "Content-Type: application/json" -H "X-Username: Ahmed" http://localhost:3000
//returns: You are authenticated as Ahmed. You have requested information about 1 subject: : Bees.

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});