<div align="center">
  <p>
    <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/SinisterDeveloper/quiz-maker?style=plastic&label=Version&logo=github">
    <img alt="CodeFactor Grade" src="https://img.shields.io/codefactor/grade/github/SinisterDeveloper/quiz-maker?style=plastic&logo=codefactor">
    <img alt="GitHub Issues" src="https://img.shields.io/github/issues/SinisterDeveloper/quiz-maker?style=plastic&logo=github&label=Issues&color=blue">
    <img alt="GitHub License" src="https://img.shields.io/github/license/SinisterDeveloper/quiz-maker?style=plastic&label=License&color=blue">
  </p>
</div>

# quiz-maker

Lightweight, AI-enhanced platform for effortless quiz creation and sharing with lightning-fast performance

# Setup

tldr: 
You can watch the setup tutorial [_here_](https://github.com/SinisterDeveloper/quiz-maker?tab=readme-ov-file#setup-and-configuration)

## Prerequisites

* **[node.js](https://nodejs.org/en/)** - > Version **16.20.1 or higher**
* **[MongoDB Cluster](https://www.mongodb.com/)** - > Free Tier or higher

## Clone the repository using Git or GitHub Desktop

Navigate to the folder in the terminal

```bash
cd quiz-maker
```

## Install the dependencies by running `npm i` in the terminal

## Customizing Environment Variables

Rename the `.env.example` file into `.env` and open the file.

### Port

`PORT` is preset to `3000`, however, if another instance is already running on that port, you can change it to something else (ex 5000)

### MongoDB Connection URI

Fill the `MONGO_URI` field with your MongoDB Cluster's Connection Uri. If you do not know how to fetch the uri string, please read **[here](https://docs.mongodb.com/guides/cloud/connectionstring/)**
(enter the URI within the double-quotes)

### Password

This is the Administrator password to be used while logging in to the project dashboard to perform actions. It is Case Sensitive!
(enter the password within the double-quotes)

### Maximum Requests Per Second

Avoiding spam is necessary for smooth functioning. Similar to PORT, this is preset to `4` which is the recommended value

### CLOUDFARE_USER_ID & CLOUDFARE_API_KEY

To utilise the productive AI features, you need to signup for a Cloudfare Account (free) and [_fetch the UserID and API Key here_](https://developers.cloudflare.com/workers-ai/get-started/rest-api/#1-get-api-token-and-account-id) and enter them into the respective field in the `.env` file
(enter the fields within the double-quotes)

Your `.env` should look something like this:

```env
# Required

PORT="3000"

MONGO_URI="YOUR_MONGO_URI"

PASSWORD="YOUR_ADMIN_PASSWORD"

MAX_REQUESTS_PER_SECOND=4

# Optional (Required if you want to use the AI features)

CLOUDFARE_USER_ID=""

CLOUDFARE_API_KEY=""
```

# Starting the Application

## First Time Usage/Testing

If you are checking out the application for the first time or using it for a very short period of time, run the following in the terminal:

```bash
npm start
```

## Deployment

If you are deploying this for an event or production, you should use [PM2](https://pm2.io/) (free) so that the server restarts automatically in case of a shutdown.

```bash
npm i -g pm2

npm run production
```

If you get any error while starting the application, especially if it a `MongoError`, it means your MONGO_URI was invalid.

🎉🎉 Congratulations! Your Web Application is now online: `http://localhost:{PORT}/`

# Tutorials

## Setup and Configuration

https://github.com/user-attachments/assets/4e2d0748-c283-4b88-9220-dcf7a151eed9

## Usage of the Application

Read the [Guide/Wiki](https://github.com/SinisterDeveloper/quiz-maker/wiki) to learn how to use and operate the application

# Accessing the Application from another device

`ExpressJS` defaults to creating a localhost instance which you cannot access from other devices. However, if you want do want other devices accessing it:

* Open `index.js` file using any basic text editor
* Navigate to `App.listen(process.env.PORT...)` function (line 59)
* Replace the entire code block (lines 59-63) with the below code:

```javascript
App.listen(process.env.PORT, '0.0.0.0', () => {
	misc(
		`Admin Dashboard running on http://localhost:${process.env.PORT}/dashboard`,
	);
});
```

Restart the application and other devices should be able to access your application at: `http://{SYSTEM_IP_ADDRESS}:{PORT}/`

If the application is still inaccessible from other devices, please check your firewall configurations to allow other devices to access

# Issues/Bugs

If you feel there is an issue, kindly email me at `thesinisterdev@gmail.com`. Alternatively, you can open an issue in the repository, however, the email method would be faster

Hope you enjoy using the application! You can raise feature requests similarly by email or raising an issue!

A [_small one-time donation_](https://buymeacoffee.com/sinisterdeveloper) would be very much appreciated!



