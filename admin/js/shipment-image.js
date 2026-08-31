/**
 * Helper function to check if the current logged-in admin has an active subscription
 */
function checkIsAdminSubscribed() {
    const rawSub = localStorage.getItem("admin_subscription");
    if (rawSub !== null) {
        try {
            return Boolean(JSON.parse(rawSub));
        } catch (e) {
            // Fallback parsing if JSON parsing fails
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

export function initProfileImageActionsPipeline(account) {
    const avatarCard = document.querySelector(".whatsapp-profile-avatar-card");
    const isSubscribed = checkIsAdminSubscribed();

    // Hide card container if the admin is unsubscribed
    if (avatarCard) {
        avatarCard.style.display = isSubscribed ? "block" : "none";
    }

    // Stop execution early if the admin is not subscribed or if required DOM nodes missing
    if (!isSubscribed) return;

    const triggerArea = document.getElementById("profile-avatar-action-trigger");
    const displayBubble = document.getElementById("profile-avatar-target-display");
    if (!triggerArea || !displayBubble) return;

    const initial = (account.fullname || account.firstname || account.trackingcode || "S").charAt(0).toUpperCase();

    // Check both potential image properties from DB response
    const currentImageUrl = account.shipment_image || account.image;

    const updateDisplay = (url) => {
        if (url && url.trim() !== "") {
            displayBubble.innerHTML = `<img src="${url.trim()}" alt="Profile">`;
            displayBubble.style.background = "transparent";
        } else {
            displayBubble.innerText = initial;
            displayBubble.style.background = "var(--bg-workspace-dark)";
        }
    };

    updateDisplay(currentImageUrl);

    triggerArea.onclick = () => {
        if (!checkIsAdminSubscribed()) {
            Swal.fire({
                icon: 'warning',
                title: 'Subscription Required',
                text: 'Image modifications are restricted for unsubscribed administrators.',
                background: '#0f172a',
                color: '#ffffff',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        const activeImage = account.shipment_image || account.image;
        const hasImage = !!(activeImage && activeImage.trim() !== "");

        Swal.fire({
            title: 'Profile Avatar Control',
            text: 'Choose an administrative operation context action to update storage nodes:',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: hasImage ? 'View Photo' : 'Upload New Photo',
            denyButtonText: 'Upload New Photo',
            cancelButtonText: 'Close Panel',
            showDenyButton: hasImage,
            footer: hasImage ? `<button id="swal-destructive-image-purge-btn" class="swal2-styled swal2-deny" style="background-color: var(--status-blocked-red); padding: 6px 12px; font-size: 12px; border-radius: 4px;">Delete Profile Image Asset</button>` : '',
            didOpen: () => {
                const destructivePurgeBtn = document.getElementById("swal-destructive-image-purge-btn");
                if (destructivePurgeBtn) {
                    destructivePurgeBtn.onclick = () => {
                        Swal.close();
                        executeAvatarNetworkAction(account, null, "delete");
                    };
                }
            }
        }).then((result) => {
            if (result.isConfirmed && !hasImage) {
                triggerNativeFileUploaderSequence(account);
            } else if (result.isConfirmed && hasImage) {
                Swal.fire({
                    imageUrl: activeImage,
                    imageAlt: 'Profile Visual Area',
                    background: '#0f172a',
                    confirmButtonText: 'Close',
                    confirmButtonColor: '#475569'
                });
            } else if (result.isDenied) {
                triggerNativeFileUploaderSequence(account);
            }
        });
    };
}

function triggerNativeFileUploaderSequence(account) {
    if (!checkIsAdminSubscribed()) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'Active admin subscription required to perform file uploads.',
            background: '#0f172a',
            color: '#ffffff'
        });
        return;
    }

    const standaloneInput = document.createElement("input");
    standaloneInput.type = "file";
    standaloneInput.accept = "image/*";
    standaloneInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            executeAvatarNetworkAction(account, e.target.files[0], "upload");
        }
    };
    standaloneInput.click();
}

async function executeAvatarNetworkAction(account, fileObject, streamActionType) {
    if (!checkIsAdminSubscribed()) {
        Swal.fire({
            icon: 'error',
            title: 'Process Refused',
            text: 'Unsubscribed account cannot initiate media modifications.',
            background: '#0f172a',
            color: '#ffffff'
        });
        return;
    }

    const adminToken = localStorage.getItem("admin_session_token");
    const targetUrl = "http://localhost:5000/address/avatar";

    // Pass trackingcode in X-Tracking-Code header
    const trackingCode = account.trackingcode || account.tracking_code || account.tracking;

    const headers = {
        "Authorization": `Bearer ${adminToken}`,
        "X-Tracking-Code": trackingCode
    };
    let bodyPayload;

    let backupUrl = account.shipment_image || account.image;
    let temporaryLocalUrl = null;

    if (streamActionType === "delete") {
        headers["X-Action"] = "delete";
        account.shipment_image = null;
        delete account.image;
    } else {
        headers["X-Action"] = "avatar";
        bodyPayload = new FormData();
        bodyPayload.append("avatar", fileObject);

        temporaryLocalUrl = URL.createObjectURL(fileObject);
        account.shipment_image = temporaryLocalUrl;
        delete account.image;
    }

    updateLocalCacheRecordWithMutations(account);

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: headers,
            body: bodyPayload
        });

        const data = await response.json();

        if (data.success) {
            const finalImageUrl = data.imageUrl || null;

            account.shipment_image = finalImageUrl;
            delete account.image;

            updateLocalCacheRecordWithMutations(account);

            Swal.fire({
                icon: 'success',
                title: 'Synchronized',
                text: 'Profile image modified and saved permanently to server database table.',
                timer: 1500,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#ffffff'
            });
        } else {
            throw new Error(data.error || "Execution dropped.");
        }
    } catch (err) {
        account.shipment_image = backupUrl;
        updateLocalCacheRecordWithMutations(account);

        Swal.fire({
            icon: 'error',
            title: 'Process Refused',
            text: err.message,
            background: '#0f172a',
            color: '#ffffff'
        });
    } finally {
        if (temporaryLocalUrl) {
            URL.revokeObjectURL(temporaryLocalUrl);
        }
    }
}

function updateLocalCacheRecordWithMutations(modifiedAccount) {
    const localSavedCache = localStorage.getItem("admin_users_directory_cache");
    if (!localSavedCache) return;

    try {
        let registryList = JSON.parse(localSavedCache);
        const indexMatch = registryList.findIndex(u =>
            (u.trackingcode && u.trackingcode === modifiedAccount.trackingcode) ||
            (u.id && u.id === modifiedAccount.id)
        );

        if (indexMatch !== -1) {
            registryList[indexMatch] = modifiedAccount;
            localStorage.setItem("admin_users_directory_cache", JSON.stringify(registryList));
            window.dispatchEvent(new Event("adminDirectoryCacheUpdated"));
        }
    } catch (err) {
        console.error("Local tracking mirror injection exception:", err);
    }
}