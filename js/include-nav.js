document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("nav-container");
    fetch("components/nav.html")
        .then(response => response.text())
        .then(data => {
            navContainer.innerHTML = data;
            // Dispara evento cuando el nav está cargado
            document.dispatchEvent(new Event('nav-loaded'));
        })
        .catch(error => console.error("Error cargando el nav:", error));
});