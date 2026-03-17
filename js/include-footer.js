document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.getElementById("footer-container");
    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            navContainer.innerHTML = data;
            // Dispara evento cuando el nav está cargado
            document.dispatchEvent(new Event('footer-loaded'));
        })
        .catch(error => console.error("Error cargando el footer:", error));
});