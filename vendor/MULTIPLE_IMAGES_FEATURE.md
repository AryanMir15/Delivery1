# Multiple Images Per Product - Feature Documentation

## 🎨 Overview

The vendor app now supports **multiple images per product** with a professional gallery interface, allowing vendors to showcase their products from different angles and with detailed views.

## ✨ Key Features

### 1. **Primary Image + Gallery**
- **Primary Image**: Main product image (required)
- **Additional Images**: Up to 5 additional images (optional)
- **Total**: 1 primary + 5 additional = 6 images per product

### 2. **Image Upload Interface**

#### Primary Image Section
- Large preview area (full width, 200px height)
- Dashed border indicating upload area
- Camera icon placeholder
- Upload progress indicator
- Tap to upload/change image

#### Additional Images Gallery
- Horizontal scrollable gallery
- 100x100px thumbnails
- Add button to upload more images
- Remove button (X) on each image
- Image counter (e.g., "3/5 images")
- Upload progress per image

### 3. **Product List Enhancements**

#### Image Badge
- Small badge on product card showing additional image count
- Example: "+3" badge indicates 3 additional images
- Camera icon with count
- Positioned at bottom-right of product image

#### Product Actions
- **Tap**: Show action menu (View Details, Edit, Toggle Stock)
- **Long Press**: Quick view product details
- **Stock Toggle**: Direct toggle without menu

### 4. **Product Detail Screen**

#### Image Gallery
- **Main Image Display**: Full-width image viewer
- **Image Counter**: Shows current position (e.g., "1/4")
- **Thumbnail Strip**: Horizontal scrollable thumbnails
- **Active Indicator**: Green border on selected thumbnail
- **Full-Screen View**: Tap main image to view full screen
- **Swipe Navigation**: Swipe through images

#### Full-Screen Image Viewer
- Modal overlay with black background
- Pinch to zoom (native behavior)
- Close button (top-right)
- Swipe to dismiss

### 5. **Image Management**

#### Upload Process
1. Tap upload area
2. Select image from gallery
3. Image converts to base64
4. Uploads to backend
5. URL returned and saved
6. Image displays immediately

#### Remove Process
1. Tap X button on thumbnail
2. Confirmation dialog
3. Image removed from array
4. Gallery updates

## 🎯 User Experience

### Adding Product with Images

```
1. Tap "Add Product" button
2. Upload primary image (required)
3. Fill product details
4. Scroll to "Additional Images"
5. Tap "Add Image" button (up to 5 times)
6. Select images from gallery
7. Images upload and display
8. Save product
```

### Editing Product Images

```
1. Open product from list
2. Tap to show action menu
3. Select "Edit Product"
4. Change primary image (tap main image)
5. Add more images (tap "Add Image")
6. Remove images (tap X on thumbnail)
7. Save changes
```

### Viewing Product Gallery

```
1. Open product from list
2. Select "View Details"
3. Main image displays
4. Tap thumbnails to switch images
5. Tap main image for full screen
6. Swipe to navigate
7. Tap X to close full screen
```

## 📱 UI Components

### Primary Image Upload
```
┌─────────────────────────────┐
│                             │
│     [Camera Icon]           │
│   Add Primary Photo         │
│                             │
└─────────────────────────────┘
```

### Gallery Section
```
Additional Images (Optional)          3/5 images

┌────┐ ┌────┐ ┌────┐ ┌────┐
│ X  │ │ X  │ │ X  │ │ +  │
│img1│ │img2│ │img3│ │Add │
└────┘ └────┘ └────┘ └────┘
```

### Product Card with Badge
```
┌────────────────────────────┐
│ ┌────┐                     │
│ │img │  Product Name       │
│ │ +3 │  Category           │
│ └────┘  ETB 100  [Stock]   │
└────────────────────────────┘
```

### Product Detail Gallery
```
┌─────────────────────────────┐
│                             │
│      Main Image             │
│                      1/4    │
└─────────────────────────────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐
│img1│ │img2│ │img3│ │img4│
└────┘ └────┘ └────┘ └────┘
```

## 🔧 Technical Implementation

### Data Structure

```javascript
{
  title: "Product Name",
  description: "Product description",
  image: "https://url-to-primary-image.jpg",  // Primary image
  images: [                                     // Additional images array
    "https://url-to-image-1.jpg",
    "https://url-to-image-2.jpg",
    "https://url-to-image-3.jpg"
  ],
  category: "category-id",
  variations: [...]
}
```

### State Management

```javascript
const [formData, setFormData] = useState({
  image: '',           // Primary image URL
  images: [],          // Array of additional image URLs
  // ... other fields
});
```

### Upload Function

```javascript
const handlePickImage = async (isPrimary = true, index = null) => {
  // Request permissions
  // Pick image from gallery
  // Convert to base64
  // Upload to backend
  // Update state (primary or gallery)
};
```

### Remove Function

```javascript
const handleRemoveImage = (index) => {
  // Show confirmation
  // Remove from array
  // Update state
};
```

## 📊 Image Specifications

### Recommended Sizes
- **Primary Image**: 800x800px (1:1 ratio)
- **Additional Images**: 800x800px (1:1 ratio)
- **Thumbnails**: Auto-generated (100x100px display)

