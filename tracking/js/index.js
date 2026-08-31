// GLOBAL CONFIGURATION VARIABLE: Control map visibility
window.SHOW_MAP_SECTION = true;

const HARDCODED_SIGNATURE = "axencargo";
const API_PUBLIC_SHIPMENT_ENDPOINT = "http://localhost:5000/address/public-shipment";

// Mock Fallback Data (matching database schema)
const DUMMY_SHIPMENT_DATA = {
    trackingcode: "11234xxE349UaG1650",
    date: "2026-01-26T15:38",
    date2: "2026-01-28T08:45",
    date3: "2026-01-28T05:53",
    date4: "",
    date5: "",
    date6: "",
    activestatus: "Order Placed",
    fromFlag: "https://flagcdn.com/w40/de.png",
    toFlag: "https://flagcdn.com/w40/ro.png",

    fullname: "William Rodrigo",
    country: "Germany",
    city: "Berlin",
    email: "williansrodrigo233@gmail.com",
    phone: "+49 30 12345678",

    fullname2: "Constantin Mariana Constantin Brezeanu",
    country2: "Romania",
    city2: "Ploiesti Municipality, Prahova County",
    address: "2b, block B2 bis, staircase A, floor 1, apartment 5.",
    postcode: "100000",
    email2: "constantin.brezeanu@example.com",
    phone2: "+40 71 234 5678",

    carrier: "DHL",
    method: "Air Freight",
    RN: "1650",
    comment: "Shipment on the way",
    comment2: "",
    comment3: "",
    comment4: "",
    comment5: "",
    comment6: "",

    package: "Luggages",
    totalquantity: "2",
    totalweight: "9.4",
    des: "Luggages",

    shipment_image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    mapstatus: true,
    lat: "-9.042113",
    long: "-54.200369",
    lat2: "9.296923",
    long2: "8.385094",
    mapMessage: "Shipment on the way",
    trackingStatus: "active",
    disableMessage: "This shipment tracking link has been disabled or suspended."
};

let leafletMap = null;

// Helper function to prevent ReferenceError
function updateDomInfo(email, address) {
    const emailEl = document.getElementById("admin-email");
    const addressEl = document.getElementById("admin-address");
    if (emailEl && email) emailEl.innerText = email;
    if (addressEl && address) addressEl.innerText = address;
}

// Global Google Translate Init
window.googleTranslateElementInit = function () {
    if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
            { pageLanguage: 'en' },
            'google_translate_element'
        );
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('i') || DUMMY_SHIPMENT_DATA.trackingcode;

    setResponsiveCardState();
    setupCollapsibleCards();
    renderBarcode(trackingId);

    const printerBtn = document.getElementById('printer');
    if (printerBtn) {
        printerBtn.addEventListener('click', () => window.print());
    }

    fetchAndRenderTrackingData(trackingId);
});

// Set initial collapse state (Desktop >= 900px open, Mobile closed)
function setResponsiveCardState() {
    const isDesktop = window.innerWidth >= 900;
    const cards = document.querySelectorAll('.collapsible-card');

    cards.forEach(card => {
        if (isDesktop) {
            card.classList.remove('is-collapsed');
        } else {
            card.classList.add('is-collapsed');
        }
    });
}

function setupCollapsibleCards() {
    const headers = document.querySelectorAll('.card-header-toggle');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.collapsible-card');
            card.classList.toggle('is-collapsed');

            // Refresh Leaflet map bounds when expanding
            if (!card.classList.contains('is-collapsed') && card.contains(document.getElementById('map')) && leafletMap) {
                setTimeout(() => {
                    leafletMap.invalidateSize();
                    if (leafletMap._activeBounds) {
                        leafletMap.fitBounds(leafletMap._activeBounds, { padding: [50, 50] });
                    }
                }, 150);
            }
        });
    });
}

function renderBarcode(trackingCode) {
    if (typeof JsBarcode !== 'undefined') {
        JsBarcode("#barcode", trackingCode, {
            format: "CODE128",
            width: 2,
            height: 55,
            displayValue: true,
            margin: 0
        });

        const svg = document.querySelector("#barcode");
        if (svg) {
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.style.width = "100%";
            svg.style.height = "auto";
        }
    }
}

