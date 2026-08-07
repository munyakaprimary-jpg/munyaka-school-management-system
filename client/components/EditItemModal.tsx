"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Partial<InventoryItem>;
}

const EditItemModal = ({ isOpen, onClose, item }: EditItemModalProps) => {
  const [formData, setFormData] = useState({
    categoryId: item?.categoryId || 1,
    name: item?.name || "",
    image: item?.image || "placeholder.jpg",
    price: item?.price || 0.0,
    quantity: item?.quantity || 0, // New field
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    console.log("Submitted Data:", formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle/EditItemModal>
            Edit Item
          </DialogTitle>
          <DialogDescription>
            Make changes to the item here
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            value={formData.categoryId}
            onChange={handleChange}
            name="categoryId"
            type="number"
            placeholder="Category ID"
          />
          <Input
            value={formData.name}
            onChange={handleChange}
            name="name"
            placeholder="Item Name"
          />
          <Input
            value={formData.image}
            onChange={handleChange}
            name="image"
            placeholder="Image URL"
          />
          <Input
            value={formData.price.toString()}
            onChange={(e) => handleChange(e)}
            name="price"
            type="number"
            placeholder="Price"
          />
          <Input
            value={formData.quantity.toString()}
            onChange={(e) => handleChange(e)}
            name="quantity"
            type="number"
            placeholder="Quantity"
          /> {/* New input field */}
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemModal;