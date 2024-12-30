let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
let menuCategories = JSON.parse(localStorage.getItem('menuCategories')) || [];
let occupiedTables = JSON.parse(localStorage.getItem('occupiedTables')) || [];

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryList();
    loadCategoryButtons();
    showTables();
    scheduleDailyReset();
    setupReportButtons(); // Ensure report buttons are setup on load
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

function showCategoryForm(category = null) {
    document.getElementById('categoryFormModal').style.display = 'flex';
    document.getElementById('categoryFormTitle').innerText = category ? 'Edit Category' : 'Add New Category';

    if (category) {
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
    } else {
        document.getElementById('categoryForm').reset();
    }
}

function closeCategoryForm() {
    document.getElementById('categoryFormModal').style.display = 'none';
}

function saveCategory(event) {
    event.preventDefault();

    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;

    if (!name) {
        alert('Please provide a valid category name.');
        return;
    }

    if (id) {
        const category = menuCategories.find(cat => cat.id === parseInt(id));
        if (category) {
            category.name = name;
        }
    } else {
        menuCategories.push({ id: Date.now(), name, subcategories: [{ name: "Default", items: [] }] });
    }

    localStorage.setItem('menuCategories', JSON.stringify(menuCategories));
    renderCategoryList();
    closeCategoryForm();
    loadCategoryButtons();
}

function editCategory(id) {
    const category = menuCategories.find(cat => cat.id === id);
    if (category) {
        showCategoryForm(category);
    } else {
        alert('Category not found.');
    }
}

function removeCategory(id) {
    if (confirm('Are you sure you want to remove this category?')) {
        menuCategories = menuCategories.filter(cat => cat.id !== id);
        localStorage.setItem('menuCategories', JSON.stringify(menuCategories));
        renderCategoryList();
        loadCategoryButtons();
    }
}

function renderCategoryList() {
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';

    menuCategories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        const categoryName = document.createElement('span');
        categoryName.innerText = category.name;

        const editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = () => editCategory(category.id);

        const removeButton = document.createElement('button');
        removeButton.innerText = 'Remove';
        removeButton.onclick = () => removeCategory(category.id);

        categoryDiv.appendChild(categoryName);
        categoryDiv.appendChild(editButton);
        categoryDiv.appendChild(removeButton);

        categoryList.appendChild(categoryDiv);
    });
}

function loadCategoryButtons() {
    const categoryButtonsDiv = document.getElementById('category-buttons');
    categoryButtonsDiv.innerHTML = '';

    menuCategories.forEach(category => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'category-button';
        categoryButton.innerText = category.name;
        categoryButton.onclick = () => loadCategoryItems(category.name);
        categoryButtonsDiv.appendChild(categoryButton);
    });
}

function showItemForm(item = null) {
    document.getElementById('itemFormModal').style.display = 'flex';
    document.getElementById('itemFormTitle').innerText = item ? 'Edit Item' : 'Add New Item';

    const categorySelect = document.getElementById('itemCategory');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    menuCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.innerText = category.name;
        categorySelect.appendChild(option);
    });

    if (item) {
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemImage').dataset.image = item.img;
        document.getElementById('itemCategory').value = item.category;
        previewImage({ target: { files: [new File([item.img], 'image.jpg', { type: 'image/jpeg' })] } });
    } else {
        document.getElementById('itemForm').reset();
        previewImage('');
    }
}

function closeItemForm() {
    document.getElementById('itemFormModal').style.display = 'none';
}

function saveMenuItem(event) {
    event.preventDefault();

    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const imgFile = document.getElementById('itemImage').files[0];
    const categoryName = document.getElementById('itemCategory').value;

    if (!name || isNaN(price) || (!imgFile && !id) || !categoryName) {
        alert('Please provide valid name, price, image, and category.');
        return;
    }

    const category = menuCategories.find(cat => cat.name === categoryName);

    if (!category) {
        alert('Selected category does not exist.');
        return;
    }

    if (imgFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            saveItemData(id, name, price, imageData, category);
        };
        reader.readAsDataURL(imgFile);
    } else {
        const imageData = document.getElementById('itemImage').dataset.image;
        saveItemData(id, name, price, imageData, category);
    }
}

