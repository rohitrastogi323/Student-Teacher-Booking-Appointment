function login(){
    const email = email.value;
    const password = password.value;
    const role = document.getElementById("role").value;

    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        if (role === "student"){
            window.location.href = "dashboard-student.html";
        } else{
            window.location.href = "dashboard-teacher.html";
        }
    })

    .catch(err => alert (err.message));
}