### File Requirements
- **Format**: JPEG, PNG
- **Max Size**: 5MB per image
- **Quality**: 80% compression
- **Aspect Ratio**: 4:3 or 1:1 recommended

### Upload Limits
- **Primary**: 1 image (required)
- **Additional**: 5 images (optional)
- **Total**: 6 images maximum per product

## 🎨 Styling

### Colors
- **Primary**: #4CAF50 (Green)
- **Border Active**: #4CAF50
- **Border Inactive**: #ddd
- **Background**: #f0f0f0
- **Badge Background**: rgba(0,0,0,0.7)
- **Remove Button**: #F44336

### Dimensions
- **Primary Image**: Full width x 200px
- **Gallery Thumbnail**: 100x100px
- **Product Card Image**: 80x80px
- **Detail Main Image**: Full width x Full width (square)
- **Detail Thumbnail**: 70x70px

## 🚀 Features in Action

### Product Form Screen
- ✅ Primary image upload with preview
- ✅ Gallery section with horizontal scroll
- ✅ Add button for new images
- ✅ Remove button on each image
- ✅ Image counter display
- ✅ Upload progress indicators
- ✅ Helpful tips and hints

### Products List Screen
- ✅ Image count badge on cards
- ✅ Action menu on tap
- ✅ Quick view on long press
- ✅ Stock toggle button

### Product Detail Screen
- ✅ Full-width main image
- ✅ Image position counter
- ✅ Thumbnail navigation strip
- ✅ Active thumbnail indicator
- ✅ Full-screen image viewer
- ✅ Swipe to navigate
- ✅ Edit button

## 📝 Usage Examples

### Example 1: Restaurant Menu Item
```
Primary Image: Dish from top view
Additional Images:
  - Side angle view
  - Close-up of ingredients
  - Plated presentation
  - Size comparison
```

### Example 2: Fashion Product
```
Primary Image: Front view
Additional Images:
  - Back view
  - Side view
  - Detail of fabric/texture
  - Model wearing item
```

### Example 3: Electronics
```
Primary Image: Product front
Additional Images:
  - Back panel with ports
  - Side view
  - Accessories included
  - Size comparison
```

## ✅ Testing Checklist

### Upload Testing
- [ ] Upload primary image
- [ ] Upload additional images (1-5)
- [ ] Upload progress shows correctly
- [ ] Images display after upload
- [ ] Can upload different image formats (JPEG, PNG)

### Gallery Testing
- [ ] Scroll through thumbnails
- [ ] Tap thumbnail to change main image
- [ ] Image counter updates correctly
- [ ] Active thumbnail highlighted
- [ ] Add button appears when < 5 images

### Remove Testing
- [ ] Tap X button on thumbnail
- [ ] Confirmation dialog appears
- [ ] Image removed from gallery
- [ ] Counter updates
- [ ] Can remove all additional images

### Detail View Testing
- [ ] Main image displays correctly
- [ ] Thumbnails scroll horizontally
- [ ] Tap thumbnail switches main image
- [ ] Image counter shows correct position
- [ ] Full-screen view works
- [ ] Close button works

### Product List Testing
- [ ] Badge shows correct count
- [ ] Badge only shows when images exist
- [ ] Action menu works
- [ ] Long press opens detail view

## 🔄 Backend Integration

### GraphQL Mutation
```graphql
mutation CreateFood($input: FoodInput!) {
  createFood(
    title: $title
    image: $image          # Primary image URL
    images: $images        # Array of additional image URLs
    # ... other fields
  ) {
    id
    title
    image
    images
  }
}
```

### Upload Mutation
```graphql
mutation UploadImage($image: String!) {
  uploadImageToS3(image: $image) {
    imageUrl
  }
}
```

## 🎯 Benefits

### For Vendors
- ✅ Showcase products from multiple angles
- ✅ Increase customer confidence
- ✅ Reduce product returns
- ✅ Professional presentation
- ✅ Better product visibility

### For Customers
- ✅ See product details clearly
- ✅ Make informed decisions
- ✅ Understand product better
- ✅ Reduce uncertainty
- ✅ Better shopping experience

## 🚀 Future Enhancements

### Potential Features
- [ ] Drag to reorder images
- [ ] Bulk image upload
- [ ] Image cropping tool
- [ ] Image filters/effects
- [ ] Video support
- [ ] 360° product view
- [ ] AR product preview
- [ ] Image compression options
- [ ] Cloud storage integration
- [ ] Image optimization

## 📚 Related Documentation

- [Product Management Guide](./README.md#product-management)
- [Image Upload Guide](./README.md#image-upload)
- [Backend API Documentation](../README.md#graphql-api)

## 🆘 Troubleshooting

### Images not uploading
1. Check camera roll permissions
2. Verify image size (< 5MB)
3. Check network connection
4. Verify backend upload mutation

### Images not displaying
1. Check image URLs are valid
2. Verify network connection
3. Check image format (JPEG/PNG)
4. Clear app cache

### Gallery not scrolling
1. Check if images array has items
2. Verify ScrollView is not nested incorrectly
3. Check device performance

---

**Multiple Images Feature: Complete and Production Ready! 🎉**

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: ✅ Fully Implemented