function saveItemData(id, name, price, img, category) {
    let item;
    if (id) {
        item = category.subcategories.flatMap(sub => sub.items).find(item => item.id === parseInt(id));
        if (item) {
            item.name = name;
            item.price = price;
            item.img = img;
        }
    } else {
        item = { id: Date.now(), name, price, img };
        const subcategory = category.subcategories.find(sub => sub.name === "Default");
        if (subcategory) {
            subcategory.items.push(item);
        } else {
            category.subcategories.push({ name: "Default", items: [item] });
        }
    }

    localStorage.setItem('menuCategories', JSON.stringify(menuCategories));
    renderMenuItems(category.name);
    closeItemForm();
}

function editMenuItem(id) {
    const item = menuCategories.flatMap(cat => cat.subcategories.flatMap(sub => sub.items)).find(item => item.id === id);
    if (item) {
        showItemForm(item);
    } else {
        alert('Item not found.');
    }
}

function removeMenuItem(id) {
    menuCategories.forEach(category => {
        category.subcategories.forEach(subcategory => {
            subcategory.items = subcategory.items.filter(item => item.id !== id);
        });
    });
    localStorage.setItem('menuCategories', JSON.stringify(menuCategories));
    renderMenuItems(document.getElementById('itemCategory').value);
    loadCategoryButtons();
}

function renderMenuItems(categoryName) {
    const menuItemsList = document.getElementById('menu-items-list');
    menuItemsList.innerHTML = '';

    const category = menuCategories.find(cat => cat.name === categoryName);
    if (!category) return;

    category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
            const menuItemDiv = document.createElement('div');
            menuItemDiv.className = 'menu-item';

            const itemImg = document.createElement('img');
            itemImg.src = item.img;
            itemImg.alt = item.name;

            const itemDetails = document.createElement('div');
            itemDetails.className = 'item-details';

            const itemName = document.createElement('span');
            itemName.innerText = item.name;
            itemName.className = 'item-name';

            const itemPrice = document.createElement('span');
            itemPrice.innerText = `$${item.price.toFixed(2)}`;
            itemPrice.className = 'item-price';

            const editButton = document.createElement('button');
            editButton.innerText = 'Edit';
            editButton.onclick = () => editMenuItem(item.id);

            const removeButton = document.createElement('button');
            removeButton.innerText = 'Remove';
            removeButton.onclick = () => removeMenuItem(item.id);

            itemDetails.appendChild(itemName);
            itemDetails.appendChild(itemPrice);
            itemDetails.appendChild(editButton);
            itemDetails.appendChild(removeButton);

            menuItemDiv.appendChild(itemImg);
            menuItemDiv.appendChild(itemDetails);

            menuItemsList.appendChild(menuItemDiv);
        });
    });
}

document.getElementById('itemCategory').addEventListener('change', (event) => {
    const categoryName = event.target.value;
    renderMenuItems(categoryName);
});

function showTables() {
    const tableList = document.getElementById('table-list');
    tableList.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        const tableButton = document.createElement('button');
        tableButton.className = 'table';
        if (occupiedTables.includes(i)) {
            tableButton.classList.add('occupied');
        }
        tableButton.innerText = 'Table ' + i;
        tableButton.onclick = () => showOrderScreen(i);
        tableList.appendChild(tableButton);
    }
    showContent('home');
}

