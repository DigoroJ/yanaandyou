console.log("Dashboard JS loaded");

// ✅ DO NOT redeclare 'supabase' (CDN already provides it)
const supabaseClient = window.supabase.createClient(
  "https://werxumvelpzbuqtixjnm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlcnh1bXZlbHB6YnVxdGl4am5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDAzMTUsImV4cCI6MjA5MjI3NjMxNX0.kpE77bGrTYpeac75votgyBKIRNEE19EtB_bz_iMcHfc"
);

// ================= AUTH =================

// ✅ LOGIN
window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  console.log("LOGIN:", data, error);

  if (error) {
    alert(error.message);
  } else {
    showDashboard();
    const { data: sessionData } = await supabaseClient.auth.getSession();
    console.log("SESSION:", sessionData);
  }
};

// ✅ LOGOUT
window.logout = async function () {
  await supabaseClient.auth.signOut();
  location.reload();
};

// ✅ AUTO LOGIN
async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard();
    const { data: sessionData } = await supabaseClient.auth.getSession();
    console.log("SESSION:", sessionData);
  }
}
checkUser();

// ✅ SHOW DASHBOARD
function showDashboard() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  loadProducts();
  loadOrders();
}

// ================= PRODUCTS =================

// ✅ ADD PRODUCT (WITH IMAGE UPLOAD)
window.addProduct = async function () {

  const name = document.getElementById("pname").value;
  const description = document.getElementById("pdesc").value;
  const price = document.getElementById("pprice").value;
  const file = document.getElementById("pimage").files[0];

debugger  

  if (!name || !price) {
    alert("Enter product name and price");
    return;
  }

  if (!file) {
    alert("Select an image");
    return;
  }

  const fileName = Date.now() + "_" + file.name.replace(/\s+/g, "_");

  // Upload image
  const { error: uploadError } = await supabaseClient.storage
    .from("products")
  .upload(fileName, file, {
    contentType: file.type
  });

  if (uploadError) {
    alert(uploadError.message);
    return;
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from("products")
    .getPublicUrl(fileName);

  const imageUrl = urlData.publicUrl;

  // Insert into DB
  const { error } = await supabaseClient.from("yanaProducts").insert([
    {
      name,
      description,
      price,
      image: imageUrl
    }
  ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Product added!");

  // Clear inputs
  document.getElementById("pname").value = "";
  document.getElementById("pdesc").value = "";
  document.getElementById("pprice").value = "";
  document.getElementById("pimage").value = "";

  loadProducts();
};

// ✅ LOAD PRODUCTS
async function loadProducts() {

  const { data, error } = await supabaseClient
    .from("yanaProducts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products error:", error);
    return;
  }

  let html = "";

  data.forEach(p => {
    html += `
    <div class="card">
      <b>${p.name}</b> - R${p.price}
      <br>${p.description || ""}
      <br><img src="${p.image}" width="100">
      <br>
      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>
    `;
  });

  document.getElementById("products").innerHTML = html;
}

// ✅ DELETE PRODUCT
window.deleteProduct = async function (id) {
  const { error } = await supabaseClient
    .from("yanaProducts")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadProducts();
};

// ================= ORDERS =================

// ✅ LOAD ORDERS
async function loadOrders() {

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Orders error:", error);
    return;
  }

  let html = "";

  data.forEach(o => {
    html += `
    <div class="card">
      <b>${o.customer_name}</b> (${o.phone})
      <br>${o.product_name}
      <br>Status: ${o.status}
      <br>
      <button onclick="updateStatus('${o.id}','completed')">Complete</button>
      <button onclick="updateStatus('${o.id}','pending')">Pending</button>
    </div>
    `;
  });

  document.getElementById("orders").innerHTML = html;
}

// ✅ UPDATE ORDER STATUS
window.updateStatus = async function (id, status) {
  const { error } = await supabaseClient
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadOrders();
};