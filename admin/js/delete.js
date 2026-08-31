/**
 * Shipment deletion trigger module.
 * Confirms deletion, sends DELETE request to API, updates local storage, and resets UI.
 */

export function setupDeleteShipmentAction(shipment) {
    const deleteBtn = document.getElementById("delete-shipment-btn");
    if (!deleteBtn) return;

    // Remove existing event listeners by replacing node
    const newBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);

    newBtn.addEventListener("click", async () => {
        if (!shipment || !shipment.id) return;

        const confirmResult = await Swal.fire({
            title: "Delete Shipment?",
            text: `Are you sure you want to permanently delete tracking code ${shipment.trackingcode || shipment.id}? This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete it",
            background: "#0f172a",
            color: "#fff"
        });

        if (!confirmResult.isConfirmed) return;

        const spinner = document.getElementById("spinnerModal");
        if (spinner) spinner.style.display = "flex";

        try {
            const token = localStorage.getItem("admin_session_token");
            const response = await fetch(`http://localhost:5000/address/delete-shipment?id=${shipment.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const resData = await response.json();
            if (!response.ok || !resData.success) {
                throw new Error(resData.error || "Failed to delete shipment record.");
            }

            // Remove item from local directory cache
            const cacheRaw = localStorage.getItem("admin_users_directory_cache");
            if (cacheRaw) {
                try {
                    let cache = JSON.parse(cacheRaw);
                    cache = cache.filter(item => String(item.id) !== String(shipment.id));
                    localStorage.setItem("admin_users_directory_cache", JSON.stringify(cache));
                    window.dispatchEvent(new Event("adminDirectoryCacheUpdated"));
                } catch (e) {
                    console.error("Failed to mutate cache:", e);
                }
            }

            await Swal.fire({
                title: "Deleted!",
                text: "Shipment record has been removed.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
                background: "#0f172a",
                color: "#fff"
            });

            // Reset view panes to unselected state
            const fallbackPane = document.getElementById("fallback-view-pane");
            const profilePane = document.getElementById("active-profile-pane");
            const chatPane = document.getElementById("workspace-chat-pane");

            if (profilePane) profilePane.classList.add("display-none");
            if (chatPane) chatPane.classList.add("display-none");
            if (fallbackPane) fallbackPane.classList.remove("display-none");

        } catch (err) {
            Swal.fire({
                title: "Delete Failed",
                text: err.message,
                icon: "error",
                background: "#0f172a",
                color: "#fff"
            });
        } finally {
            if (spinner) spinner.style.display = "none";
        }
    });
}