console.log("Dashboard JS loaded");


// =====================================================
// SUPABASE CONNECTION
// =====================================================

const supabaseClient = window.supabase.createClient(
  "https://werxumvelpzbuqtixjnm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlcnh1bXZlbHB6YnVxdGl4am5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDAzMTUsImV4cCI6MjA5MjI3NjMxNX0.kpE77bGrTYpeac75votgyBKIRNEE19EtB_bz_iMcHfc"
);


// =====================================================
// HTML ESCAPE
// Prevents user/database text from being interpreted
// as HTML
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// AUTHENTICATION
// =====================================================


// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------

window.login = async function () {

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        alert(
            "Enter email and password"
        );

        return;
    }


    const { data, error } =
        await supabaseClient.auth
            .signInWithPassword({

                email: email,

                password: password

            });


    console.log(
        "LOGIN:",
        data,
        error
    );


    if (error) {

        alert(error.message);

        return;
    }


    showDashboard();

};


// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------

window.logout = async function () {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(error.message);

        return;
    }


    location.reload();

};


// -----------------------------------------------------
// AUTO LOGIN
// -----------------------------------------------------

async function checkUser() {

    const { data, error } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return;
    }


    if (data.session) {

        showDashboard();

    }

}


checkUser();


// -----------------------------------------------------
// SHOW DASHBOARD
// -----------------------------------------------------

function showDashboard() {

    const loginBox =
        document.getElementById("loginBox");

    const dashboard =
        document.getElementById("dashboard");


    if (loginBox) {

        loginBox.classList.add("hidden");

    }


    if (dashboard) {

        dashboard.classList.remove("hidden");

    }


    loadProducts();

    loadOrders();

}


// =====================================================
// PRODUCTS
// =====================================================


// -----------------------------------------------------
// ADD PRODUCT
// -----------------------------------------------------

