# MyCorks

A web application for managing wine bottle collections.

## Setup

1. Clone the repository
1. Copy `firebase-config.template.js` to `firebase-config.js`
1. Replace the placeholder values in `firebase-config.js` with your Firebase project configuration
1. Open `index.html` in your browser

## Firebase Configuration

To get your Firebase configuration:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to the "Your apps" section
6. Click the web icon (</>)
7. Register your app with a nickname
8. Copy the configuration object
9. Replace the placeholder values in `firebase-config.js`

## Security

Never commit your `firebase-config.js` file to version control as it contains sensitive information. The file is already added to `.gitignore`. 