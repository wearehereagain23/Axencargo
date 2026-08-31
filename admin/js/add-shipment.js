document.addEventListener("DOMContentLoaded", () => {
    initStepNavigation();
    initShipmentFormSubmission();
    checkAdminSubscriptionUI();
});

/**
 * Helper to check if the active admin has a premium/active subscription
 */
function checkIsAdminSubscribed() {
    const adminSessionToken = localStorage.getItem("admin_session_token");
    const adminUser = JSON.parse(localStorage.getItem("admin_user_profile") || localStorage.getItem("admin_user") || "{}");

    // Returns true only if explicitly subscribed / active
    return Boolean(
        adminUser.is_subscribed === true ||
        adminUser.subscription_status === "active" ||
        adminUser.is_premium === true ||
        adminUser.plan === "premium"
    );
}

/**
 * Handle UI states for Step 4 image input based on subscription
 */
function checkAdminSubscriptionUI() {
    const fileInput = document.getElementById("shipment_image");
    if (!fileInput) return;

    const isSubscribed = checkIsAdminSubscribed();

    if (!isSubscribed) {
        fileInput.disabled = true;
        fileInput.title = "Subscription required to upload images";

        // Show restriction alert banner inside Step 4 container
        const parentContainer = fileInput.closest(".form-group-item");
        if (parentContainer && !document.getElementById("sub-restriction-banner")) {
            const warningBanner = document.createElement("div");
            warningBanner.id = "sub-restriction-banner";
            warningBanner.style.cssText = "background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 12px;";
            warningBanner.innerHTML = "⚠️ <strong>Access Restricted:</strong> Image uploads are only available to subscribed admins. You can proceed without an image.";
            parentContainer.parentNode.insertBefore(warningBanner, parentContainer);
        }
    }
}

/**
 * Step navigation pipeline
 */
function initStepNavigation() {
    let currentStep = 1;
    const totalSteps = 4;

    const prevBtn = document.getElementById("prevStepBtn");
    const nextBtn = document.getElementById("nextStepBtn");
    const submitBtn = document.getElementById("submitFormBtn");

    if (!nextBtn || !prevBtn || !submitBtn) return;

    function updateStepVisibility() {
        for (let i = 1; i <= totalSteps; i++) {
            const pane = document.getElementById(`step-${i}`);
            const node = document.getElementById(`node-${i}`);

            if (pane) pane.classList.toggle("active", i === currentStep);
            if (node) node.classList.toggle("active", i <= currentStep);
        }

        prevBtn.style.display = currentStep === 1 ? "none" : "inline-block";
        nextBtn.style.display = currentStep === totalSteps ? "none" : "inline-block";
        submitBtn.style.display = currentStep === totalSteps ? "inline-block" : "none";
    }

    function validateCurrentStepInputs() {
        const activePane = document.getElementById(`step-${currentStep}`);
        if (!activePane) return true;

        const inputs = activePane.querySelectorAll("input[required], select[required], textarea[required]");
        for (const input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }

    nextBtn.onclick = (e) => {
        e.preventDefault();
        if (!validateCurrentStepInputs()) return;
        if (currentStep < totalSteps) {
            currentStep++;
            updateStepVisibility();
        }
    };

    prevBtn.onclick = (e) => {
        e.preventDefault();
        if (currentStep > 1) {
            currentStep--;
            updateStepVisibility();
        }
    };

    updateStepVisibility();
}

/**
 * Prevent page reload on form submit & process payload
 */
function initShipmentFormSubmission() {
    const form = document.getElementById("shipmentForm");
    const spinnerModal = document.getElementById("spinnerModal");

    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault(); // Prevents page reload

        const adminToken = localStorage.getItem("admin_session_token");
        const formData = new FormData(form);

        // If unsubscribed, strip image file from submission payload
        if (!checkIsAdminSubscribed()) {
            formData.delete("shipment_image");
        }

        if (spinnerModal) spinnerModal.style.display = "flex";

        try {
            const response = await fetch("http://localhost:5000/address/add-shipment", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${adminToken}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Shipment Created',
                    text: 'New shipment successfully added to registry.',
                    background: '#0f172a',
                    color: '#ffffff',
                    confirmButtonColor: '#10b981'
                }).then(() => {
                    window.location.href = "list.html";
                });
            } else {
                throw new Error(result.error || result.message || "Failed to create shipment.");
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: err.message,
                background: '#0f172a',
                color: '#ffffff',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            if (spinnerModal) spinnerModal.style.display = "none";
        }
    };
}

/**
 * Avatar Action Pipeline with Subscription Check
 */
export function initProfileImageActionsPipeline(account) {
    const triggerArea = document.getElementById("profile-avatar-action-trigger");
    const displayBubble = document.getElementById("profile-avatar-target-display");
    if (!triggerArea || !displayBubble) return;

    const initial = (account.fullname || account.firstname || account.trackingcode || "S").charAt(0).toUpperCase();
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
        const isSubscribed = checkIsAdminSubscribed();

        if (!isSubscribed) {
            Swal.fire({
                icon: 'warning',
                title: 'Subscription Required',
                text: 'Image upload and avatar modifications require an active premium admin subscription.',
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
            text: 'You need an active subscription to upload images.',
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
            text: 'Active subscription required for network storage operations.',
            background: '#0f172a',
            color: '#ffffff'
        });
        return;
    }

    const adminToken = localStorage.getItem("admin_session_token");
    const targetUrl = "http://localhost:5000/address/avatar";
    const trackingcode = account.trackingcode || account.tracking_code || account.tracking;

    const headers = {
        "Authorization": `Bearer ${adminToken}`
    };

    const formData = new FormData();
    formData.append("trackingcode", trackingcode);

    let backupUrl = account.shipment_image || account.image;
    let temporaryLocalUrl = null;

    if (streamActionType === "delete") {
        formData.append("action", "delete");
        account.shipment_image = null;
        delete account.image;
    } else {
        formData.append("action", "avatar");
        formData.append("shipment_image", fileObject);

        temporaryLocalUrl = URL.createObjectURL(fileObject);
        account.shipment_image = temporaryLocalUrl;
        delete account.image;
    }

    updateLocalCacheRecordWithMutations(account);

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: headers,
            body: formData
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
                text: 'Profile image modified and saved permanently.',
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