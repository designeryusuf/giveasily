function signout(){
	firebase.auth().signOut();
	//window.alert('signed out');
	console.log ('signed out');
}