function showContent(sectionId) {
    const sections = document.querySelectorAll('.content');
    sections.forEach(section => section.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    const links = document.querySelectorAll('.sidebar ul li');
    links.forEach(link => link.classList.remove('active'));
    const clickedLink = document.querySelector(`.sidebar ul li button[onclick="showContent('${sectionId}')"]`).parentNode;
    clickedLink.classList.add('active');
}

function showOrderScreen(tableNumber) {
    document.getElementById('table-number').innerText = tableNumber;
    document.getElementById('table-number-summary').innerText = tableNumber;
    document.getElementById('order-number').innerText = generateOrderNumber();
    loadCategoryItems(menuCategories[0]?.name);
    document.getElementById('sidebar').classList.add('hidden');
    document.querySelector('.order-screen').classList.add('fullscreen');
    showContent('order-screen');
}

function changeTableNumber() {
    const newTableNumber = prompt("Enter new table number:");
    if (newTableNumber !== null) {
        const currentTableNumber = document.getElementById('table-number').innerText;
        clearTableStatus(currentTableNumber);
        markTableAsOccupied(newTableNumber);
        document.getElementById('table-number').innerText = newTableNumber;
        document.getElementById('table-number-summary').innerText = newTableNumber;
    }
}

function generateOrderNumber() {
    return Math.floor(Math.random() * 1000000);
}

function loadCategoryItems(categoryName) {
    const menuCategoriesDiv = document.getElementById('menu-categories-order');
    menuCategoriesDiv.innerHTML = '';

    const category = menuCategories.find(cat => cat.name === categoryName);
    if (!category) return;

    category.subcategories.forEach(subcategory => {
        subcategory.items.forEach(item => {
            const menuItemDiv = document.createElement('div');
            menuItemDiv.className = 'menu-item';

            const itemImg = document.createElement('img');
            itemImg.src = item.img;
            itemImg.alt = item.name;

            const itemDetails = document.createElement('div');
            itemDetails.className = 'item-details';

            const itemName = document.createElement('span');
            itemName.innerText = item.name;
            itemName.className = 'item-name';

            const itemPrice = document.createElement('span');
            itemPrice.innerText = `$${item.price.toFixed(2)}`;
            itemPrice.className = 'item-price';

            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'quantity-buttons';
            const decreaseBtn = document.createElement('button');
            decreaseBtn.innerText = '-';
            decreaseBtn.onclick = (e) => {
                e.stopPropagation();
                updateQuantity(item, -1);
            };
            const quantitySpan = document.createElement('span');
            quantitySpan.innerText = 0;
            quantitySpan.className = 'item-quantity';
            const increaseBtn = document.createElement('button');
            increaseBtn.innerText = '+';
            increaseBtn.onclick = (e) => {
                e.stopPropagation();
                updateQuantity(item, 1);
            };

            quantityDiv.appendChild(decreaseBtn);
            quantityDiv.appendChild(quantitySpan);
            quantityDiv.appendChild(increaseBtn);

            itemDetails.appendChild(itemName);
            itemDetails.appendChild(itemPrice);
            itemDetails.appendChild(quantityDiv);

            menuItemDiv.appendChild(itemImg);
            menuItemDiv.appendChild(itemDetails);
            menuItemDiv.onclick = () => updateQuantity(item, 1);

            menuCategoriesDiv.appendChild(menuItemDiv);
        });
    });
}

function updateQuantity(item, change) {
    let orderItem = document.querySelector(`#order-items .order-item[data-item-name='${item.name}']`);
    let quantitySpan;

    if (!orderItem) {
        orderItem = addItemToOrder(item);
        quantitySpan = orderItem.querySelector('.order-item-quantity');
    } else {
        quantitySpan = orderItem.querySelector('.order-item-quantity');
    }

    let quantity = parseInt(quantitySpan.innerText, 10) + change;
    if (quantity < 0) quantity = 0;
    quantitySpan.innerText = quantity;

    updateOrderSummary(item, quantity);
}

function addItemToOrder(item) {
    const orderItemsList = document.getElementById('order-items');
    const orderItem = document.createElement('li');
    orderItem.className = 'order-item';
    orderItem.setAttribute('data-item-name', item.name);
    orderItem.innerHTML = `
        <span class="order-item-name">${item.name}</span>
        <span class="order-item-quantity">1</span>
        <span class="order-item-total">$${item.price.toFixed(2)}</span>
        <button onclick="removeOrderItem('${item.name}')">Remove</button>
    `;
    orderItemsList.appendChild(orderItem);
    return orderItem;
}

function updateOrderSummary(item, quantity) {
    const orderItem = document.querySelector(`#order-items .order-item[data-item-name='${item.name}']`);
    const totalSpan = orderItem.querySelector('.order-item-total');
    totalSpan.innerText = `$${(item.price * quantity).toFixed(2)}`;
    updateOrderTotals();
}

function updateOrderTotals() {
    let subtotal = 0;
    document.querySelectorAll('#order-items .order-item').forEach(orderItem => {
        subtotal += parseFloat(orderItem.querySelector('.order-item-total').innerText.replace('$', ''));
    });
    const tax = subtotal * 0.1; // Example tax rate: 10%
    const total = subtotal + tax;
    document.getElementById('order-subtotal').innerText = subtotal.toFixed(2);
    document.getElementById('order-tax').innerText = tax.toFixed(2);
    document.getElementById('order-total').innerText = total.toFixed(2);
}

function removeOrderItem(itemName) {
    const orderItem = document.querySelector(`#order-items .order-item[data-item-name='${itemName}']`);
    if (orderItem) {
        orderItem.remove();
    }
    updateOrderTotals();
}

function applyDiscount() {
    const discount = prompt("Enter discount percentage:");
    if (discount !== null) {
        const discountPercentage = parseFloat(discount) / 100;
        let subtotal = parseFloat(document.getElementById('order-subtotal').innerText);
        let totalDiscount = subtotal * discountPercentage;
        let newSubtotal = subtotal - totalDiscount;
        let tax = newSubtotal * 0.1;
        let total = newSubtotal + tax;

        document.getElementById('order-subtotal').innerText = newSubtotal.toFixed(2);
        document.getElementById('order-tax').innerText = tax.toFixed(2);
        document.getElementById('order-total').innerText = total.toFixed(2);
    }
}

function addTip() {
    const tip = prompt("Enter tip amount:");
    if (tip !== null) {
        let total = parseFloat(document.getElementById('order-total').innerText);
        let newTotal = total + parseFloat(tip);

        document.getElementById('order-total').innerText = newTotal.toFixed(2);
    }
}

function finalizeOrder() {
    const orderItems = Array.from(document.querySelectorAll('#order-items .order-item')).map(orderItem => {
        const name = orderItem.querySelector('.order-item-name').innerText;
        const quantity = parseInt(orderItem.querySelector('.order-item-quantity').innerText);
        const total = parseFloat(orderItem.querySelector('.order-item-total').innerText.replace('$', ''));
        return { name, quantity, total };
    });

    const sale = {
        date: new Date().toISOString(),
        items: orderItems,
        total: orderItems.reduce((acc, item) => acc + item.total, 0),
        paymentMethod: 'Credit Card', // Example, can be dynamic
        staff: 'John Doe' // Example, can be dynamic
    };

    salesData.push(sale);
    localStorage.setItem('salesData', JSON.stringify(salesData));

    sendKOTToKitchen(orderItems);
    sendKOTToBar(orderItems);

    alert('Order finalized and sent to the kitchen and bar.');

    const tableNumber = document.getElementById('table-number').innerText;
    markTableAsOccupied(tableNumber);
    showTables();
}

function sendKOTToKitchen(orderItems) {
    console.log('KOT sent to kitchen:', orderItems);
}

function sendKOTToKitchen(orderItems) {
    console.log('KOT sent to kitchen:', orderItems);
}

function sendKOTToBar(orderItems) {
    console.log('KOT sent to bar:', orderItems);
}

function markTableAsOccupied(tableNumber) {
    const tableButton = Array.from(document.querySelectorAll('.table')).find(button => button.innerText === 'Table ' + tableNumber);
    if (tableButton) {
        tableButton.classList.add('occupied');
        occupiedTables.push(parseInt(tableNumber, 10));
        localStorage.setItem('occupiedTables', JSON.stringify(occupiedTables));
    } else {
        alert('Table not found.');
    }
}

function clearTableStatus(tableNumber) {
    const tableButton = Array.from(document.querySelectorAll('.table')).find(button => button.innerText === 'Table ' + tableNumber);
    if (tableButton) {
        tableButton.classList.remove('occupied');
        const index = occupiedTables.indexOf(parseInt(tableNumber, 10));
        if (index !== -1) {
            occupiedTables.splice(index, 1);
            localStorage.setItem('occupiedTables', JSON.stringify(occupiedTables));
        }
    } else {
        alert('Table not found.');
    }
}

function settlePayment(tableNumber) {
    alert('Payment settled for Table ' + tableNumber);

    clearTableStatus(tableNumber);
    showTables();
}

function openModal() {
    const totalAmount = parseFloat(document.getElementById('order-total').innerText);
    document.getElementById('amount-due').innerText = totalAmount.toFixed(2);
    document.getElementById('total-received').innerText = '0.00';
    document.getElementById('change').innerText = '0.00';
    document.getElementById('cash-amount').value = '';
    document.getElementById('card-amount').value = '';
    document.getElementById('wallet-amount').value = '';
    document.getElementById('paymentModal').style.display = 'flex';
}

function calculateTotalReceived() {
    const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
    const cardAmount = parseFloat(document.getElementById('card-amount').value) || 0;
    const walletAmount = parseFloat(document.getElementById('wallet-amount').value) || 0;

    const totalReceived = cashAmount + cardAmount + walletAmount;
    const amountDue = parseFloat(document.getElementById('amount-due').innerText);

    document.getElementById('total-received').innerText = totalReceived.toFixed(2);

    const change = totalReceived - amountDue;
    document.getElementById('change').innerText = change >= 0 ? change.toFixed(2) : '0.00';
}

function finalizePayment() {
    const amountDue = parseFloat(document.getElementById('amount-due').innerText);
    const totalReceived = parseFloat(document.getElementById('total-received').innerText);
    const change = totalReceived - amountDue;

    if (totalReceived < amountDue) {
        alert('Insufficient payment amount.');
        return;
    }

    const tableNumber = document.getElementById('table-number').innerText;
    const paymentMethods = {
        cash: parseFloat(document.getElementById('cash-amount').value) || 0,
        card: parseFloat(document.getElementById('card-amount').value) || 0,
        digitalWallet: parseFloat(document.getElementById('wallet-amount').value) || 0
    };

    processPayment(tableNumber, paymentMethods, amountDue, change);
    closeModal();
}

function processPayment(tableNumber, paymentMethods, amountDue, change) {
    alert(`Payment successful! Change: $${change.toFixed(2)}`);
    generateReceipt(paymentMethods, amountDue, change);
    clearTableStatus(tableNumber);
    showTables();
}

function generateReceipt(paymentMethods, amountDue, change) {
    const receiptContent = document.getElementById('receipt-content');
    const orderItems = Array.from(document.querySelectorAll('#order-items .order-item')).map(item => ({
        name: item.querySelector('.order-item-name').innerText,
        quantity: item.querySelector('.order-item-quantity').innerText,
        total: item.querySelector('.order-item-total').innerText,
    }));

    const date = new Date();
    const dateString = date.toLocaleDateString('en-US');
    const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let receiptHTML = `
        <div style="text-align: center;">
            <h2>Good Restaurant</h2>
            <p>89 Greenwich Ave.<br>
            Phone: 212-691-8080</p>
        </div>
        <p>Party of 2<br>Table ${document.getElementById('table-number').innerText}<br>Server: Jeremy<br>${timeString} ${dateString}</p>
        <ul style="list-style-type: none; padding: 0;">
    `;
    orderItems.forEach(item => {
        receiptHTML += `<li>${item.quantity} x ${item.name} - $${item.total}</li>`;
    });
    receiptHTML += `
        </ul>
        <p>Subtotal: $${document.getElementById('order-subtotal').innerText}</p>
        <p>Tax: $${document.getElementById('order-tax').innerText}</p>
        <p>Total: $${amountDue.toFixed(2)}</p>
        <p>Change: $${change.toFixed(2)}</p>
        <div style="text-align: center; margin-top: 20px;">
            <p>Thank you!</p>
            <p>goodrestaurantnyc.com</p>
            <p>Dinner, Lunch, Brunch</p>
        </div>
    `;

    receiptContent.innerHTML = receiptHTML;
    document.getElementById('receipt').style.display = 'block';
    printReceipt();
}

function printReceipt() {
    const receipt = document.getElementById('receipt');
    const newWindow = window.open('', 'Print-Window');
    newWindow.document.open();
    newWindow.document.write(`<html><body onload="window.print()">${receipt.innerHTML}</body></html>`);
    newWindow.document.close();
    setTimeout(() => {
        newWindow.close();
        document.getElementById('receipt').style.display = 'none';
        document.getElementById('receipt-content').innerHTML = '';
    }, 10);
}

function closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function logout() {
    alert('Logging out...');
}

function loadCategoryList() {
    if (!menuCategories.length) {
        menuCategories = [
            {
                id: 1,
                name: 'Appetizers',
                subcategories: [
                    {
                        name: 'Fried',
                        items: [
                            { id: 1, name: 'Spring Rolls', price: 5.99, img: 'spring_rolls.jpg' },
                            { id: 2, name: 'Chicken Wings', price: 7.99, img: 'chicken_wings.jpg' }
                        ]
                    },
                    {
                        name: 'Grilled',
                        items: [
                            { id: 3, name: 'Grilled Shrimp', price: 9.99, img: 'grilled_shrimp.jpg' }
                        ]
                    }
                ]
            },
            {
                id: 2,
                name: 'Main Course',
                subcategories: [
                    {
                        name: 'Vegetarian',
                        items: [
                            { id: 4, name: 'Veggie Burger', price: 8.99, img: 'veggie_burger.jpg' },
                            { id: 5, name: 'Pasta Primavera', price: 10.99, img: 'pasta_primavera.jpg' }
                        ]
                    }
                ]
            }
        ];
        localStorage.setItem('menuCategories', JSON.stringify(menuCategories));
    }

    renderCategoryList();
    loadCategoryButtons();
}

function generateSalesReport() {
    const reportContent = document.getElementById('report-content');
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    const dailySales = salesData.reduce((acc, sale) => {
        const date = sale.date.split('T')[0];
        if (!acc[date]) {
            acc[date] = { total: 0, transactions: 0, items: {}, paymentMethods: {} };
        }
        acc[date].total += sale.total;
        acc[date].transactions += 1;
        sale.items.forEach(item => {
            if (!acc[date].items[item.name]) {
                acc[date].items[item.name] = { quantity: 0, revenue: 0 };
            }
            acc[date].items[item.name].quantity += item.quantity;
            acc[date].items[item.name].revenue += parseFloat(item.total);
        });
        acc[date].paymentMethods[sale.paymentMethod] = (acc[date].paymentMethods[sale.paymentMethod] || 0) + sale.total;
        return acc;
    }, {});

    let reportHTML = '<h3>Sales Report</h3>';
    Object.keys(dailySales).forEach(date => {
        const sales = dailySales[date];
        const avgTransactionValue = sales.total / sales.transactions;
        reportHTML += `
            <h4>${date}</h4>
            <p>Total Sales: $${sales.total.toFixed(2)}</p>
                       <p>Number of Transactions: ${sales.transactions}</p>
            <p>Average Transaction Value: $${avgTransactionValue.toFixed(2)}</p>
            <table>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Revenue ($)</th>
                </tr>
        `;
        Object.keys(sales.items).forEach(itemName => {
            const item = sales.items[itemName];
            reportHTML += `
                <tr>
                    <td>${itemName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.revenue.toFixed(2)}</td>
                </tr>
            `;
        });
        reportHTML += `
            </table>
            <h5>Payment Methods</h5>
            <table>
                <tr>
                    <th>Method</th>
                    <th>Amount ($)</th>
                </tr>
        `;
        Object.keys(sales.paymentMethods).forEach(method => {
            reportHTML += `
                <tr>
                    <td>${method}</td>
                    <td>${sales.paymentMethods[method].toFixed(2)}</td>
                </tr>
            `;
        });
        reportHTML += `
            </table>
        `;
    });

    reportContent.innerHTML = reportHTML;
}

function resetSalesData() {
    salesData = [];
    localStorage.setItem('salesData', JSON.stringify(salesData));
    alert('Sales data has been reset.');
}

function scheduleDailyReset() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    setTimeout(() => {
        resetSalesData();
        scheduleDailyReset();
    }, timeUntilMidnight);
}

