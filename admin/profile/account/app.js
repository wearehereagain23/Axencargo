
function showSpinnerModal() {
    document.getElementById('spinnerModal').style.display = 'flex';
}

function hideSpinnerModal() {
    document.getElementById('spinnerModal').style.display = 'none';
}
showSpinnerModal();

const urlParams = new URLSearchParams(window.location.search);
const USERID = urlParams.get('i');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let dataBase = null

// get data
async function fetchData() {

    const { data, error } = await supabase
        .from('axencargo')
        .select('*')
        .eq('trackingcode', USERID);
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        data.forEach(doc => {
            dataBase = doc
            if (doc.mapstatus == "on") {
                document.getElementById('mapff').classList.remove('hide')
            }

            const invoiceBtn = document.getElementById('openInvoiceBtn');
            if (invoiceBtn) {
                // Check if both p1 and INVname have data in the DB
                if (doc.p1 && doc.INVname) {
                    invoiceBtn.style.display = 'inline-block';
                    // Use 'i' or 'trackingcode' depending on your URL structure
                    invoiceBtn.href = `invoice.html?i=${doc.trackingcode}`;
                } else {
                    invoiceBtn.style.display = 'none';
                }
            }

            hideSpinnerModal()
            document.getElementById("tracking1").innerHTML = doc.trackingcode;

            document.getElementById("fullname").value = doc.fullname;
            document.getElementById("emailer").value = doc.email;
            document.getElementById("countryi").value = doc.country;
            document.getElementById("phonei").value = doc.phone;
            document.getElementById("city").value = doc.city;



            document.getElementById("fullname2").value = doc.fullname2;
            document.getElementById("email2").value = doc.email2;
            document.getElementById("phone2x").value = doc.phone2;
            document.getElementById("postercode").value = doc.postcode;
            document.getElementById("country2").value = doc.country2;
            document.getElementById("city2").value = doc.city2;
            document.getElementById("address2").value = doc.address;



            document.getElementById("trackingStatus").value = doc.trackingStatus;
            document.getElementById("disableMessage").value = doc.disableMessage;
            document.getElementById("startdate").value = doc.date;
            document.getElementById("activestatus").value = doc.activestatus;
            document.getElementById("carrier").value = doc.carrier;
            document.getElementById("method").value = doc.method;


            document.getElementById("packagename").value = doc.package;
            document.getElementById("quantity").value = doc.totalquantity;
            document.getElementById("weight").value = doc.totalweight;
            document.getElementById("description").value = doc.des;
            document.getElementById("express").value = doc.express;
            document.getElementById("second").value = doc.second;
            document.getElementById("third").value = doc.third;


            document.getElementById('Itim').value = doc.date
            document.getElementById('Itim2').value = doc.date2
            document.getElementById('Itim3').value = doc.date3
            document.getElementById('Itim4').value = doc.date4
            document.getElementById('Itim5').value = doc.date5
            document.getElementById('Itim6').value = doc.date6
            document.getElementById('cc22').value = doc.comment
            document.getElementById('cc222').value = doc.comment2
            document.getElementById('cc223').value = doc.comment3
            document.getElementById('cc224').value = doc.comment4
            document.getElementById('cc225').value = doc.comment5
            document.getElementById('cc226').value = doc.comment6

            // MAP DATA


            document.getElementById("mapstatus").value = doc.mapstatus;
            document.getElementById("latitude").value = doc.lat;
            document.getElementById("latitude2").value = doc.lat2;
            document.getElementById("longitude").value = doc.long;
            document.getElementById("longitude2").value = doc.long2;
            document.getElementById("mapMessage").value = doc.mapMessage;
            localStorage.setItem("message", doc.mapMessage);
            localStorage.setItem("lat", doc.lat);
            localStorage.setItem("lat2", doc.lat2);
            localStorage.setItem("long", doc.long);
            localStorage.setItem("long2", doc.long2);

            localStorage.setItem("from", doc.fromFlag);
            localStorage.setItem("to", doc.toFlag);


        });
    }
}
fetchData();


document.getElementById('delete').addEventListener('click', async () => {

    const { data, error } = await supabase
        .from('axencargo')
        .delete()
        .eq('trackingcode', USERID); // condition to match the row

    if (error) {
        console.error('Error deleting row:', error)
    } else {
        history.replaceState(null, '', location.href);
        // Go back to the previous page
        history.go(-1);
    }

})


//SENDER UPDATE

