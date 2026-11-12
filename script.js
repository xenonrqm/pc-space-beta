const toggleBtn = document.getElementById("toggleCategories");
const hiddenBox = document.getElementById("hiddenCategories");

hiddenBox.classList.add("hide");

toggleBtn.addEventListener("click", () => {
    hiddenBox.classList.toggle("hide");
    toggleBtn.classList.toggle("open");
});

const picksBox = document.getElementById("picksBox");

document.getElementById("picksLeft").addEventListener("click", () => {
    picksBox.scrollBy({ left: -300, behavior: "smooth" });
});

document.getElementById("picksRight").addEventListener("click", () => {
    picksBox.scrollBy({ left: 300, behavior: "smooth" });
});

document.getElementById("adminBtn").addEventListener("click", () => {
    const pass = prompt("Password:");

    if (pass === "admin1") {
        sessionStorage.setItem("adminPass", "ok");
        window.location.href = "indexAdmin.html";
    } else if (pass !== null) {
        alert("Access Blocked: Incorrect Password!");
    }
});