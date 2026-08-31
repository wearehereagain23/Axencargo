import { syncUserProfileFormFields } from "./shipment.js";
import { setupSecureChatChannel } from "./chat.js";
import { initProfileImageActionsPipeline } from "./shipment-image.js";
import { setupDeleteShipmentAction } from "./delete.js";
import { setupTabSwitchingNavigation, initShipmentStatusForm } from "./shipment-status.js";
import { syncMailFormFields, getMailPayload, executeMailDispatch } from "./mail-system.js";

export let masterAccountRegistryCache = [];
export let currentlySelectedAccountObj = null;

/**
 * Checks subscription status stored in localStorage from `/address/admin-users` response or user object
 */
export function checkIsAdminSubscribed() {
    const rawSub = localStorage.getItem("admin_subscription");
    if (rawSub !== null) {
        try {
            return Boolean(JSON.parse(rawSub));
        } catch (e) {
            // Fallback parsing
        }
    }

    const adminUser = JSON.parse(localStorage.getItem("admin_user_profile") || localStorage.getItem("admin_user") || "{}");
    return Boolean(
        adminUser.is_subscribed === true ||
        adminUser.subscription_status === "active" ||
        adminUser.is_premium === true ||
        adminUser.plan === "premium"
    );
}

export function handleAdministrativeSignOut() {
    localStorage.removeItem("admin_session_token");
    localStorage.removeItem("admin_users_directory_cache");
    localStorage.removeItem("admin_subscription");
    window.location.href = "./login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const adminToken = localStorage.getItem("admin_session_token");
    if (!adminToken) {
        window.location.href = "./login.html";
        return;
    }

    const searchFilterInput = document.getElementById("directory-search-input");
    const logoutActionTrigger = document.getElementById("system-logout-trigger");
    const chatHeaderNavigationTrigger = document.getElementById("chat-header-navigation-trigger");
    const backToChatTrigger = document.getElementById("back-to-chat-trigger");

    const localSavedCache = localStorage.getItem("admin_users_directory_cache");

    if (localSavedCache) {
        try {
            masterAccountRegistryCache = JSON.parse(localSavedCache);
            hydrateUserStreamInterface(masterAccountRegistryCache);
        } catch (cacheErr) {
            console.warn("⚠️ Local storage parsing warning:", cacheErr);
        }
    } else {
        const streamTargetNode = document.getElementById("user-stream-target");
        if (streamTargetNode) {
            streamTargetNode.innerHTML = `
                <div id="directory-skeleton-loader" style="padding: 30px; text-align: center; color: #64748b; font-size: 13px;">
                    <p>Loading shipment records...</p>
                </div>`;
        }
    }

    fetchUserDirectoryRegistry(adminToken);

    if (searchFilterInput) {
        searchFilterInput.addEventListener("input", (e) => {
            executeRegistrySearchFilter(e.target.value.toLowerCase().trim());
        });
    }

    if (chatHeaderNavigationTrigger) {
        chatHeaderNavigationTrigger.addEventListener("click", (e) => {
            if (!currentlySelectedAccountObj) return;
            e.stopPropagation();

            const chatPane = document.getElementById("workspace-chat-pane");
            if (chatPane) {
                chatPane.classList.add("display-none");
                chatPane.classList.remove("mobile-active-view-pane");
            }

            const profilePane = document.getElementById("active-profile-pane");
            if (profilePane) {
                profilePane.classList.remove("display-none");
                profilePane.classList.add("mobile-active-view-pane");
            }

            routeActiveWorkspaceViewContext(currentlySelectedAccountObj);
        });
    }

    if (backToChatTrigger) {
        backToChatTrigger.addEventListener("click", (e) => {
            e.stopPropagation();

            const profilePane = document.getElementById("active-profile-pane");
            if (profilePane) {
                profilePane.classList.add("display-none");
                profilePane.classList.remove("mobile-active-view-pane");
            }

            const chatPane = document.getElementById("workspace-chat-pane");
            if (chatPane) {
                chatPane.classList.remove("display-none");
                chatPane.classList.add("mobile-active-view-pane");
            }
        });
    }

    setupTabSwitchingNavigation();
    initEmailDispatcher();

    if (logoutActionTrigger) {
        logoutActionTrigger.addEventListener("click", () => {
            handleAdministrativeSignOut();
        });
    }
});

