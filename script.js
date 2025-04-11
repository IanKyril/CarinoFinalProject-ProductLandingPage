document.addEventListener('DOMContentLoaded', function () {
    const inputs = document.querySelectorAll('.form-input');
    const popup = document.getElementById('popup');

    inputs.forEach(input => {
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && this.value.trim() === '') {
                event.preventDefault();
                popup.style.display = 'block';
                setTimeout(() => {
                    popup.style.display = 'none';
                }, 3000);
            }
        });
    });

    // Add to cart functionality
    if (document.querySelector(".btn-add-to-cart")) {
        document.querySelectorAll(".btn-add-to-cart").forEach((button) => {
            button.addEventListener("click", () => {
                const card = button.closest(".compact-card");
                const title = card.querySelector(".compact-card__title").innerText;
                const author = card.querySelector(".compact-card__author").innerText;
                const price = card.querySelector(".compact-card__price").innerText;
                const img = card.querySelector("img").getAttribute("src");

                const product = { title, author, price, img, quantity: 1 };
                let cart = JSON.parse(localStorage.getItem("cart")) || [];

                const existing = cart.find(item => item.title === product.title);
                if (existing) {
                    existing.quantity = 1;
                } else {
                    cart.unshift(product);
                }

                localStorage.setItem("cart", JSON.stringify(cart));

                const popupMessage = document.createElement('div');
                popupMessage.classList.add('popup');
                popupMessage.innerText = `${title} has been added to your cart.`;
                document.body.appendChild(popupMessage);

                setTimeout(() => {
                    popupMessage.remove();
                }, 3000);
            });
        });
    }

    // Cart page functionality
    if (document.getElementById("cart-items")) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const container = document.getElementById("cart-items");
        const emptyMsg = document.getElementById("empty-message");
        const totalContainer = document.getElementById("cart-total");
        const checkoutBtn = document.getElementById("checkout-btn");

        function parsePrice(str) {
            return parseFloat(str.replace(/[^0-9.]/g, ""));
        }

        function updateTotal() {
            const selectedItems = Array.from(document.querySelectorAll('.cart-checkbox:checked'));
            let total = 0;
            selectedItems.forEach(checkbox => {
                const index = parseInt(checkbox.dataset.index);
                const item = cart[index];
                if (item && item.price && item.quantity) {
                    total += parsePrice(item.price) * item.quantity;
                }
            });
            totalContainer.innerText = `₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            checkoutBtn.style.backgroundColor = selectedItems.length > 0 ? 'lightcoral' : '';
        }

        function renderCart() {
            cart = JSON.parse(localStorage.getItem("cart")) || [];
            container.innerHTML = "";
            if (cart.length === 0) {
                emptyMsg.classList.remove("hidden");
                totalContainer.innerText = "₱0.00";
                return;
            }

            cart.forEach((item, index) => {
                const div = document.createElement("div");
                div.className = "cart-item bg-white rounded-xl shadow p-4 flex items-center justify-between relative";

                div.innerHTML = `
                    <input type="checkbox" class="cart-checkbox" data-index="${index}" />
                    <img src="${item.img}" class="w-24 h-32 object-cover rounded">
                    <div class="item-details flex-1 ml-4">  
                        <h2 class="text-xl font-semibold">${item.title}</h2>
                        <p class="text-sm text-gray-600">${item.author}</p>
                        <div class="mt-2">
                            <label class="block">Quantity:
                                <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input border rounded p-1 w-16 mt-1"/>
                            </label>
                        </div>
                    </div>
                    <div class="item-actions flex flex-col items-end justify-between">
                        <p class="text-md font-bold mt-1">${item.price}</p>
                        <button data-index="${index}" class="remove-item text-red-600 font-bold text-lg absolute top-2 right-2">Remove</button>
                    </div>
                `;

                container.appendChild(div);
            });

            updateTotal();
        }

        container.addEventListener("input", function (e) {
            if (e.target.classList.contains("quantity-input")) {
                const index = parseInt(e.target.dataset.index);
                const value = parseInt(e.target.value);
                cart[index].quantity = value > 0 ? value : 1;
                localStorage.setItem("cart", JSON.stringify(cart));
                updateTotal();
            }
        });

        container.addEventListener("click", function (e) {
            if (e.target.classList.contains("remove-item")) {
                const index = parseInt(e.target.dataset.index);
                cart.splice(index, 1); // Remove item from cart
                localStorage.setItem("cart", JSON.stringify(cart));
                renderCart();
            }
        });

        container.addEventListener('change', function (e) {
            if (e.target.classList.contains('cart-checkbox')) {
                updateTotal();
            }
        });

        checkoutBtn.addEventListener("click", function () {
            const selectedItems = Array.from(document.querySelectorAll('.cart-checkbox:checked'));

            if (selectedItems.length === 0) {
                alert("Please select items to purchase.");
            } else {
                const selectedBooks = selectedItems.map(checkbox => {
                    const index = parseInt(checkbox.dataset.index);
                    return { ...cart[index], index };
                });
                openPaymentModal(selectedBooks);
            }
        });

        renderCart();
    }

    // Order list rendering on profile page
    const ordersTab = document.getElementById("orders");
    if (ordersTab) {
        renderOrders();
    }
});

// Payment modal logic
function openPaymentModal(selectedBooks) {
    const booksListElement = document.getElementById("booksList");
    const totalPriceElement = document.getElementById("totalPrice");
    const submitButton = document.getElementById("submitButton");
    let totalPrice = 0;

    booksListElement.innerHTML = '';
    selectedBooks.forEach(book => {
        const bookElement = document.createElement("li");
        const bookTotalPrice = parsePrice(book.price) * book.quantity;
        bookElement.textContent = `${book.title} - ${book.price} x ${book.quantity} = ₱${bookTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        booksListElement.appendChild(bookElement);
        totalPrice += bookTotalPrice;
    });

    totalPriceElement.textContent = totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 });

    document.getElementById("paymentModal").style.display = "block";
    document.getElementById("paymentMethodSelection").style.display = "block";
    document.getElementById("cardPaymentForm").style.display = "none";
    document.getElementById("codConfirmation").style.display = "none";
    submitButton.style.display = "block";

    document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
        radio.addEventListener('change', function () {
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            document.getElementById("cardPaymentForm").style.display = selectedMethod === 'Card' ? "block" : "none";
            document.getElementById("codConfirmation").style.display = selectedMethod === 'Cash on Delivery' ? "block" : "none";
        });
    });

    submitButton.onclick = function () {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        if (selectedMethod === 'Card') {
            const inputs = document.querySelectorAll('#cardPaymentForm input');
            let allFilled = true;
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    allFilled = false;
                }
            });
            if (!allFilled) {
                alert("Please complete all card payment fields.");
                return;
            }
        }

        alert("Your order has been placed successfully!");

        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        const orderDetails = selectedBooks.map(book => ({
            title: book.title,
            author: book.author,
            price: book.price,
            quantity: book.quantity,
            totalPrice: parsePrice(book.price) * book.quantity,
            paymentMethod: selectedMethod
        }));

        orders.push({
            orderNumber: Date.now(),
            date: new Date().toLocaleString(),
            items: orderDetails,
            status: "Pending"
        });

        localStorage.setItem("orders", JSON.stringify(orders));

        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const updatedCart = cart.filter((_, index) => !selectedBooks.some(book => book.index === index));
        localStorage.setItem("cart", JSON.stringify(updatedCart));

        closeModal();
        window.location.reload();
    };
}

