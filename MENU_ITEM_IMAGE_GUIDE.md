# Extending Image Upload to Menu Items

This guide shows how to add image upload functionality to menu items in the vendor dashboard.

## Step 1: Update Menu Item Management UI

Add the `ImageUpload` component to your menu item form/dialog:

```tsx
// In VendorDashboard.tsx - Menu Tab

// Add state for menu item form
const [menuItemForm, setMenuItemForm] = useState({
  name: '',
  description: '',
  price: 0,
  category: '',
  image: '' // Add image field
});

// In your menu item dialog/form
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Menu Item</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Existing fields */}
      <Input
        placeholder="Item Name"
        value={menuItemForm.name}
        onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
      />
      
      {/* Add Image Upload */}
      <ImageUpload
        currentImage={menuItemForm.image}
        onUploadSuccess={(imageUrl) => {
          setMenuItemForm({...menuItemForm, image: imageUrl});
          toast({ title: 'Success', description: 'Image uploaded' });
        }}
        uploadType="menu-item-image"
        entityId={menuItemId} // The ID of the menu item being edited
        label="Menu Item Image"
        aspectRatio="square"
      />
      
      {/* Other fields... */}
    </div>
  </DialogContent>
</Dialog>
```

## Step 2: Update Menu Item Creation Flow

When creating a new menu item, you'll need to:

1. First create the menu item in the database
2. Then allow image upload using the returned menu item ID

```tsx
const handleCreateMenuItem = async () => {
  // 1. Create menu item first
  const newMenuItem = {
    name: menuItemForm.name,
    description: menuItemForm.description,
    price: menuItemForm.price,
    category: menuItemForm.category,
    caterer_id: vendorCaterer?.id
  };
  
  const response = await addMenuItem(newMenuItem);
  
  if (response.success) {
    const menuItemId = response.data.id;
    
    // 2. Now you can upload image for this menu item
    // The ImageUpload component will handle this
    toast({ 
      title: 'Success', 
      description: 'Menu item created. You can now upload an image.' 
    });
  }
};
```

## Step 3: Display Menu Items with Images

Update your menu item display to show uploaded images:

```tsx
// In the menu items list
{menuItems.map((item) => (
  <Card key={item.id}>
    <CardContent className="p-4">
      <div className="flex gap-4">
        {/* Display menu item image */}
        {item.image ? (
          <img
            src={`http://localhost:3000${item.image}`}
            alt={item.name}
            className="h-20 w-20 rounded-lg object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
            <Utensils className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1">
          <h4 className="font-semibold">{item.name}</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <p className="text-sm font-medium text-primary">${item.price}</p>
        </div>
        
        {/* Edit button to change image */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openEditDialog(item)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
))}
```

## Step 4: Add Image Upload to Edit Flow

When editing a menu item:

```tsx
const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

const openEditDialog = (item: any) => {
  setEditingMenuItem(item);
  setIsEditDialogOpen(true);
};

// In the edit dialog
<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Menu Item</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Image Upload for existing menu item */}
      <ImageUpload
        currentImage={editingMenuItem?.image}
        onUploadSuccess={(imageUrl) => {
          // Update the menu item with new image
          setEditingMenuItem({...editingMenuItem, image: imageUrl});
          toast({ title: 'Success', description: 'Image updated' });
          refresh(); // Refresh menu items list
        }}
        uploadType="menu-item-image"
        entityId={editingMenuItem?.id}
        label="Menu Item Image"
        aspectRatio="square"
      />
      
      {/* Other editable fields... */}
    </div>
  </DialogContent>
</Dialog>
```

## Step 5: Update Backend Menu Item Controller

Ensure your menu item creation includes the image field:

```typescript
// In backend/src/controllers/vendorController.ts

export const addMenuItem = async (req: Request, res: Response) => {
  const { caterer_id, name, description, price, category, image } = req.body;
  
  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO menu_items (id, caterer_id, name, description, price, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, caterer_id, name, description, price, category, image || null]
    );
    
    res.json({ 
      success: true, 
      message: 'Menu item added',
      data: { id }
    });
  } catch (error) {
    console.error('[VENDOR] Add menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

## Complete Example: Menu Item with Image Upload

Here's a complete example of a menu item management component:

```tsx
function MenuItemManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: ''
  });
  const [tempMenuItemId, setTempMenuItemId] = useState<string | null>(null);
  
  const handleCreateMenuItem = async () => {
    // Step 1: Create menu item without image
    const response = await fetch('/api/vendor/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newItem,
        caterer_id: vendorCaterer?.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setTempMenuItemId(data.data.id);
      toast({ 
        title: 'Menu item created',
        description: 'Now upload an image for this item'
      });
    }
  };
  
  return (
    <div>
      <Button onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Menu Item
      </Button>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Item Name"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
            
            <Textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
            />
            
            <Input
              type="number"
              placeholder="Price"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
            />
            
            <Input
              placeholder="Category"
              value={newItem.category}
              onChange={(e) => setNewItem({...newItem, category: e.target.value})}
            />
            
            {!tempMenuItemId ? (
              <Button onClick={handleCreateMenuItem}>
                Create Menu Item
              </Button>
            ) : (
              <ImageUpload
                currentImage={newItem.image}
                onUploadSuccess={(imageUrl) => {
                  setNewItem({...newItem, image: imageUrl});
                  toast({ title: 'Image uploaded successfully' });
                  setIsAddDialogOpen(false);
                  refresh(); // Refresh menu items
                }}
                uploadType="menu-item-image"
                entityId={tempMenuItemId}
                label="Menu Item Image"
                aspectRatio="square"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Display menu items */}
      <div className="grid gap-4 mt-6">
        {menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

## Tips for Menu Item Images

1. **Aspect Ratio**: Use `aspectRatio="square"` for menu items for consistency
2. **Image Size**: Recommend vendors use high-quality images (at least 800x800px)
3. **Placeholder**: Show a placeholder icon when no image is uploaded
4. **Optimization**: Consider adding image compression in the future
5. **Gallery**: You could extend this to support multiple images per menu item

## Testing Checklist

- [ ] Create new menu item
- [ ] Upload image for new menu item
- [ ] Edit existing menu item
- [ ] Change image for existing menu item
- [ ] Delete menu item (ensure image is also deleted)
- [ ] View menu items on customer-facing pages
- [ ] Test with different image formats (JPG, PNG, WebP)
- [ ] Test file size validation (try uploading >5MB)
- [ ] Test error handling (network errors, invalid files)