const formDAT1 = document.getElementById('fom1');
formDAT1.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData1 = new FormData(formDAT1);
    let fullname = formData1.get('fullname');
    let email = formData1.get('emailer');
    let phone = formData1.get('phonei');
    let city = formData1.get('city');
    let country = formData1.get('countryi');
    showSpinnerModal();


    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
        if (!response.ok) throw new Error("Country not found");

        const data = await response.json();
        const flagUrl = data[0].flags.svg;

        //update data
        async function updateData() {
            const { data, error } = await supabase
                .from('axencargo')
                .update({
                    fullname: fullname,
                    email: email,
                    phone: phone,
                    city: city,
                    country: country,
                    fromFlag: flagUrl ? flagUrl : localStorage.getItem("from"),
                })
                .eq('trackingcode', USERID);
            if (error) {
                hideSpinnerModal()
                console.error('Error updating data:', error);
            } else {
                hideSpinnerModal()
                Swal.fire({
                    title: 'SUCCESS',
                    text: "SENDER UPDATED",
                    icon: 'success',
                    showCancelButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    confirmButtonText: 'OK!'
                }).then(() => {
                    location.reload();
                })
            }
        }
        updateData();
    } catch (error) {
        hideSpinnerModal()
        Swal.fire({
            title: 'Error!',
            text: `${'Country not supported'}`,
            icon: 'error',
            confirmButtonText: 'Ok'
        })
    }

})



//RECEIVER UPDATE

const fom2 = document.getElementById('fom2');
fom2.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData1 = new FormData(fom2);
    let fullname = formData1.get('fullname2');
    let email = formData1.get('email2');
    let phone = formData1.get('phone2x');
    let city = formData1.get('city2');
    let country = formData1.get('country2');
    let postcode = formData1.get('postercode');
    let address = formData1.get('address2');
    showSpinnerModal();

    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
        if (!response.ok) throw new Error("Country not found");

        const data = await response.json();
        const flagUrl = data[0].flags.svg;

        //update data
        async function updateData() {
            const { data, error } = await supabase
                .from('axencargo')
                .update({
                    fullname2: fullname,
                    email2: email,
                    phone2: phone,
                    city2: city,
                    country2: country,
                    postcode: postcode,
                    address: address,
                    toFlag: flagUrl ? flagUrl : localStorage.getItem("to"),
                })
                .eq('trackingcode', USERID);
            if (error) {
                hideSpinnerModal()
                console.error('Error updating data:', error);
            } else {
                hideSpinnerModal()
                Swal.fire({
                    title: 'SUCCESS',
                    text: "RECEIVER UPDATED",
                    icon: 'success',
                    showCancelButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    confirmButtonText: 'OK!'
                }).then(() => {
                    location.reload();
                })
            }
        }
        updateData();
    } catch (error) {
        hideSpinnerModal()
        Swal.fire({
            title: 'Error!',
            text: `${'Country not supported'}`,
            icon: 'error',
            confirmButtonText: 'Ok'
        })
    }

})




//SHIPMENT UPDATE

const fom3 = document.getElementById('fom3');
fom3.addEventListener('submit', event => {
    event.preventDefault();
    const formData1 = new FormData(fom3);
    let trackingStatus = formData1.get('trackingStatus');
    let disableMessage = formData1.get('disableMessage');
    let carrier = formData1.get('carrier');
    let method = formData1.get('method');
    let packageS = formData1.get('packagename');
    let totalquantity = formData1.get('quantity');
    let totalweight = formData1.get('weight');
    let des = formData1.get('description');
    let express = formData1.get('express');
    let second = formData1.get('second');
    let third = formData1.get('third');

    showSpinnerModal();
    //update data
    async function updateData() {
        const { data, error } = await supabase
            .from('axencargo')
            .update({
                trackingStatus: trackingStatus,
                disableMessage: disableMessage,
                carrier: carrier,
                method: method,
                package: packageS,
                totalquantity: totalquantity,
                totalweight: totalweight,
                des: des,
                express: express,
                second: second,
                third: third
            })
            .eq('trackingcode', USERID);
        if (error) {
            hideSpinnerModal()
            console.error('Error updating data:', error);
        } else {
            hideSpinnerModal()
            Swal.fire({
                title: 'SUCCESS',
                text: "SHIPMENT UPDATED",
                icon: 'success',
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'OK!'
            }).then(() => {
                location.reload();
            })

        }
    }
    updateData();

})




//STATUS UPDATE


