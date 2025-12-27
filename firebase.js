const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId:"YOUR_PROJECT_ID",
};

firebase.initailizeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();