//login button
function login(){
//get elements
const email = document.getElementById('email_field').value;
const password = document.getElementById('password_field').value;

firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  
  document.getElementById("errornotif").innerHTML = "Error: " + errorMessage;
});
}

//Get User Profile

var user = firebase.auth().currentUser;
var name, email, photoUrl, uid, emailVerified;

if (user != null) {
  name = user.displayName;
  email = user.email;
  photoUrl = user.photoURL;
  emailVerified = user.emailVerified;
  uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
                   // this value to authenticate with your backend server, if
                   // you have one. Use User.getToken() instead.
}

var user = firebase.auth().currentUser;



//send verification email

if (user != null && !emailVerified) {
	user.sendEmailVerification().then(function() {
  console.log('Verification Email sent.');
}).catch(function(error) {
  // An error happened.
});

}

//Get a user's provider-specific profile information

var user = firebase.auth().currentUser;

if (user != null) {
  user.providerData.forEach(function (profile) {
    console.log("Sign-in provider: " + profile.providerId);
    console.log("  Provider-specific UID: " + profile.uid);
    console.log("  Name: " + profile.displayName);
    console.log("  Email: " + profile.email);
    console.log("  Photo URL: " + profile.photoURL);
  });
}

