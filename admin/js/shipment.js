/**
 * Populates form controls and initializes submission handles for shipment forms.
 * Mapped to Supabase PostgreSQL table schema: public.shipment
 */

// Helper to format any date string/timestamp to HTML5 datetime-local format (YYYY-MM-DDTHH:mm)
function formatDateTimeForInput(dateVal) {
    if (!dateVal) return "";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
        return "";
    }
}

export function syncUserProfileFormFields(shipment) {
    if (!shipment) return;

    // Safe helper to populate form controls
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : "";
    };

    // 1. OVERVIEW & CARGO DETAILS FORM (#fom3)
    setVal("trackingStatus", shipment.trackingStatus || "active");
    setVal("tracking2", shipment.trackingcode || shipment.tracking2);
    setVal("disableMessage", shipment.disableMessage || "");
    setVal("carrier", shipment.carrier || "");
    setVal("method", shipment.method || "");

    // Format ISO/Timestamp to HTML5 datetime-local string
    setVal("startdate", formatDateTimeForInput(shipment.date));

    setVal("packagename", shipment.package || shipment.packagename);
    setVal("quantity", shipment.totalquantity || shipment.quantity);
    setVal("weight", shipment.totalweight || shipment.weight);

    // Fallback between modern and legacy schema keys (exd, scd, tcd)
    setVal("express", shipment.express || shipment.exd || "");
    setVal("second", shipment.second || shipment.scd || "");
    setVal("third", shipment.third || shipment.tcd || "");

    setVal("description", shipment.des || shipment.description || "");

    // 2. SENDER INFORMATION FORM (#fom1)
    setVal("fullname", shipment.fullname || "");
    setVal("email", shipment.email || "");
    setVal("phone", shipment.phone || shipment.tel || "");
    setVal("citys", shipment.city || shipment.citys || "");
    setVal("country", shipment.country || "");

    // 3. RECEIVER INFORMATION FORM (#fom2)
    setVal("name2", shipment.fullname2 || shipment.name2 || "");
    setVal("email2", shipment.email2 || "");
    setVal("tel2", shipment.phone2 || shipment.tel2 || "");
    setVal("country2", shipment.country2 || "");
    setVal("city2", shipment.city2 || "");
    setVal("address2", shipment.address || shipment.address2 || "");
    setVal("postercode2", shipment.postercode2 || shipment.postcode || "");

    // 4. SHIPMENT STATUS & TIMELINE FORM (#fom4)
    setVal("activestatus", shipment.activestatus || "");

    // Format Timeline Dates for datetime-local inputs
    setVal("Itim", formatDateTimeForInput(shipment.date));
    setVal("Itim2", formatDateTimeForInput(shipment.date2));
    setVal("Itim3", formatDateTimeForInput(shipment.date3));
    setVal("Itim4", formatDateTimeForInput(shipment.date4));
    setVal("Itim5", formatDateTimeForInput(shipment.date5));
    setVal("Itim6", formatDateTimeForInput(shipment.date6));

    // Timeline Status Comments
    setVal("cc22", shipment.comment || "");
    setVal("cc222", shipment.comment2 || "");
    setVal("cc223", shipment.comment3 || "");
    setVal("cc224", shipment.comment4 || "");
    setVal("cc225", shipment.comment5 || "");
    setVal("cc226", shipment.comment6 || "");

    // 5. MAP SETTINGS FORM (#mapform)
    const isMapActive = shipment.mapstatus === true || shipment.mapstatus === "on" || shipment.mapstatus === "true" || shipment.mapstatus === 1 || shipment.mapstatus === "1";
    setVal("mapstatus", isMapActive ? "on" : "off");
    setVal("latitude", shipment.lat || shipment.latitude || "");
    setVal("longitude", shipment.long || shipment.longitude || "");
    setVal("latitude2", shipment.lat2 || shipment.latitude2 || "");
    setVal("longitude2", shipment.long2 || shipment.longitude2 || "");
    setVal("mapMessage", shipment.mapMessage || "");

    // 6. INVOICE FORM (#invc)
    setVal("invoiceEmail", shipment.email2 || shipment.email || "");
    setVal("INVname", shipment.fullname2 || shipment.name2 || shipment.fullname || "");
    setVal("invoice_text", shipment.invoice_text || "");

    // 7. PAYMENT RECEIPT FORM (#receiptForm)
    setVal("receiptEmail", shipment.email2 || shipment.email || "");
    setVal("amountPaid", shipment.express || shipment.second || shipment.third || "");
    setVal("paymentDate", formatDateTimeForInput(shipment.date || new Date()));
    setVal("shipmentClass", shipment.method || "Express Delivery");

    // REAL-TIME MAP VISIBILITY & NAVIGATION LOGIC
    const mapHeaderSection = document.getElementById("mapHeaderSection");
    const mapStatusSelect = document.getElementById("mapstatus");
    const previewMapExternalBtn = document.getElementById("previewMapExternalBtn");

    const updateMapHeaderVisibility = (statusVal) => {
        const isActive = statusVal === "on" || statusVal === "true" || statusVal === "1" || statusVal === true;
        if (mapHeaderSection) {
            if (!isActive) {
                mapHeaderSection.classList.add("d-none");
            } else {
                mapHeaderSection.classList.remove("d-none");
            }
        }
    };

    updateMapHeaderVisibility(isMapActive ? "on" : "off");

    if (mapStatusSelect) {
        mapStatusSelect.onchange = (e) => {
            updateMapHeaderVisibility(e.target.value);
        };
    }

    if (previewMapExternalBtn) {
        previewMapExternalBtn.onclick = (e) => {
            e.preventDefault();

            const lat1 = document.getElementById("latitude")?.value || shipment.lat || shipment.latitude || "";
            const lng1 = document.getElementById("longitude")?.value || shipment.long || shipment.longitude || "";
            const lat2 = document.getElementById("latitude2")?.value || shipment.lat2 || shipment.latitude2 || "";
            const lng2 = document.getElementById("longitude2")?.value || shipment.long2 || shipment.longitude2 || "";
            const msg = document.getElementById("mapMessage")?.value || shipment.mapMessage || shipment.fullname || "";
            const imgUrl = shipment.shipment_image || shipment.image || shipment.img || "";

            const params = new URLSearchParams({
                lat: lat1,
                lng: lng1,
                lat2: lat2,
                lng2: lng2,
                msg: msg,
                img: imgUrl
            });

            window.location.href = `/admin/map.html?${params.toString()}`;
        };
    }

    // Attach Submission Event Handlers
    bindFormSubmission("fom3", shipment, getOverviewPayload);
    bindFormSubmission("fom1", shipment, getSenderPayload);
    bindFormSubmission("fom2", shipment, getReceiverPayload);
    bindFormSubmission("fom4", shipment, getStatusPayload);
    bindFormSubmission("mapform", shipment, getMapPayload);
    bindFormSubmission("invc", shipment, getInvoicePayload, executeInvoiceDispatch);
    bindFormSubmission("receiptForm", shipment, getReceiptPayload, executeReceiptDispatch);
}

