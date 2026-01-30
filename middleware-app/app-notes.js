import express from "express";
//middleware to parse incoming cookies off the req object and pass to the cookieValidator function
import cookieParser from "cookie-parser";


const app = express();


//must be loaded before the route path, otherwise the request would never reach it
//(because the route handler of the root path '/' terminates the request/response cycle)
const myLogger = function(req, res, next) {
    console.log('LOGGED');
    next()
}

const requestTime = function (req, res, next) {
  req.requestTime = Date.now()
  next()
}


//helper function that validates cookies using an external async service
async function cookieValidator(cookies) {
    try {
        //externalValidateCookie is just a placeholder to show where you might call an external async service
        await externalValidateCookie(cookies.testCookie);
    } catch {
        throw newError('Invalid cookies');
    }
}

//validateCookies middleware returns a promise that upon rejection will automatically trigger the error handler
async function validateCookies (req, res, next) {
    await cookieValidator(req.cookies);
    next();
}
// Note how next() is called after await cookieValidator(req.cookies). 
// This ensures that if cookieValidator resolves, the next middleware in the stack 
// will get called. If you pass anything to the next() function (except the string 'route' or 'router'),
// Express regards the current request as being an error and will skip any remaining
// non-error handling routing and middleware functions.


app.use(myLogger)
app.use(requestTime)

app.use(cookieParser())
app.use(validateCookies)

app.use((err, req, res, next) => {
    res.status(400).send(err.message);
})


app.get('/', (req, res) => {
    let responseText = 'Hello World!<br>';
    responseText += `<small>Requested at: ${req.requestTime}<small>`;
    res.send(responseText); //cycle ends at a res.send()
    
})

app.listen(3000)