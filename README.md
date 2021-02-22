//install the require setup

npm init
tsc --init
clear
npm install -g typescript nodemon ts-node prettier
sudo npm install -g typescript nodemon ts-node prettier
clear
npm install express
npm install --save-dev @types/express 
npm install typescript-map
npm install --save @sendgrid/mail

// setup the key and sender details
echo "export SENDGRID_API_KEY='YOUR_API_KEY'" > sendgrid.env
echo "export SENDER_EMAIL='sender_email'" > sendgrid.env
echo "sendgrid.env" >> .gitignore
source ./sendgrid.env

// api's

//1. check the application health status

GET_REQUEST
	http://localhost:8080/health
Response
	{
	    "message": "OK",
	    "status": 200
	}

//2. send the mail
POST_REQUEST
	http://localhost:8080/sendmail
	
REQUEST_BODY
	{
    "userData": [
        {
            "email":"verma1511amit@gmail.com",
            "name":"amit verrma",
            "status":"pass",
            "type": "to"
        },
        {
            "email":"verma151196amit@gmail.com",
            "name":"amit verma",
            "status":"pass",
            "type": "bcc"
        },
        {
            "email":"arjunpal1104@gmail.com",
            "name":"amit verma",
            "status":"pass",
            "type": "cc"
        }

    ],
    "emailMessage": "hi {name}, <b> your result is {status}.</b>",
    "attachements": [
        {
            "filename" : "test.png",
            "path" : "/home/amit_verma/Pictures/test.png"
        }
    ]
}


RESPONSE
	{
    "status": 200,
    "message": "Send email by send grid api",
    "data": {
        "success": [],
        "failure": [
            "verma1511amit@gmail.com"
        ]
    }
}


// commands for building the application
	npm run build
// command for clean
	npm run clean
// command for start application
	npm run start