// Leaflet Map Preview Initializer
function initializeLeafletMapPreview(shipment) {
    const mapContainer = document.getElementById("inlineMapContainer");
    if (!mapContainer) return;

    const lat1 = parseFloat(shipment.lat || shipment.latitude);
    const lng1 = parseFloat(shipment.long || shipment.longitude);
    const lat2 = parseFloat(shipment.lat2 || shipment.latitude2);
    const lng2 = parseFloat(shipment.long2 || shipment.longitude2);

    if (isNaN(lat1) || isNaN(lng1)) {
        mapContainer.classList.add("d-none");
        return;
    }

    mapContainer.classList.remove("d-none");

    if (window.activeLeafletMap) {
        window.activeLeafletMap.remove();
    }

    const map = L.map('previewMap').setView([lat1, lng1], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    L.marker([lat1, lng1]).addTo(map).bindPopup(shipment.mapMessage || "Origin").openPopup();

    if (!isNaN(lat2) && !isNaN(lng2)) {
        L.marker([lat2, lng2]).addTo(map).bindPopup("Destination");
        const polyline = L.polyline([[lat1, lng1], [lat2, lng2]], { color: 'blue' }).addTo(map);
        map.fitBounds(polyline.getBounds());
    }

    window.activeLeafletMap = map;
}

// Payload Extractors (Mapped to exact Supabase Schema Columns)
function getOverviewPayload() {
    return {
        trackingStatus: document.getElementById("trackingStatus")?.value,
        trackingcode: document.getElementById("tracking2")?.value,
        disableMessage: document.getElementById("disableMessage")?.value,
        carrier: document.getElementById("carrier")?.value,
        method: document.getElementById("method")?.value,
        date: document.getElementById("startdate")?.value,
        package: document.getElementById("packagename")?.value,
        totalquantity: document.getElementById("quantity")?.value,
        totalweight: document.getElementById("weight")?.value,
        express: document.getElementById("express")?.value,
        second: document.getElementById("second")?.value,
        third: document.getElementById("third")?.value,
        des: document.getElementById("description")?.value
    };
}

function getSenderPayload() {
    return {
        fullname: document.getElementById("fullname")?.value,
        email: document.getElementById("email")?.value,
        phone: document.getElementById("phone")?.value,
        city: document.getElementById("citys")?.value,
        country: document.getElementById("country")?.value
    };
}

function getReceiverPayload() {
    return {
        fullname2: document.getElementById("name2")?.value,
        email2: document.getElementById("email2")?.value,
        phone2: document.getElementById("tel2")?.value,
        country2: document.getElementById("country2")?.value,
        city2: document.getElementById("city2")?.value,
        address: document.getElementById("address2")?.value,
        postcode: document.getElementById("postercode2")?.value
    };
}

function getStatusPayload() {
    return {
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
        comment6: document.getElementById("cc226")?.value
    };
}

function getMapPayload() {
    const rawMapStatus = document.getElementById("mapstatus")?.value;
    return {
        mapstatus: rawMapStatus === "true" || rawMapStatus === "on" || rawMapStatus === "1",
        lat: document.getElementById("latitude")?.value,
        long: document.getElementById("longitude")?.value,
        lat2: document.getElementById("latitude2")?.value,
        long2: document.getElementById("longitude2")?.value,
        mapMessage: document.getElementById("mapMessage")?.value
    };
}

function getInvoicePayload() {
    return {
        invoiceEmail: document.getElementById("invoiceEmail")?.value,
        INVname: document.getElementById("INVname")?.value,
        invoice_text: document.getElementById("invoice_text")?.value
    };
}

function getReceiptPayload() {
    return {
        receiptEmail: document.getElementById("receiptEmail")?.value,
        amountPaid: document.getElementById("amountPaid")?.value,
        paymentDate: document.getElementById("paymentDate")?.value,
        shipmentClass: document.getElementById("shipmentClass")?.value
    };
}

// Shared Form Submission Handling
function bindFormSubmission(formId, currentShipment, payloadExtractor, customExecutor) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();

        const updatedFields = payloadExtractor();
        const fullPayload = { ...currentShipment, ...updatedFields };

        // 1. Optimistic Cache Update
        const cacheRaw = localStorage.getItem("admin_users_directory_cache");
        if (cacheRaw) {
            try {
                let cache = JSON.parse(cacheRaw);
                const idx = cache.findIndex(item => String(item.id) === String(currentShipment.id));
                if (idx !== -1) {
                    cache[idx] = fullPayload;
                    localStorage.setItem("admin_users_directory_cache", JSON.stringify(cache));
                    window.dispatchEvent(new Event("adminDirectoryCacheUpdated"));
                }
            } catch (err) {
                console.error("Cache mutation error:", err);
            }
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Updated",
                text: "Shipment details updated locally.",
                icon: "success",
                timer: 1200,
                showConfirmButton: false,
                background: "#0f172a",
                color: "#fff"
            });
        }

        // 2. Dispatch Server Update
        if (customExecutor) {
            await customExecutor(currentShipment.id, updatedFields);
        } else {
            await executeShipmentUpdate(currentShipment.id, updatedFields, cacheRaw);
        }
    };
}

