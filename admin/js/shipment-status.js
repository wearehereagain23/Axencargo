/**
 * Utility helper to check if admin subscription is active
 */
export function hasActiveSubscription() {
    try {
        const raw = localStorage.getItem("admin_subscription");
        return raw ? JSON.parse(raw) === true : false;
    } catch (e) {
        return false;
    }
}

/**
 * Enforces route access restrictions for premium tabs
 */
export function applySubscriptionRouteLocks() {
    const isSubscribed = hasActiveSubscription();
    const restrictedTabIds = ["pane-map-tab", "pane-invoice-tab", "pane-receipt-tab"];

    restrictedTabIds.forEach(tabId => {
        const tabEl = document.getElementById(tabId);
        if (!tabEl) return;

        if (!isSubscribed) {
            tabEl.classList.add("disabled");
            tabEl.style.opacity = "0.5";
            tabEl.style.cursor = "not-allowed";
            tabEl.setAttribute("title", "🔒 Feature locked. Active subscription required.");
        } else {
            tabEl.classList.remove("disabled");
            tabEl.style.opacity = "1";
            tabEl.style.cursor = "pointer";
            tabEl.removeAttribute("title");
        }
    });

    /**
     * Control Email Dispatcher Switch state in Form #fom4
     */
    const emailToggle = document.getElementById("sendEmailAlertToggle");
    const disabledNotice = document.getElementById("emailAlertDisabledNotice");

    if (emailToggle) {
        if (!isSubscribed) {
            emailToggle.checked = false;
            emailToggle.disabled = true;
            if (disabledNotice) disabledNotice.classList.remove("d-none");
        } else {
            emailToggle.disabled = false;
            // Check the toggle by default when subscription is active
            emailToggle.checked = true;
            if (disabledNotice) disabledNotice.classList.add("d-none");
        }
    }
}

/**
 * Custom Tab Switching Navigation interceptor with subscription checks
 */
export function setupTabSwitchingNavigation() {
    const tabLinks = document.querySelectorAll(".account-pills .nav-link");

    tabLinks.forEach(tabAnchor => {
        tabAnchor.addEventListener("click", (e) => {
            const isSubscribed = hasActiveSubscription();
            const tabId = tabAnchor.id;
            const restrictedTabs = ["pane-map-tab", "pane-invoice-tab", "pane-receipt-tab"];

            // Intercept and prevent click on restricted tabs if not subscribed
            if (restrictedTabs.includes(tabId) && !isSubscribed) {
                e.preventDefault();
                e.stopPropagation();

                if (typeof Swal !== "undefined") {
                    Swal.fire({
                        icon: "warning",
                        title: "Feature Locked",
                        text: "This feature is restricted to active admin subscribers.",
                        confirmButtonText: "Understood",
                        background: "#0f172a",
                        color: "#fff"
                    });
                }
                return false;
            }

            // Normal tab switching logic
            e.preventDefault();
            tabLinks.forEach(link => link.classList.remove("active"));
            tabAnchor.classList.add("active");

            const targetId = tabAnchor.getAttribute("href") || tabAnchor.getAttribute("data-bs-target");
            if (!targetId || !targetId.startsWith("#")) return;

            document.querySelectorAll(".tab-content > .tab-pane").forEach(pane => {
                pane.classList.remove("show", "active");
                pane.style.display = "none";
            });

            const targetedPane = document.querySelector(targetId);
            if (targetedPane) {
                targetedPane.classList.add("show", "active");
                targetedPane.style.display = "block";
            }
        });
    });

    // Initial check on load
    applySubscriptionRouteLocks();
}

/**
 * Binds submit listener to Form 4 (Shipment Status Form)
 */
export function initShipmentStatusForm(currentShipment) {
    const form = document.getElementById("fom4");
    if (!form) return;

    applySubscriptionRouteLocks();

    form.onsubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("admin_session_token");
        const isSubscribed = hasActiveSubscription();
        const sendEmail = isSubscribed && (document.getElementById("sendEmailAlertToggle")?.checked || false);

        const statusPayload = {
            id: currentShipment.id,
            activestatus: document.getElementById("activestatus")?.value,
            date: document.getElementById("Itim")?.value,
            comment: document.getElementById("cc22")?.value,
            date2: document.getElementById("Itim2")?.value,
            comment2: document.getElementById("cc222")?.value,
            date3: document.getElementById("Itim3")?.value,
            comment3: document.getElementById("cc223")?.value,
            date4: document.getElementById("Itim4")?.value,
            comment4: document.getElementById("cc224")?.value,
            date5: document.getElementById("Itim5")?.value,
            comment5: document.getElementById("cc225")?.value,
            date6: document.getElementById("Itim6")?.value,
            comment6: document.getElementById("cc226")?.value,
            sendEmailAlert: sendEmail
        };

        const spinner = document.getElementById("spinnerModal");
        if (spinner) spinner.style.display = "flex";

        try {
            const res = await fetch("https://shipping-address-opal.vercel.app/address/update-shipment-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(statusPayload)
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update shipment status.");
            }

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "success",
                    title: "Status Updated",
                    text: sendEmail ? "Status updated and email alert sent to user." : "Shipment status updated successfully.",
                    timer: 2000,
                    showConfirmButton: false,
                    background: "#0f172a",
                    color: "#fff"
                });
            }

        } catch (err) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "error",
                    title: "Update Error",
                    text: err.message,
                    background: "#0f172a",
                    color: "#fff"
                });
            }
        } finally {
            if (spinner) spinner.style.display = "none";
        }
    };
}