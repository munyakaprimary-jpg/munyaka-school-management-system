export default class InventoryItem {
    id?: number;
    categoryId: number;
    name: string;
    image: string;
    price: number;
    quantity: number; // New field

    constructor(item: Partial<InventoryItem>) {
        Object.assign(this, item);
    }
}