window.addProduct = async function () {

    const name =
        document
            .getElementById("pname")
            .value
            .trim();


    const description =
        document
            .getElementById("pdesc")
            .value
            .trim();


    const price =
        document
            .getElementById("pprice")
            .value
            .trim();


    const imageInput =
        document.getElementById("pimage");


    const file =
        imageInput.files[0];


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!name) {

        alert(
            "Enter product name"
        );

        return;
    }


    if (!price) {

        alert(
            "Enter product price"
        );

        return;
    }


    if (Number(price) < 0) {

        alert(
            "Price cannot be negative"
        );

        return;
    }


    if (!file) {

        alert(
            "Select a product image"
        );

        return;
    }


    // -------------------------------------------------
    // VALIDATE IMAGE
    // -------------------------------------------------

    if (!file.type.startsWith("image/")) {

        alert(
            "Please select an image file"
        );

        return;
    }


    // Optional size limit: 5 MB

    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        alert(
            "Image must be smaller than 5 MB"
        );

        return;
    }


    // -------------------------------------------------
    // CREATE UNIQUE FILE NAME
    // -------------------------------------------------

    const originalName =
        file.name
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._-]/g, "");


    const fileName =
        Date.now() +
        "_" +
        originalName;


    console.log(
        "Uploading:",
        fileName
    );


    // -------------------------------------------------
    // UPLOAD IMAGE TO SUPABASE STORAGE
    // -------------------------------------------------

    const {
        error: uploadError
    } =
        await supabaseClient.storage
            .from("products")
            .upload(
                fileName,
                file,
                {
                    contentType: file.type,
                    upsert: false
                }
            );


    if (uploadError) {

        console.error(
            "Image upload error:",
            uploadError
        );

        alert(
            "Image upload failed: " +
            uploadError.message
        );

        return;
    }


    // -------------------------------------------------
    // GET PUBLIC IMAGE URL
    // -------------------------------------------------

    const {
        data: urlData
    } =
        supabaseClient.storage
            .from("products")
            .getPublicUrl(
                fileName
            );


    const imageUrl =
        urlData.publicUrl;


    console.log(
        "Image URL:",
        imageUrl
    );


    // -------------------------------------------------
    // INSERT PRODUCT INTO DATABASE
    // -------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("yanaProducts")
            .insert([
                {

                    name: name,

                    description: description,

                    price: Number(price),

                    image: imageUrl

                }
            ])
            .select();


    if (error) {

        console.error(
            "Product database error:",
            error
        );


        // If database insertion fails,
        // attempt to remove uploaded image

        await supabaseClient.storage
            .from("products")
            .remove([
                fileName
            ]);


        alert(
            "Product could not be saved: " +
            error.message
        );

        return;
    }


    console.log(
        "Product added:",
        data
    );


    alert(
        "Product added successfully!"
    );


    // -------------------------------------------------
    // CLEAR FORM
    // -------------------------------------------------

    document
        .getElementById("pname")
        .value = "";


    document
        .getElementById("pdesc")
        .value = "";


    document
        .getElementById("pprice")
        .value = "";


    document
        .getElementById("pimage")
        .value = "";


    // -------------------------------------------------
    // REFRESH PRODUCTS
    // -------------------------------------------------

    loadProducts();

};


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    const container =
        document.getElementById("products");


    if (!container) {

        console.error(
            "Products container not found"
        );

        return;
    }


    // Loading state

    container.innerHTML = `

        <p class="loading-products">
            Loading products...
        </p>

    `;


    // -------------------------------------------------
    // GET PRODUCTS
    // -------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("yanaProducts")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Products error:",
            error
        );


        container.innerHTML = `

            <p class="error-products">
                Unable to load products.
            </p>

        `;

        return;
    }


    // -------------------------------------------------
    // NO PRODUCTS
    // -------------------------------------------------

    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-products">

                <p>
                    No products have been added yet.
                </p>

            </div>

        `;

        return;
    }


    // -------------------------------------------------
    // CREATE PRODUCT CARDS
    // -------------------------------------------------

    let html = "";


    data.forEach(function (p) {

        const id =
            escapeHTML(p.id);


        const name =
            escapeHTML(
                p.name
            );


        const description =
            escapeHTML(
                p.description || ""
            );


        const image =
            escapeHTML(
                p.image || ""
            );


        const price =
            Number(
                p.price || 0
            ).toLocaleString(
                "en-ZA",
                {
                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2
                }
            );


        html += `

            <div class="product-card">


                <!-- PRODUCT IMAGE -->

                <div class="product-image-container">

                    ${
                        image

                        ?

                        `

                        <img
                            src="${image}"
                            alt="${name}"
                            class="product-image"
                        >

                        `

                        :

                        `

                        <div class="no-image">

                            No Image

                        </div>

                        `
                    }

                </div>


                <!-- PRODUCT DETAILS -->

                <div class="product-info">


                    <h3 class="product-name">

                        ${name}

                    </h3>


                    <p class="product-description">

                        ${description}

                    </p>


                    <div class="product-price">

                        R ${price}

                    </div>


                    <div class="product-rating">

                        <span class="star">

                            ★

                        </span>

                        Product

                    </div>


                    <!-- ACTION BUTTONS -->

                    <div class="product-actions">


                        <button
                            class="edit-btn"
                            onclick="editProduct('${id}')"
                        >

                            Edit

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteProduct('${id}')"
                        >

                            Delete

                        </button>


                    </div>


                </div>


            </div>

        `;

    });


    container.innerHTML =
        html;

}


// =====================================================
// DELETE PRODUCT
// =====================================================

window.deleteProduct = async function (id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmed) {

        return;

    }


    // -------------------------------------------------
    // Get product first so we can identify image
    // -------------------------------------------------

    const {
        data: product,
        error: fetchError
    } =
        await supabaseClient
            .from("yanaProducts")
            .select("*")
            .eq("id", id)
            .single();


    if (fetchError) {

        console.error(
            "Product lookup error:",
            fetchError
        );

        alert(
            fetchError.message
        );

        return;
    }


    // -------------------------------------------------
    // DELETE DATABASE RECORD
    // -------------------------------------------------

    const {
        error
    } =
        await supabaseClient
            .from("yanaProducts")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            error.message
        );

        return;
    }


    // -------------------------------------------------
    // DELETE IMAGE FROM STORAGE
    // -------------------------------------------------

    if (
        product &&
        product.image
    ) {

        try {

            const imageUrl =
                new URL(
                    product.image
                );


            const path =
                imageUrl.pathname
                    .split("/storage/v1/object/public/products/")[1];


            if (path) {

                await supabaseClient
                    .storage
                    .from("products")
                    .remove([
                        decodeURIComponent(path)
                    ]);

            }

        } catch (storageError) {

            console.warn(
                "Could not remove image:",
                storageError
            );

        }

    }


    alert(
        "Product deleted successfully."
    );


    loadProducts();

};


// =====================================================
// EDIT PRODUCT
// =====================================================

window.editProduct = async function (id) {

    // -------------------------------------------------
    // GET PRODUCT
    // -------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("yanaProducts")
            .select("*")
            .eq("id", id)
            .single();


    if (error) {

        console.error(
            "Get product error:",
            error
        );

        alert(
            error.message
        );

        return;
    }


    // -------------------------------------------------
    // PRODUCT NAME
    // -------------------------------------------------

    const newName =
        prompt(
            "Product name:",
            data.name || ""
        );


    if (newName === null) {

        return;

    }


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    const newDescription =
        prompt(
            "Product description:",
            data.description || ""
        );


    if (newDescription === null) {

        return;

    }


    // -------------------------------------------------
    // PRICE
    // -------------------------------------------------

    const newPrice =
        prompt(
            "Product price:",
            data.price || ""
        );


    if (newPrice === null) {

        return;

    }


    const numericPrice =
        Number(
            newPrice
        );


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
        !newName.trim() ||
        isNaN(numericPrice) ||
        numericPrice < 0
    ) {

        alert(
            "Please enter valid product information."
        );

        return;

    }


    // -------------------------------------------------
    // UPDATE PRODUCT
    // -------------------------------------------------

    const {
        error: updateError
    } =
        await supabaseClient
            .from("yanaProducts")
            .update({

                name:
                    newName.trim(),

                description:
                    newDescription.trim(),

                price:
                    numericPrice

            })
            .eq(
                "id",
                id
            );


    if (updateError) {

        console.error(
            "Update product error:",
            updateError
        );

        alert(
            updateError.message
        );

        return;
    }


    alert(
        "Product updated successfully!"
    );


    loadProducts();

};


// =====================================================
// ORDERS
// =====================================================


// -----------------------------------------------------
// LOAD ORDERS
// -----------------------------------------------------

async function loadOrders() {

    const ordersContainer =
        document.getElementById("orders");


    if (!ordersContainer) {

        console.error(
            "Orders container not found"
        );

        return;
    }


    // -------------------------------------------------
    // LOADING
    // -------------------------------------------------

    ordersContainer.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="loading-cell"
            >

                Loading orders...

            </td>

        </tr>

    `;


    // -------------------------------------------------
    // GET ORDERS
    // -------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Orders error:",
            error
        );


        ordersContainer.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="error-cell"
                >

                    Unable to load orders.

                </td>

            </tr>

        `;

        return;
    }


    // -------------------------------------------------
    // NO ORDERS
    // -------------------------------------------------

    if (
        !data ||
        data.length === 0
    ) {

        ordersContainer.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-cell"
                >

                    No orders yet.

                </td>

            </tr>

        `;

        return;
    }


    // -------------------------------------------------
    // CREATE TABLE ROWS
    // -------------------------------------------------

    let html = "";


    data.forEach(
        function (o, index) {


            const customer =
                escapeHTML(
                    o.customer_name ||
                    "Unknown"
                );


            const phone =
                escapeHTML(
                    o.phone ||
                    ""
                );


            const product =
                escapeHTML(
                    o.product_name ||
                    "Unknown"
                );


            const status =
                String(
                    o.status ||
                    "pending"
                ).toLowerCase();


            // Quantity

            const quantity =
                o.quantity !== null &&
                o.quantity !== undefined

                    ?

                    o.quantity

                    :

                    1;


            // Total

            let total = "—";


            if (
                o.total !== null &&
                o.total !== undefined &&
                o.total !== ""
            ) {

                total =
                    "R " +
                    Number(
                        o.total
                    ).toLocaleString(
                        "en-ZA",
                        {
                            minimumFractionDigits: 2,

                            maximumFractionDigits: 2
                        }
                    );

            }


            // Date

            const date =
                o.created_at

                    ?

                    new Date(
                        o.created_at
                    ).toLocaleDateString(
                        "en-ZA",
                        {
                            day: "2-digit",

                            month: "2-digit",

                            year: "numeric"
                        }
                    )

                    :

                    "—";


            // -------------------------------------------------
            // STATUS CLASS
            // -------------------------------------------------

            let statusClass =
                "status-pending";


            if (
                status === "completed" ||
                status === "complete" ||
                status === "paid"
            ) {

                statusClass =
                    "status-paid";

            }


            if (
                status === "cancelled" ||
                status === "canceled"
            ) {

                statusClass =
                    "status-cancelled";

            }


            // Display status

            let displayStatus =
                status;


            if (
                status === "pending"
            ) {

                displayStatus =
                    "Pending";

            }


            if (
                status === "completed" ||
                status === "complete"
            ) {

                displayStatus =
                    "Completed";

            }


            if (
                status === "cancelled" ||
                status === "canceled"
            ) {

                displayStatus =
                    "Cancelled";

            }


            // -------------------------------------------------
            // TABLE ROW
            // -------------------------------------------------

            html += `

                <tr>


                    <!-- ORDER -->

                    <td>

                        <span
                            class="order-number"
                        >

                            #${index + 1}

                        </span>

                    </td>


                    <!-- CUSTOMER -->

                    <td>

                        <div
                            class="customer-name"
                        >

                            ${customer}

                        </div>


                        <div
                            class="customer-phone"
                        >

                            ${phone}

                        </div>

                    </td>


                    <!-- PRODUCT -->

                    <td>

                        <span
                            class="order-product"
                        >

                            ${product}

                        </span>

                    </td>


                    <!-- QUANTITY -->

                    <td
                        class="quantity-cell"
                    >

                        ${quantity}

                    </td>


                    <!-- TOTAL -->

                    <td>

                        <strong
                            class="order-total"
                        >

                            ${total}

                        </strong>

                    </td>


                    <!-- STATUS -->

                    <td>

                        <select
                            class="order-status-select ${statusClass}"
                            onchange="updateStatus('${escapeHTML(o.id)}', this.value)"
                        >

                            <option
                                value="pending"
                                ${status === "pending" ? "selected" : ""}
                            >
                                Pending
                            </option>


                            <option
                                value="completed"
                                ${
                                    status === "completed" ||
                                    status === "complete" ||
                                    status === "paid"
                                    ? "selected"
                                    : ""
                                }
                            >
                                Completed
                            </option>


                            <option
                                value="cancelled"
                                ${
                                    status === "cancelled" ||
                                    status === "canceled"
                                    ? "selected"
                                    : ""
                                }
                            >
                                Cancelled
                            </option>

                        </select>

                    </td>


                    <!-- DATE -->

                    <td>

                        <span
                            class="order-date"
                        >

                            ${date}

                        </span>

                    </td>


                </tr>

            `;

        }
    );


    ordersContainer.innerHTML =
        html;

}


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

window.updateStatus = async function (
    id,
    status
) {

    const {
        error
    } =
        await supabaseClient
            .from("orders")
            .update({
                status: status
            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Update status error:",
            error
        );

        alert(
            "Could not update order status: " +
            error.message
        );

        return;
    }


    console.log(
        "Order status updated:",
        id,
        status
    );


    // Refresh table

    loadOrders();

};