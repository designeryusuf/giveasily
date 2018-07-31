
//business reg form
function registerb(){
const email = document.getElementById('email_fieldb').value;
const password = document.getElementById('password_fieldb').value;

  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
   document.getElementById("errornotifb").innerHTML = "Error: " + errorMessage;
});
  
}

//personal reg form
function registerp(){

const email = document.getElementById('email_fieldp').value;
const password = document.getElementById('password_fieldp').value;

  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
   document.getElementById("errornotifp").innerHTML = "Error: " + errorMessage;
});

}