import express from 'express';
import { NextFunction, Request, Response } from 'express';
import { TSMap } from "typescript-map"
import  sgMail from '@sendgrid/mail'
import fs from 'fs'


// config set up

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || 8080;

const SERVER = {
    hostname: SERVER_HOSTNAME,
    port: SERVER_PORT
};


const app = express();

app.listen(SERVER.port, () => {
    console.log("Application is running in port " + SERVER.port)
});





// /** Parse the body of the request */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.raw());


// check the status of application
app.get('/health', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "OK",
        status: 200
    });
});

// send the mail
app.post('/sendmail', async (req: Request, res: Response, next: NextFunction) => {
    
    var status = await sendMail(req.body)
    var successList = []
    var failList = []
   
    for (const [key, value] of status.entries()) {
        if(value == "pass")
            successList.push(key)
        else
            failList.push(key)
    }
    return res.status(200).json({
        status: 200,
        message: 'Send email by send grid api',
        data : {
            success: successList,
            failure: failList
        }
    });
});



// //service part start

let key = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY : "" 
let sender = process.env.SENDER ? process.env.SENDER.toString() : ""
console.log(sender)
sgMail.setApiKey(key)


// take the mail request and remove dublite and send to user
const sendMail = (reqBody: any)  => { 
    let uniqueData = new TSMap<string,any>();
    let userData = reqBody["userData"];
    let emailMessage = reqBody["emailMessage"];
    let attachements = reqBody["attachements"];

    uniqueData = uniqueDublicateEmail(userData) 
    var status = message(uniqueData,emailMessage,attachements)
    return status
}

// create a full message and send
const message = async (usersData: TSMap<string,any>, emailMessage: any, attachements: any) => {
    
    var status = new TSMap<string,string>()
    let listOfCcMail = []
    let listOfBccMail = []
    let listOfTo = []

    // generate the personlization message 
    for (const [key, value] of usersData.entries()) {
        if(value.type == "to") 
            listOfTo.push(value.email)
        else if(value.type == "bcc" ) 
            listOfBccMail.push(value.email)
        else if(value.type == "cc")
            listOfCcMail.push(value.email) 
    }
    // console.log(listOfTo)
    let attachmentList = attachemntList(attachements)
    
    for (const user of listOfTo) {
        // build the message
        const msg = {
            to: {
                email:user,
                name:usersData.get(user).name}, // recipent 
            bcc: listOfBccMail, // blind carbon copy
            cc: listOfCcMail, // carbon copy
            from: sender, // sender user
            subject: 'Your result has been declared',
            text: "Hi " + usersData.get(user).name + ", your result status is " + usersData.get(user).status + ".",
            html: "Hi " + usersData.get(user).name + ", <b>your result status is " + usersData.get(user).status + ".</b>",
            attachments: attachmentList
        }
        var result = sendData(msg)
        console.log(result)
        if(await result == "pass")
            status.set(user, "pass")
        else    
            status.set(user,"fail")
        
    }
    return status
}

//get attachment list 
let attachemntList = (attachements: any) => {
    let listOfAttachment = []
    for (const attatch of attachements) {
        let pathToAttachment = attatch.path
        try {
            let attachment = fs.readFileSync(pathToAttachment).toString("base64");
            let data = {
                content: attachment,
                filename: attatch.filename,
                disposition: "attachment"
            }
            listOfAttachment.push(data)
        } catch(err) {
            console.error(err)
        } 
    }
    return listOfAttachment
}
// remove the dublicate mail
let uniqueDublicateEmail = (userData: any) => {
    var map = new TSMap<string,any>();
    for (const entity of userData) {
        if(map.has(entity.email)) {
            var newPriority = priority(entity.type)
            var oldPriority = priority(map.get(entity.email).type);
            if(newPriority > oldPriority) 
                map.set(entity.email, entity)
        } else {
            map.set(entity.email, entity)
        }
    }
    return map
}

// get the priority of type
let priority = (type: string) => {
    if(type == "to")
        return 3
    else if(type == "cc")
        return 2
    else    
        return 1
}

let sendData = async (msg: any) => {
    try {
        const res = await sgMail.send(msg);
        console.log(res[0].statusCode)
        if(res[0].statusCode.toString()[0] == '2')
            return "pass"
        else 
            return "fail"
    } catch(error) {
        console.error(error);
        return "fail"
    }
}