// Backend API Fetching Function using signature and endpoint
async function fetchAndRenderTrackingData(trackingCode) {
    let doc = DUMMY_SHIPMENT_DATA;

    try {
        const endpoint = `${API_PUBLIC_SHIPMENT_ENDPOINT}?signature=${encodeURIComponent(HARDCODED_SIGNATURE)}&trackingcode=${encodeURIComponent(trackingCode)}`;
        const response = await fetch(endpoint);

        if (response.ok) {
            const result = await response.json();
            if (result && result.success && result.shipment) {
                doc = result.shipment;
            }
        }
    } catch (err) {
        console.warn("API fetch error, using fallback state:", err);
    }

    // Check if tracking status is disabled
    const isTrackingDisabled = doc.trackingStatus && (
        doc.trackingStatus.toLowerCase() === 'disabled' ||
        doc.trackingStatus.toLowerCase() === 'off' ||
        doc.trackingStatus.toLowerCase() === 'false'
    );

    if (isTrackingDisabled) {
        const disableMsg = doc.disableMessage || "This tracking record is currently disabled or unavailable.";

        // Hide full-page spinner overlay if visible
        const pageLoader = document.getElementById('page-loader');
        if (pageLoader) pageLoader.classList.add('hidden-loader');

        // Display SweetAlert modal
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Tracking Disabled',
                text: disableMsg,
                allowOutsideClick: false,
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
        } else {
            alert(`Tracking Disabled: ${disableMsg}`);
        }
        return; // Stop further rendering
    }

    const shipmentImageUrl = doc.shipment_image || doc.p1 || doc.image || doc.img;

    // Render data to DOM nodes
    renderShipmentDetails(doc);
    renderShipmentImage(shipmentImageUrl);
    renderActiveStatuses(doc.activestatus);
    renderMap(doc);

    // 3-SECOND MANDATORY DELAY FOR DOM/ASSET SETUP
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Remove backdrop blur and hide spinner overlay
    const appContainer = document.querySelector('.app-container');
    const pageLoader = document.getElementById('page-loader');

    if (appContainer) {
        appContainer.classList.remove('content-blurred');
    }

    if (pageLoader) {
        pageLoader.classList.add('hidden-loader');
    }

    // Refresh Leaflet Map tile rendering after unblurring
    if (leafletMap) {
        setTimeout(() => {
            leafletMap.invalidateSize();
            if (leafletMap._activeBounds) {
                leafletMap.fitBounds(leafletMap._activeBounds, { padding: [50, 50] });
            }
        }, 300);
    }
}

function renderShipmentImage(imageUrl) {
    const imageSection = document.getElementById('shipment-image-section');
    const imageElement = document.getElementById('shipment-img');

    if (!imageSection || !imageElement) return;

    if (imageUrl && imageUrl.trim() !== "") {
        imageElement.src = imageUrl;
        imageSection.classList.remove('hidden-element');
    } else {
        imageSection.classList.add('hidden-element');
    }
}

function renderShipmentDetails(doc) {
    const setHtml = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = val || '';
    };

    const setSrc = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.src = val;
    };

    setSrc("flg1", doc.fromFlag);
    setSrc("flg2", doc.toFlag);
    setHtml("stt", doc.activestatus);
    setHtml("dtt", doc.date);

    setHtml('tim', doc.date);
    setHtml('tim2', doc.date2);
    setHtml('tim3', doc.date3);
    setHtml('tim4', doc.date4);
    setHtml('tim5', doc.date5);
    setHtml('tim6', doc.date6);

    setHtml('tfname', doc.fullname);
    setHtml('tfname2', doc.country);
    setHtml('cityy', doc.city);
    setHtml('tfname3', doc.email);
    setHtml('tfname4', doc.phone);

    setHtml('Rtfname', doc.fullname2);
    setHtml('Rtfname2', doc.country2);
    setHtml('Rtfname3', doc.city2);
    setHtml('Rtfname4', doc.address);
    setHtml('Rtfname5', doc.postcode);
    setHtml('Rtfname6', doc.email2);
    setHtml('Rtfname7', doc.phone2);

    setHtml('Shi', doc.country);
    setHtml('Shi2', doc.country2);
    setHtml('Shi3', doc.activestatus);
    setHtml('Shi4', doc.carrier);
    setHtml('Shi5', doc.method);
    setHtml('Shi6', doc.RN);
    setHtml('Shi8', doc.date);

    setHtml('comment', doc.comment);
    setHtml('comment2', doc.comment2);
    setHtml('comment3', doc.comment3);
    setHtml('comment4', doc.comment4);
    setHtml('comment5', doc.comment5);
    setHtml('comment6', doc.comment6);

    setHtml('tdd1', doc.package);
    setHtml('tdd2', doc.totalquantity);
    setHtml('tdd3', doc.totalweight);
    setHtml('tdd4', doc.des);
}

