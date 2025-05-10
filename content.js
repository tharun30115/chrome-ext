const overlay = document.createElement("div");
overlay.id = "net-speed-overlay";
overlay.textContent = "Speed: 0 Mbps";
document.body.appendChild(overlay);

window.addEventListener("updateNetworkSpeed", (event) => {
  overlay.textContent = `Speed: ${event.detail} Mbps`;
});