export async function fetchUserDirectoryRegistry(bearerTokenString) {
    try {
        const response = await fetch("http://localhost:5000/address/admin-users", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${bearerTokenString}`,
                "Content-Type": "application/json",
                "x-setting-target": "axencargo"
            }
        });

        if (response.status === 401) {
            handleAdministrativeSignOut();
            return;
        }

        const dynamicData = await response.json();

        if (!response.ok || !dynamicData.success) {
            const errStr = (dynamicData.error || "").toLowerCase();
            if (errStr.includes("jwt expired") || errStr.includes("token expired") || errStr.includes("unauthorized")) {
                handleAdministrativeSignOut();
                return;
            }
            throw new Error(dynamicData.error || "Server boundary data fetch error.");
        }

        const subscriptionStatus = Boolean(dynamicData.admin_subscription);
        localStorage.setItem("admin_subscription", JSON.stringify(subscriptionStatus));

        const newCacheString = JSON.stringify(dynamicData.users);
        const oldCacheString = localStorage.getItem("admin_users_directory_cache");

        if (newCacheString !== oldCacheString) {
            localStorage.setItem("admin_users_directory_cache", newCacheString);
            window.dispatchEvent(new Event("adminDirectoryCacheUpdated"));
        }

    } catch (err) {
        console.error("Critical Stream Registry Pull Failure:", err);
        if (!masterAccountRegistryCache || masterAccountRegistryCache.length === 0) {
            const streamTargetNode = document.getElementById("user-stream-target");
            if (streamTargetNode) {
                streamTargetNode.innerHTML = `
                    <div style="padding: 16px; text-align: center; color: #ef4444; font-size: 13px;">
                        <p>Failed to sync shipment database logs.</p>
                        <small>${err.message}</small>
                    </div>`;
            }
        }
    }
}

function hydrateUserStreamInterface(targetShipmentList) {
    const streamTargetNode = document.getElementById("user-stream-target");
    if (!streamTargetNode) return;

    streamTargetNode.innerHTML = "";

    targetShipmentList.forEach((shipment) => {
        const cardItem = document.createElement("div");
        cardItem.className = "user-stream-item-card";

        if (currentlySelectedAccountObj && currentlySelectedAccountObj.id === shipment.id) {
            cardItem.classList.add("is-active-card");
        }

        const fullName = shipment.fullname || "Unnamed Shipment";
        const initialChar = fullName.charAt(0).toUpperCase();
        let avatarHTML = `<div class="card-avatar-node">${initialChar}</div>`;

        if (shipment.shipment_image && shipment.shipment_image.trim() !== "") {
            avatarHTML = `
                <div class="card-avatar-node" style="background:transparent;">
                    <img src="${shipment.shipment_image.trim()}" onerror="this.style.display='none'; this.parentElement.innerText='${initialChar}'; this.parentElement.style.background='var(--border-interactive)';" alt="Shipment Image">
                </div>`;
        }

        const trackingCode = shipment.trackingcode || "N/A";
        const statusText = shipment.activestatus || shipment.trackingStatus || "In Transit";

        cardItem.innerHTML = `
            ${avatarHTML}
            <div class="card-text-details-pane">
                <div class="card-row-top">
                    <h4 class="card-user-fullname">${fullName}</h4>
                    <span class="card-user-balance-badge" style="background:#0284c7; color:#fff;">${statusText}</span>
                </div>
                <div class="card-row-bottom">
                    <span class="card-user-account-no">${trackingCode}</span>
                    <span class="card-status-flag flag-active">${shipment.carrier || "Courier"}</span>
                </div>
            </div>`;

        cardItem.addEventListener("click", () => {
            currentlySelectedAccountObj = shipment;
            document.querySelectorAll(".user-stream-item-card").forEach(c => {
                c.classList.remove("is-active-card");
            });
            cardItem.classList.add("is-active-card");
            openMessengerWorkspacePane(shipment);
        });

        streamTargetNode.appendChild(cardItem);
    });
}

function openMessengerWorkspacePane(shipment) {
    const fallbackPane = document.getElementById("fallback-view-pane");
    if (fallbackPane) fallbackPane.classList.add("display-none");

    const profilePane = document.getElementById("active-profile-pane");
    if (profilePane) profilePane.classList.add("display-none");

    const workspaceChatPane = document.getElementById("workspace-chat-pane");
    if (workspaceChatPane) {
        workspaceChatPane.classList.remove("display-none");
        workspaceChatPane.classList.add("mobile-active-view-pane");
    }

    const chatTitleNode = document.getElementById("chat-title-fullname");
    if (chatTitleNode) {
        chatTitleNode.innerText = shipment.fullname || "Unnamed Shipment";
    }

    const chatAvatar = document.getElementById("chat-avatar-target");
    if (chatAvatar) {
        if (shipment.shipment_image && shipment.shipment_image.trim() !== "") {
            chatAvatar.innerHTML = `<img src="${shipment.shipment_image.trim()}" alt="Shipment Image">`;
            chatAvatar.style.background = "transparent";
        } else {
            chatAvatar.innerText = (shipment.fullname || "S").charAt(0).toUpperCase();
            chatAvatar.style.background = "var(--border-interactive)";
        }
    }

    if (workspaceChatPane) {
        const mobileBackNavTrigger = workspaceChatPane.querySelector(".back-to-list-trigger");
        if (mobileBackNavTrigger) {
            mobileBackNavTrigger.onclick = (e) => {
                e.stopPropagation();
                workspaceChatPane.classList.remove("mobile-active-view-pane");
                workspaceChatPane.classList.add("display-none");

                const fallbackPaneRef = document.getElementById("fallback-view-pane");
                if (fallbackPaneRef) fallbackPaneRef.classList.remove("display-none");
            };
        }
    }

    setupSecureChatChannel(shipment.trackingcode || shipment.code || shipment.id);
}

export function routeActiveWorkspaceViewContext(shipment) {
    currentlySelectedAccountObj = shipment;

    const fullNameNode = document.getElementById("profile-summary-fullname");
    const emailNode = document.getElementById("profile-summary-email-sub");

    if (fullNameNode) fullNameNode.innerText = shipment.fullname || "N/A";
    if (emailNode) emailNode.innerText = shipment.email || "No Email Provided";

    const targetWorkspacePane = document.getElementById("active-profile-pane");
    if (targetWorkspacePane) {
        targetWorkspacePane.classList.remove("display-none");
        if (window.innerWidth <= 768) {
            targetWorkspacePane.classList.add("mobile-active-view-pane");
        }
    }

    // TOGGLE SHIPMENT AVATAR CARD BASED ON SUBSCRIPTION
    const avatarCard = document.querySelector(".whatsapp-profile-avatar-card");
    if (avatarCard) {
        const isSubscribed = checkIsAdminSubscribed();
        avatarCard.style.display = isSubscribed ? "block" : "none";
    }

    syncUserProfileFormFields(shipment);
    initProfileImageActionsPipeline(shipment);
    setupDeleteShipmentAction(shipment);
    syncMailFormFields(shipment);
    initShipmentStatusForm(shipment);
}

function initEmailDispatcher() {
    const emailForm = document.getElementById("emailDispatchForm");
    if (!emailForm) return;

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitButton = emailForm.querySelector("button[type='submit']");
        const originalButtonHTML = submitButton ? submitButton.innerHTML : "";

        if (!currentlySelectedAccountObj || !currentlySelectedAccountObj.id) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "warning",
                    title: "No Shipment Selected",
                    text: "Please select an active shipment from the directory first."
                });
            }
            return;
        }

        const payload = getMailPayload();

        if (!payload.recipientEmail || !payload.supportMessage) {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: "warning",
                    title: "Missing Fields",
                    text: "Recipient email and message body are required."
                });
            }
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = "Sending...";
        }

        try {
            await executeMailDispatch(currentlySelectedAccountObj.id, payload);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
            }
        }
    });
}

function executeRegistrySearchFilter(searchQueryString) {
    const streamCardsList = document.querySelectorAll(".user-stream-item-card");
    streamCardsList.forEach(card => {
        const fullContentText = card.textContent.toLowerCase();
        if (fullContentText.includes(searchQueryString)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

window.addEventListener("adminDirectoryCacheUpdated", () => {
    const cacheString = localStorage.getItem("admin_users_directory_cache");
    if (!cacheString) return;

    try {
        masterAccountRegistryCache = JSON.parse(cacheString);
        hydrateUserStreamInterface(masterAccountRegistryCache);

        if (currentlySelectedAccountObj) {
            const updatedData = masterAccountRegistryCache.find(u => u.id === currentlySelectedAccountObj.id);
            if (updatedData) {
                currentlySelectedAccountObj = updatedData;
                const freshImageSrc = currentlySelectedAccountObj.shipment_image ? currentlySelectedAccountObj.shipment_image.trim() : "";

                const profileDisplayBubble = document.getElementById("profile-avatar-target-display");
                if (profileDisplayBubble) {
                    if (freshImageSrc !== "") {
                        profileDisplayBubble.innerHTML = `<img src="${freshImageSrc}" alt="Shipment Image">`;
                        profileDisplayBubble.style.background = "transparent";
                    } else {
                        profileDisplayBubble.innerText = (currentlySelectedAccountObj.fullname || "S").charAt(0).toUpperCase();
                        profileDisplayBubble.style.background = "var(--bg-workspace-dark)";
                    }
                }
            }
        }
    } catch (err) {
        console.error("⚠️ Cache Update Interface Exception:", err);
    }
});