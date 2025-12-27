function bookAppointment(){
    db.collection("appointments").add({
        teacher: teacher.value,
        data: data.value,
        time: time.value,
        status:"Pending"
    });
}

db.collection("appointments").onSnapshot(snapshot => {
    bookAppointment.innerHTML = "";
    snapshot.forEach(doc => {
    appointments.innerHTML += `<li>${doc.data().teacher} - ${doc.data().status}</li>`;
    });
});