function printSalesReport() {
    const reportContent = document.getElementById('report-content').innerHTML;
    const newWindow = window.open('', 'Print-Window');
    newWindow.document.open();
    newWindow.document.write(`<html><body onload="window.print()">${reportContent}</body></html>`);
    newWindow.document.close();
    setTimeout(() => {
        newWindow.close();
    }, 10);
}

document.getElementById('reset-sales-data').addEventListener('click', resetSalesData);
document.getElementById('print-sales-report').addEventListener('click', printSalesReport);
document.getElementById('generate-sales-report').addEventListener('click', generateSalesReport);
document.addEventListener('DOMContentLoaded', () => {
    loadCategoryList();
    loadCategoryButtons();
    showTables();
    scheduleDailyReset();
    setupReportButtons();

    document.getElementById('reset-reports').addEventListener('click', resetAndPrintReports);
});

function resetAndPrintReports() {
    console.log('Reset and Print Reports button clicked');

    // Clear any previous content to avoid duplication
    document.getElementById('report-content').innerHTML = '';

    // Generate all reports and then print and reset
    generateAllReports();
    setTimeout(() => {
        printReports();
        resetReportsData();
    }, 2000); // Ensure a delay to allow reports generation
}

function generateAllReports() {
    console.log('Generating all reports');
    generateDailySalesSummary();
    generateSalesByCategory();
    generatePaymentMethodSummary();
    generateVoidRefundActivity();
    generateCustomerFrequencySpend();
    generateLoyaltyProgramMetrics();
    generateDailyFinancialSummary();
    generateDiscountUsageReport();
    generateExportSharingOptions();
    generateRealTimeReporting();
    generateVisualizations();
}