function parsePrice(price) {
    return parseFloat(price.replace(/[^0-9.]/g, ""));
}

function closeModal() {
    document.getElementById("paymentModal").style.display = "none";
}

function removeOrder(index) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.splice(index, 1);
    localStorage.setItem("orders", JSON.stringify(orders));
}

function renderOrders() {
    const ordersTab = document.getElementById("orders");
    const orderList = ordersTab.querySelector("#order-list");
    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    orderList.innerHTML = '';

    if (orders.length === 0) {
        orderList.innerHTML = "<p>No orders placed yet.</p>";
    } else {
        orders.forEach((order, index) => {
            const orderElement = document.createElement("li");
            orderElement.classList.add("order-item");
            orderElement.innerHTML = `
                <div style="position: relative; padding: 10px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 5px;">
                    <strong>Order #${order.orderNumber}</strong> - ${order.date}<br/>
                    Status: <span class="order-status">${order.status}</span><br/>
                    <ul>
                        ${order.items.map(item => `
                            <li>${item.title} - ${item.quantity} x ₱${item.price} = ₱${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</li>
                        `).join('')}
                    </ul>
                    <button data-index="${index}" class="remove-order text-red-600 font-bold text-lg absolute top-2 right-2">Cancel Order</button>
                </div>
            `;
            orderList.appendChild(orderElement);
        });

        orderList.querySelectorAll('.remove-order').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                removeOrder(index);
                renderOrders();
            });
        });
    }
}

// Editable info sections
const editPersonalInfoBtn = document.getElementById("editPersonalInfo");
if (editPersonalInfoBtn) {
    editPersonalInfoBtn.addEventListener("click", () => {
        const form = document.getElementById("personalInfoForm");
        form.querySelectorAll("input").forEach(input => {
            input.disabled = false;
        });
        editPersonalInfoBtn.innerText = "Save Changes";
        editPersonalInfoBtn.setAttribute("id", "savePersonalInfo");
    });
}

const editPaymentBtn = document.getElementById("editPayment");
if (editPaymentBtn) {
    editPaymentBtn.addEventListener("click", () => {
        const form = document.getElementById("paymentForm");
        form.querySelectorAll("input").forEach(input => {
            input.disabled = false;
        });
        editPaymentBtn.innerText = "Save Changes";
        editPaymentBtn.setAttribute("id", "savePaymentInfo");
    });
}