const fom4 = document.getElementById('fom4');
fom4.addEventListener('submit', event => {
    event.preventDefault();
    const formData1 = new FormData(fom4);
    let activestatus = formData1.get('activestatus');
    let date = formData1.get('Itim');
    let date2 = formData1.get('Itim2');
    let date3 = formData1.get('Itim3');
    let date4 = formData1.get('Itim4');
    let date5 = formData1.get('Itim5');
    let date6 = formData1.get('Itim6');
    let comment = formData1.get('cc22');
    let comment2 = formData1.get('cc222');
    let comment3 = formData1.get('cc223');
    let comment4 = formData1.get('cc224');
    let comment5 = formData1.get('cc225');
    let comment6 = formData1.get('cc226');

    showSpinnerModal();
    //update data
    async function updateData() {
        const { data, error } = await supabase
            .from('axencargo')
            .update({
                activestatus: activestatus,
                date: date,
                date2: date2,
                date3: date3,
                date4: date4,
                date5: date5,
                date6: date6,
                comment: comment,
                comment2: comment2,
                comment3: comment3,
                comment4: comment4,
                comment5: comment5,
                comment6: comment6
            })
            .eq('trackingcode', USERID);
        if (error) {
            hideSpinnerModal()
            console.error('Error updating data:', error);
        } else {
            hideSpinnerModal()
            Swal.fire({
                title: 'SUCCESS',
                text: "STATUS UPDATED",
                icon: 'success',
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'OK!'
            }).then(() => {
                location.reload();
            })
        }
    }
    updateData();

})



//MAP UPDATE
const mapform = document.getElementById('mapform');
mapform.addEventListener('submit', event => {
    event.preventDefault();
    const formData1 = new FormData(mapform);
    let mapstatus = formData1.get('mapstatus');
    let latitude = formData1.get('latitude');
    let latitude2 = formData1.get('latitude2');
    let longitude = formData1.get('longitude');
    let longitude2 = formData1.get('longitude2');
    let mapMessage = formData1.get('mapMessage');
    showSpinnerModal();
    //update data
    async function updateData() {
        const { data, error } = await supabase
            .from('axencargo')
            .update({
                mapstatus: mapstatus,
                lat: latitude,
                lat2: latitude2,
                long: longitude,
                long2: longitude2,
                mapMessage: mapMessage
            })
            .eq('trackingcode', USERID);
        if (error) {
            hideSpinnerModal()
            console.error('Error updating data:', error);
        } else {
            hideSpinnerModal()
            Swal.fire({
                title: 'SUCCESS',
                text: "MAP UPDATED",
                icon: 'success',
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'OK!'
            }).then(() => {
                location.reload();
            })
        }
    } updateData();


})




//INVOICE UPDATE

const tr = document.getElementById('invc');
invc.addEventListener('submit', event => {
    event.preventDefault();
    const formData1 = new FormData(invc);
    let INVname = formData1.get('INVname');
    let p1 = formData1.get('p1');
    let p2 = formData1.get('p2');
    let p3 = formData1.get('p3');
    showSpinnerModal();
    //update data
    async function updateData() {
        let invoiceCode = Math.floor(Math.random() * 373254);
        const { data, error } = await supabase
            .from('axencargo')
            .update({
                INVname: INVname,
                p1: p1,
                p2: p2,
                p3: p3,
                code: invoiceCode
            })
            .eq('trackingcode', USERID);
        if (error) {
            hideSpinnerModal()
            console.error('Error updating data:', error);
        } else {
            hideSpinnerModal()
            Swal.fire({
                title: 'SUCCESS',
                text: "INVOICE UPDATED",
                icon: 'success',
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'Done'
            }).then(async () => {



            })


        }
    } updateData();


})


//TRACKING CODE UPDATE
const TRK = document.getElementById('Tcode');
TRK.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData1 = new FormData(TRK);
    let tracking2 = formData1.get('tracking2');
    // showSpinnerModal();

    //check if tracking code already exist 

    const { data, error } = await supabase
        .from('axencargo')
        .select('*')
        .eq('trackingcode', tracking2);
    if (error) {
        console.error('Error fetching data:', error);
    } else {
        if (data.length === 0) {

            ////UPDATE DATA
            async function updateData() {
                const { data, error } = await supabase
                    .from('axencargo')
                    .update({
                        trackingcode: tracking2,
                    })
                    .eq('trackingcode', USERID);
                if (error) {
                    hideSpinnerModal()
                    console.error('Error updating data:', error);
                } else {
                    hideSpinnerModal()
                    Swal.fire({
                        title: 'SUCCESS',
                        text: "TRACKING CODE UPDATED",
                        icon: 'success',
                        showCancelButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        confirmButtonText: 'Done'
                    }).then(() => {
                        history.back();
                    })


                }
            } updateData();

        } else {
            Swal.fire({
                title: 'ERROR',
                text: "tracking code already exist",
                icon: 'error',
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'OK!'
            })
        }


    }


})
