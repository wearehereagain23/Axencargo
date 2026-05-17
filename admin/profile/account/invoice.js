const urlParams = new URLSearchParams(window.location.search);
const USERID = urlParams.get('i');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Ensure CONFIG is defined or replace with your actual URL and Key strings
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let dataBase = null;

// get data
async function fetchData() {
    // We use the 'supabase' constant defined above
    const { data, error } = await supabase
        .from('axencargo')
        .select('*')
        .eq('trackingcode', USERID);

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        data.forEach(doc => {
            dataBase = doc;

            // Map standard invoice fields to the UI
            // Ensure these IDs exist in your newly redesigned invoice.html
            if (document.getElementById("db-INVname")) document.getElementById("db-INVname").innerText = doc.INVname;
            if (document.getElementById("db-recipient-name")) document.getElementById("db-recipient-name").innerText = doc.INVname;
            if (document.getElementById("db-trackingcode")) document.getElementById("db-trackingcode").innerText = doc.code;
            if (document.getElementById("db-package")) document.getElementById("db-package").innerText = doc.package;
            if (document.getElementById("db-totalquantity")) document.getElementById("db-totalquantity").innerText = doc.totalquantity;
            if (document.getElementById("db-des")) document.getElementById("db-des").innerText = doc.des;
            if (document.getElementById("db-totalweight")) document.getElementById("db-totalweight").innerText = doc.totalweight;

            // Map Pricing Fields
            if (document.getElementById("db-p1")) document.getElementById("db-p1").innerText = doc.p1;
            if (document.getElementById("db-p2")) document.getElementById("db-p2").innerText = doc.p2;
            if (document.getElementById("db-p3")) document.getElementById("db-p3").innerText = doc.p3;

            // Optional: Map shipment speed classes
            if (document.getElementById("db-express")) document.getElementById("db-express").innerText = doc.express;
            if (document.getElementById("db-second")) document.getElementById("db-second").innerText = doc.second;
            if (document.getElementById("db-third")) document.getElementById("db-third").innerText = doc.third;

            // Calculate Total
            const total = (parseFloat(doc.p1) || 0) + (parseFloat(doc.p2) || 0) + (parseFloat(doc.p3) || 0);
            const totalElement = document.getElementById("db-total-calc");
            if (totalElement) {
                totalElement.innerText = "$" + total.toFixed(2);
            }

            // Status Badge
            const statusElement = document.getElementById("db-trackingStatus");
            if (statusElement) {
                statusElement.innerText = "STATUS: " + (doc.trackingStatus || 'PENDING');
            }
        });
    }
}

fetchData();



async function admin() {
    // We use the 'supabase' constant defined above
    const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('id', 11);

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        data.forEach(doc => {
            dataBase = doc;

            // Map standard invoice fields to the UI
            // Ensure these IDs exist in your newly redesigned invoice.html
            if (document.getElementById("admin-email")) document.getElementById("admin-email").innerText = doc.email || '';

        });
    }
}

admin();

// Add the download function here so it is available to the button
window.downloadInvoice = function () {
    const area = document.getElementById('invoice-capture-area');
    if (!area) return;

    html2canvas(area, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F6F6F6"
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice-${USERID}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
};