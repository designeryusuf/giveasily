
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      console.log('signed in');
      //window.location = 'welcome.html';
      //window.alert ('welcome! You are signed in');
      
      document.getElementById('register-wrapper').style.display = "none";
      document.getElementById('welcomer').style.display = "block";
      if(user != null){

      var email_id = user.email;
      document.getElementById("cemail").innerHTML = email_id;

    }

    var user = firebase.auth().currentUser;

    user.sendEmailVerification().then(function() {
      // Email sent.
    }).catch(function(error) {
      // An error happened.
    });




    } else {
      // No user is signed in.
     //window.alert('you are not logged in');
     console.log('you are signed out')
    // window.location = 'login.html';
    document.getElementById('register-wrapper').style.display = "block";
    document.getElementById('welcomer').style.display = "none";

    }
  });
  