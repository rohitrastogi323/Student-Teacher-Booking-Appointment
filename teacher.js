db.collection("appointments").onSnapshot(snapshot => {
    requsets.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        requsets.innerHTML +=`
        <li>
        ${data.teacher} | ${data.data} ${data.time}
        <button onclick="approve ('${doc.id}')">Approve</button>
        </li>`;
    });
});

function approve(id){
    db.collection("appointments").doc(id).update({
        status:"Approve"
    });
}