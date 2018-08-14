const Menu = require('./Menu');
const Restaurant = require('./Restaurant');

class ShoppingCart {
	constructor() {
		this.cart = []; // this.cart = [{menu, qty}]
	}
	serialize() {
		let serial = [];
		for (const item of this.cart) {
			serial.push({menu: item.menu, qty: item.qty});
		}
		return serial;
	}
	static deserialize(serial) {
		let sc = new ShoppingCart();
		for (const item of serial) {
			sc.deserial_additem(item);
		}
		return sc;
	}
	deserial_additem(item) {	// {menu, qty}
		this.cart.push(
			{menu: new Menu(item.menu), qty: item.qty}
		);
	}
	add(menu) {
		for (const item of this.cart) {
			console.log("(item.menu._id = " + item.menu._id);
			console.log("(menu._id = " + menu._id);
			if (item.menu.id == menu.id) {
				item.qty++;
				return;
			}
		}
		this.cart.push({menu: menu, qty: 1});
	}
	get subtotalPrice() {
		var subtotal = 0;
		
		for (const item of this.cart) {
			console.log("item.menu.price = " + item.menu.price);
			subtotal += item.menu.price * item.qty;
		}
		return subtotal;
	}
	get tax() {
		var tax = 0;
		var subtotal = 0;
		for (const item of this.cart) {
			subtotal += item.menu.price * item.qty;
		}
		return tax = subtotal * 0.08;
	}
	get totalPrice() {
		var subtotal = 0;
		var tax = 0;
		var total = 0;
		for (const item of this.cart) {
			subtotal += item.menu.price * item.qty;
		}
		tax = subtotal * 0.08;
		return total = subtotal + tax;
	}
}

module.exports = ShoppingCart;