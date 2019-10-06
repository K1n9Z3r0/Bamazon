var Table = require('cli-table');
var mysql = require('mysql');
var inquirer = require('inquirer');


var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "bamazon_db"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected!");
    startPrompt();
});


function startPrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Would you like to view our inventory?",
        default: true
    }])

    .then(function(user) {
        if (user.confirm === true) {
            inventory();
        } else {
            console.log("Nice try but, There is no escape! Now buy something...");
            startPrompt();
        }
    });
}


function inventory() {

    var table = new Table({
        head: ['ID#', 'Item Name', 'Department', 'Price', 'Stock Quantity']
    });

    listInventory();

    function listInventory() {

        connection.query("SELECT * FROM products", function(err, res) {
            for (var i = 0; i < res.length; i++) {

                var itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

                table.push(
                    [itemId, productName, departmentName, price, stockQuantity]


                );
            }
            console.log(table.toString());
            continuePrompt();
        });
    }
}

function continuePrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "continue",
        message: "Would you like to purchase an item?",
        default: true

    }]).then(function(user) {
        if (user.continue === true) {
            selectionPrompt();
        } else {
            console.log("Not buying? Lets try this again...");
            startPrompt();
        }
    });
}


function selectionPrompt() {

    inquirer.prompt([{

            type: "input",
            name: "inputId",
            message: "Please enter the ID number of the item you would like to purchase.",
        },
        {
            type: "input",
            name: "inputNumber",
            message: "How many units of this item would you like?",

        }
    ]).then(function(userPurchase) {


        connection.query("SELECT * FROM products WHERE item_id=?", userPurchase.inputId, function(err, res) {
            for (var i = 0; i < res.length; i++) {

                if (userPurchase.inputNumber > res[i].stock_quantity) {

                    console.log("Insufficient quantity!");
                    startPrompt();

                } else {
                    console.log("You've selected:");
                    console.log("Item: " + res[i].product_name);
                    console.log("Department: " + res[i].department_name);
                    console.log("Price: " + res[i].price);
                    console.log("Quantity: " + userPurchase.inputNumber);
                    console.log("----------------");
                    console.log("Total Price: " + res[i].price * userPurchase.inputNumber);
                    console.log("===================================");

                    var newStock = (res[i].stock_quantity - userPurchase.inputNumber);
                    var purchaseId = (userPurchase.inputId);
                    confirmPrompt(newStock, purchaseId);
                }
            }
        });
    });
}


function confirmPrompt(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirmPurchase",
        message: "Comfirm Purchase?",
        default: true

    }]).then(function(userConfirm) {
        if (userConfirm.confirmPurchase === true) {


            connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: newStock
            }, {
                item_id: purchaseId
            }], function(err, res) {});

            console.log("Thanks for buying! Now go buy more!.");
            startPrompt();
        } else {

            console.log("Changed your mind? Choose something else!");
            startPrompt();
        }
    });
}