function printReports() {
    console.log('Printing reports');
    const reportContent = document.getElementById('report-content').innerHTML;
    const newWindow = window.open('', 'Print-Window');
    newWindow.document.open();
    newWindow.document.write(`<html><body onload="window.print()">${reportContent}</body></html>`);
    newWindow.document.close();
    setTimeout(() => {
        newWindow.close();
    }, 10);
}

function resetReportsData() {
    console.log('Resetting reports data');
    // Clear all report data from localStorage
    localStorage.removeItem('salesData');
    localStorage.removeItem('voidRefundData');
    localStorage.removeItem('customerData');
    localStorage.removeItem('loyaltyData');
    localStorage.removeItem('discountData');

    // Reset the report content
    document.getElementById('report-content').innerHTML = '<p>No reports generated yet.</p>';
}

function setupReportButtons() {
    console.log('Setting up report buttons');
    document.getElementById('daily-sales-summary').addEventListener('click', generateDailySalesSummary);
    document.getElementById('sales-by-category').addEventListener('click', generateSalesByCategory);
    document.getElementById('payment-method-summary').addEventListener('click', generatePaymentMethodSummary);
    document.getElementById('void-refund-activity').addEventListener('click', generateVoidRefundActivity);
    document.getElementById('customer-frequency-spend').addEventListener('click', generateCustomerFrequencySpend);
    document.getElementById('loyalty-program-metrics').addEventListener('click', generateLoyaltyProgramMetrics);
    document.getElementById('daily-financial-summary').addEventListener('click', generateDailyFinancialSummary);
    document.getElementById('discount-usage-report').addEventListener('click', generateDiscountUsageReport);
    document.getElementById('export-sharing-options').addEventListener('click', generateExportSharingOptions);
    document.getElementById('real-time-reporting').addEventListener('click', generateRealTimeReporting);
    document.getElementById('visualizations').addEventListener('click', generateVisualizations);
}

