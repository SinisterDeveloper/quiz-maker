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

## Prerequisites

-   **[node.js](https://nodejs.org/en/)** - > Version **16.20.1 or higher**
-   **[MongoDB Cluster](https://www.mongodb.com/)** - > Free Tier or higher

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

### GEMINI_API_KEY

To utilise the productive AI features, you need to [_obtain a Gemini API Key_](https://aistudio.google.com/apikey) and enter them into the respective field in the `.env` file
(enter the fields within the double-quotes)

Your `.env` should look something like this:

```env
# Required

PORT="3000"

MONGO_URI="YOUR_MONGO_URI"

PASSWORD="YOUR_ADMIN_PASSWORD"

MAX_REQUESTS_PER_SECOND=4

# Optional (Required if you want to use the AI features)

GEMINI_API_KEY=""
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

If you get any error while starting the application, especially if it is a `MongoError`, it means your MONGO_URI was invalid.

🎉🎉 Congratulations! Your Web Application is now online: `http://localhost:{PORT}/`

# Tutorials

## Setup and Configuration

Read the [Guide/Wiki](https://github.com/SinisterDeveloper/quiz-maker/wiki) to learn how to use and operate the application

# Issues/Bugs

If you feel there is an issue, kindly email me at `thesinisterdev@gmail.com`. Alternatively, you can open an issue in the repository, however, the email method would be faster

Hope you enjoy using the application! You can raise feature requests similarly by email or raising an issue!