function renderActiveStatuses(activeStatus) {
    const statusHierarchy = [
        "Order Placed",
        "Order Confirmed",
        "Intransit",
        "Near by Courier facility",
        "Out for Delivery",
        "Delivered"
    ];

    const currentIdx = statusHierarchy.indexOf(activeStatus);

    statusHierarchy.forEach((statusName, idx) => {
        const stepNum = idx + 1;
        const ttEl = document.getElementById(`tt${stepNum}`);
        const ssEl = document.getElementById(`ss${stepNum}`);
        const cmsEl = document.getElementById(`cms${stepNum === 1 ? '' : stepNum}`);

        if (idx <= currentIdx && ttEl) {
            ttEl.classList.remove("node-pending");
            ttEl.classList.add("node-completed");
            if (cmsEl) cmsEl.classList.remove('inmap2');
        }

        if (idx === currentIdx && ttEl && ssEl) {
            ttEl.classList.add("node-current");
            ssEl.classList.add("blinker");
        }
    });
}

function renderMap(doc) {
    const mapSection = document.getElementById('map-section');
    if (!mapSection) return;

    // Handle boolean or string boolean representations for mapstatus
    const isMapEnabled = window.SHOW_MAP_SECTION &&
        doc.mapstatus !== false &&
        doc.mapstatus !== 'off' &&
        doc.mapstatus !== 'false';

    if (!isMapEnabled) {
        mapSection.classList.add('hidden-element');
        return;
    }

    mapSection.classList.remove('hidden-element');

    // Parse map coordinates based on schema keys (lat, long, lat2, long2)
    let lat1 = parseFloat(doc.lat || doc.latitude);
    let lng1 = parseFloat(doc.long || doc.lng || doc.longitude);
    let lat2 = parseFloat(doc.lat2 || doc.latitude2);
    let lng2 = parseFloat(doc.long2 || doc.lng2 || doc.longitude2);

    let markerMsg = doc.mapMessage || doc.comment || "Origin Location";
    let shipmentImg = doc.shipment_image || doc.p1 || doc.image || doc.img;

    if (isNaN(lat1) || isNaN(lng1)) {
        lat1 = 6.5244;
        lng1 = 3.3792;
    }

    setTimeout(() => {
        if (typeof L !== 'undefined') {
            if (leafletMap) {
                leafletMap.remove();
            }

            leafletMap = L.map('map', {
                scrollWheelZoom: false,
                zoomControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap);

            // Popup content with text and optional image
            let popupContent = `<div style="text-align: center; width: 100%; box-sizing: border-box;">`;
            if (shipmentImg && shipmentImg.trim() !== "") {
                popupContent += `<img src="${shipmentImg}" alt="Shipment Image" style="width: 100%; height: 75px; border-radius: 6px; object-fit: cover; margin-bottom: 6px; display: block;">`;
            }
            popupContent += `<div style="font-weight: 600; color: #0f172a; font-size: 12px; line-height: 1.3; word-wrap: break-word;">${markerMsg}</div></div>`;

            const popupOptions = {
                autoClose: false,
                closeOnClick: false,
                closeButton: false,
                minWidth: 130,
                maxWidth: 160,
                offset: [0, -10]
            };

            // Origin Marker
            const originMarker = L.marker([lat1, lng1])
                .addTo(leafletMap)
                .bindPopup(popupContent, popupOptions);

            const group = [L.latLng(lat1, lng1)];

            // Destination Marker
            if (!isNaN(lat2) && !isNaN(lng2) && lat2 !== null && lng2 !== null) {
                L.marker([lat2, lng2]).addTo(leafletMap).bindPopup("Destination");
                group.push(L.latLng(lat2, lng2));
            }

            const bounds = L.latLngBounds(group);
            leafletMap._activeBounds = bounds;

            const isSmallMobile = window.innerWidth <= 576;
            const mapPadding = isSmallMobile ? [25, 25] : [50, 50];

            if (group.length > 1) {
                leafletMap.fitBounds(bounds, { padding: mapPadding });
            } else {
                leafletMap.setView([lat1, lng1], 6);
            }

            leafletMap.invalidateSize();
            originMarker.openPopup();
        }
    }, 250);
}

(async function enforceSystemVisibilityGuard() {
    const API_CHECK_ENDPOINT = `http://localhost:5000/address/check?signature=${encodeURIComponent(HARDCODED_SIGNATURE)}`;

    try {
        const response = await fetch(API_CHECK_ENDPOINT);
        const data = await response.json();

        if (!data.success) {
            console.warn("⚠️ API Warning/Error:", data.message || data.error);
            return;
        }

        // Kill-switch redirect if visibility is set to false
        if (data.visibility === false && !window.location.pathname.includes('404.html')) {
            localStorage.clear();
            window.location.href = window.location.origin + "/404.html";
            return;
        }

        // Cache admin properties locally
        if (data.adminEmail) localStorage.setItem("admin_email", data.adminEmail);
        if (data.adminAddress) localStorage.setItem("admin_address", data.adminAddress);

        // Safely update DOM info
        updateDomInfo(data.adminEmail, data.adminAddress);

    } catch (err) {
        console.error("❌ Network fetch error:", err);
    }
})();