// Server Network Update Executer
async function executeShipmentUpdate(shipmentId, payload, backupCache) {
    const token = localStorage.getItem("admin_session_token");
    const spinner = document.getElementById("spinnerModal");
    if (spinner) spinner.style.display = "flex";

    try {
        const response = await fetch(`http://localhost:5000/address/update-shipment-data?id=${shipmentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
            throw new Error(resData.error || "Failed to sync updates to the server.");
        }
    } catch (err) {
        if (backupCache) {
            localStorage.setItem("admin_users_directory_cache", backupCache);
            window.dispatchEvent(new Event("adminDirectoryCacheUpdated"));
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Sync Failed",
                text: err.message,
                icon: "error",
                background: "#0f172a",
                color: "#fff"
            });
        }
    } finally {
        if (spinner) spinner.style.display = "none";
    }
}

// Server Dispatch Handler for Invoice
async function executeInvoiceDispatch(shipmentId, payload) {
    const token = localStorage.getItem("admin_session_token");
    const spinner = document.getElementById("spinnerModal");
    if (spinner) spinner.style.display = "flex";

    try {
        const response = await fetch(`http://localhost:5000/address/invoice?id=${shipmentId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
            throw new Error(resData.error || "Failed to process and dispatch invoice email.");
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Invoice Sent!",
                text: `Invoice was successfully generated and emailed to ${payload.invoiceEmail}.`,
                icon: "success",
                background: "#0f172a",
                color: "#fff"
            });
        }
    } catch (err) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Dispatch Failed",
                text: err.message,
                icon: "error",
                background: "#0f172a",
                color: "#fff"
            });
        }
    } finally {
        if (spinner) spinner.style.display = "none";
    }
}

// Server Dispatch Handler for Payment Receipt
async function executeReceiptDispatch(shipmentId, payload) {
    const token = localStorage.getItem("admin_session_token");
    const spinner = document.getElementById("spinnerModal");
    if (spinner) spinner.style.display = "flex";

    try {
        const response = await fetch(`http://localhost:5000/address/receipt?id=${shipmentId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
            throw new Error(resData.error || "Failed to process and dispatch payment receipt email.");
        }

        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Receipt Sent!",
                text: `Payment receipt was successfully generated and emailed to ${payload.receiptEmail}.`,
                icon: "success",
                background: "#0f172a",
                color: "#fff"
            });
        }
    } catch (err) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                title: "Dispatch Failed",
                text: err.message,
                icon: "error",
                background: "#0f172a",
                color: "#fff"
            });
        }
    } finally {
        if (spinner) spinner.style.display = "none";
    }
}

/**
 * Tab Navigation Switching
 */
export function setupTabSwitchingNavigation() {
    const tabLinks = document.querySelectorAll(".account-pills .nav-link");

    tabLinks.forEach(tabAnchor => {
        tabAnchor.addEventListener("click", (e) => {
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
}