function generateDailySalesSummary() {
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    const dailySales = salesData.reduce((acc, sale) => {
        const date = sale.date.split('T')[0];
        if (!acc[date]) {
            acc[date] = { total: 0, transactions: 0 };
        }
        acc[date].total += sale.total;
        acc[date].transactions += 1;
        return acc;
    }, {});

    let summaryHTML = '<h3>Daily Sales Summary</h3>';
    Object.keys(dailySales).forEach(date => {
        const sales = dailySales[date];
        summaryHTML += `
            <h4>${date}</h4>
            <p>Total Sales: $${sales.total.toFixed(2)}</p>
            <p>Number of Transactions: ${sales.transactions}</p>
            <p>Average Transaction Value: $${(sales.total / sales.transactions).toFixed(2)}</p>
        `;
    });

    document.getElementById('report-content').innerHTML += summaryHTML;
    console.log('Daily Sales Summary generated');
}

function generateSalesByCategory() {
    const menuCategories = JSON.parse(localStorage.getItem('menuCategories')) || [];
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];

    const salesByCategory = salesData.reduce((acc, sale) => {
        sale.items.forEach(item => {
            const category = menuCategories.find(cat => cat.subcategories.some(sub => sub.items.some(i => i.name === item.name)));
            const categoryName = category ? category.name : 'Unknown';
            if (!acc[categoryName]) {
                acc[categoryName] = { total: 0, quantity: 0 };
            }
            acc[categoryName].total += item.total;
            acc[categoryName].quantity += item.quantity;
        });
        return acc;
    }, {});

    let reportHTML = '<h3>Sales by Category</h3>';
    Object.keys(salesByCategory).forEach(category => {
        const sales = salesByCategory[category];
        reportHTML += `
            <h4>${category}</h4>
            <p>Total Sales: $${sales.total.toFixed(2)}</p>
            <p>Quantity Sold: ${sales.quantity}</p>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
    console.log('Sales by Category report generated');
}

// Continue with other report generation functions...
function generatePaymentMethodSummary() {
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    const paymentSummary = salesData.reduce((acc, sale) => {
        const method = sale.paymentMethod;
        if (!acc[method]) {
            acc[method] = { total: 0, count: 0 };
        }
        acc[method].total += sale.total;
        acc[method].count += 1;
        return acc;
    }, {});

    let reportHTML = '<h3>Payment Method Summary</h3>';
    Object.keys(paymentSummary).forEach(method => {
        const summary = paymentSummary[method];
        reportHTML += `
            <h4>${method}</h4>
            <p>Total Sales: $${summary.total.toFixed(2)}</p>
            <p>Number of Transactions: ${summary.count}</p>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
    console.log('Payment Method Summary report generated');
}

function generateVoidRefundActivity() {
    const voidRefundData = JSON.parse(localStorage.getItem('voidRefundData')) || [];
    let reportHTML = '<h3>Void and Refund Activity</h3>';
    voidRefundData.forEach(record => {
        reportHTML += `
            <p>Date: ${record.date}</p>
            <p>Item: ${record.itemName}</p>
            <p>Amount: $${record.amount}</p>
            <p>Reason: ${record.reason}</p>
            <hr>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
    console.log('Void and Refund Activity report generated');
}

function generateCustomerFrequencySpend() {
    const customerData = JSON.parse(localStorage.getItem('customerData')) || [];
    let reportHTML = '<h3>Customer Frequency and Spend</h3>';
    customerData.forEach(customer => {
        reportHTML += `
            <p>Customer: ${customer.name}</p>
            <p>Total Visits: ${customer.visits}</p>
            <p>Total Spend: $${customer.totalSpend.toFixed(2)}</p>
            <hr>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
    console.log('Customer Frequency and Spend report generated');
}

function generateLoyaltyProgramMetrics() {
    const loyaltyData = JSON.parse(localStorage.getItem('loyaltyData')) || [];
    let reportHTML = '<h3>Loyalty Program Metrics</h3>';
    loyaltyData.forEach(record => {
        reportHTML += `
            <div class="report-section">
                <p><strong>Customer:</strong> ${record.customerName}</p>
                <p><strong>Points Earned:</strong> ${record.pointsEarned}</p>
                <p><strong>Rewards Redeemed:</strong> ${record.rewardsRedeemed}</p>
                <hr>
            </div>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
    console.log('Loyalty Program Metrics report generated');
}

function generateDailyFinancialSummary() {
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    let totalSales = 0;
    let totalDiscounts = 0;
    salesData.forEach(sale => {
        totalSales += sale.total;
        totalDiscounts += sale.discount || 0;
    });

    let reportHTML = '<h3>Daily Financial Summary</h3>';
    reportHTML += `
        <div class="report-section">
            <p><strong>Total Sales:</strong> $${totalSales.toFixed(2)}</p>
            <p><strong>Total Discounts:</strong> $${totalDiscounts.toFixed(2)}</p>
            <p><strong>Net Sales:</strong> $${(totalSales - totalDiscounts).toFixed(2)}</p>
        </div>
    `;

    document.getElementById('report-content').innerHTML += reportHTML;
}

function generateDiscountUsageReport() {
    const discountData = JSON.parse(localStorage.getItem('discountData')) || [];
    let reportHTML = '<h3>Discount Usage Report</h3>';
    discountData.forEach(record => {
        reportHTML += `
            <div class="report-section">
                <p><strong>Date:</strong> ${record.date}</p>
                <p><strong>Discount:</strong> ${record.discountName}</p>
                <p><strong>Amount:</strong> $${record.amount}</p>
                <hr>
            </div>
        `;
    });

    document.getElementById('report-content').innerHTML += reportHTML;
}

function generateExportSharingOptions() {
    const reportContent = document.getElementById('report-content').innerHTML;
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert('Report exported successfully.');
}

function generateRealTimeReporting() {
    alert('Real-Time Reporting generated.');
}

function generateVisualizations() {
    const salesData = JSON.parse(localStorage.getItem('salesData')) || [];
    const canvas = document.createElement('canvas');
    canvas.id = 'salesChart';
    document.getElementById('report-content').appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const labels = salesData.map(sale => new Date(sale.date).toLocaleDateString());
    const data = salesData.map(sale => sale.total);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales Over Time',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
