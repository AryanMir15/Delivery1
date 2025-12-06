import { gql } from '@apollo/client';

// User queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      phone
      role
      profileImage
      isActive
      phoneIsVerified
      emailIsVerified
    }
  }
`;

// Category queries
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      title
      description
      image
      isActive
    }
  }
`;

// Restaurant queries (original - keep for backwards compatibility)
export const GET_RESTAURANTS = gql`
  query GetRestaurants {
    restaurants {
      id
      name
      slug
      image
      logo
      address
      location {
        coordinates
      }
      phone
      email
      shopType
      cuisines
      minimumOrder
      deliveryTime
      tax
      rating
      reviewCount
      isActive
      isAvailable
    }
  }
`;

export const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      slug
      image
      logo
      address
      location {
        coordinates
      }
      phone
      email
      shopType
      cuisines
      minimumOrder
      deliveryTime
      tax
      rating
      reviewCount
      isActive
      isAvailable
      owner {
        id
        name
        email
      }
    }
  }
`;

// Shop queries (new - for future use)
export const GET_SHOPS = gql`
  query GetShops {
    shops {
      id
      name
      slug
      image
      logo
      address
      location {
        coordinates
      }
      phone
      email
      shopType
      cuisines
      minimumOrder
      deliveryTime
      tax
      rating
      reviewCount
      isActive
      isAvailable
    }
  }
`;

export const GET_SHOP = gql`
  query GetShop($id: ID!) {
    shop(id: $id) {
      id
      name
      slug
      image
      logo
      address
      location {
        coordinates
      }
      phone
      email
      shopType
      cuisines
      minimumOrder
      deliveryTime
      tax
      rating
      reviewCount
      isActive
      isAvailable
      owner {
        id
        name
        email
      }
    }
  }
`;

export const GET_NEARBY_SHOPS = gql`
  query GetNearbyShops($latitude: Float, $longitude: Float) {
    nearByShopsPreview(latitude: $latitude, longitude: $longitude) {
      id
      name
      image
      address
      rating
      reviewCount
      deliveryTime
      minimumOrder
      shopType
    }
  }
`;

export const GET_NEARBY_TYPES = gql`
  query GetNearbyTypes($latitude: Float, $longitude: Float, $shopType: String) {
    nearByShopTypes(latitude: $latitude, longitude: $longitude, shopType: $shopType) {
      id
      name
      description
      image
      shopType
    }
  }
`;

// Food queries (original - keep for backwards compatibility)
export const GET_FOODS = gql`
  query GetFoods($restaurant: ID) {
    foods(restaurant: $restaurant) {
      id
      title
      description
      image
      category {
        id
        title
      }
      restaurant {
        id
        name
        image
        shopType
      }
      variations {
        id
        title
        price
        discounted
        isOutOfStock
        isActive
      }
      attributes {
        expiryDate
        weight
        brand
        organic
        inStock
        freeShipping
        warranty
        requiresPrescription
      }
      metadata
      additionalInfo
      isOutOfStock
      isActive
    }
  }
`;

export const GET_FOOD = gql`
  query GetFood($id: ID!) {
    food(id: $id) {
      id
      title
      description
      image
      category {
        id
        title
      }
      restaurant {
        id
        name
        image
        address
        rating
        reviewCount
        shopType
      }
      variations {
        id
        title
        price
        discounted
        isOutOfStock
        isActive
        addons {
          id
          title
          description
          quantityMinimum
          quantityMaximum
          options {
            id
            title
            description
            price
            isOutOfStock
          }
        }
      }
      attributes {
        expiryDate
        weight
        brand
        origin
        storageInstructions
        organic
        nutritionInfo
        dosage
        manufacturer
        sideEffects
        usageInstructions
        requiresPrescription
        activeIngredients
        warranty
        specifications
        model
        compatibility
        batteryLife
        dimensions
        sizes
        colors
        material
        careInstructions
        gender
        season
        assemblyRequired
        style
        occasion
        freshness
        deliveryTime
        harvestDate
        ingredients
        caffeineContent
        servingTemperature
        skinType
        quantity
        petType
        ageGroup
        vehicleCompatibility
        qualifications
        availability
        duration
        calories
        spiceLevel
        preparationTime
        allergens
        freeShipping
        inStock
      }
      metadata
      additionalInfo
      isOutOfStock
      isActive
    }
  }
`;

// Product queries (new - for future use)
export const GET_PRODUCTS = gql`
  query GetProducts($shop: ID) {
    products(shop: $shop) {
      id
      title
      description
      image
      category {
        id
        title
      }
      restaurant {
        id
        name
        image
      }
      variations {
        id
        title
        price
        discounted
        isOutOfStock
        isActive
      }
      isOutOfStock
      isActive
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      image
      category {
        id
        title
      }
      restaurant {
        id
        name
        image
        address
        rating
        reviewCount
      }
      variations {
        id
        title
        price
        discounted
        isOutOfStock
        isActive
        addons {
          id
          title
          description
          quantityMinimum
          quantityMaximum
          options {
            id
            title
            description
            price
            isOutOfStock
          }
        }
      }
      isOutOfStock
      isActive
    }
  }
`;

// Order queries
export const GET_ORDERS_BY_USER = gql`
  query GetOrdersByUser {
    ordersByUser {
      id
      orderId
      restaurant {
        id
        name
        image
        address
      }
      rider {
        id
        name
        phone
      }
      items {
        id
        title
        quantity
        image
      }
      orderAmount
      deliveryCharges
      taxationAmount
      tipping
      orderStatus
      orderDate
      createdAt
      expectedTime
      acceptedAt
      pickedAt
      deliveredAt
      deliveryAddress {
        deliveryAddress
        details
        label
      }
      paymentMethod
      paymentStatus
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderId
      restaurant {
        id
        name
        image
        address
        phone
      }
      rider {
        id
        name
        phone
      }
      items {
        id
        title
        image
        food {
          id
          title
          image
        }
        quantity
        variation {
          title
          price
        }
        addons {
          title
          options {
            title
            price
          }
        }
        specialInstructions
      }
      orderAmount
      deliveryCharges
      taxationAmount
      tipping
      orderStatus
      orderDate
      createdAt
      expectedTime
      acceptedAt
      pickedAt
      deliveredAt
      cancelledAt
      deliveryAddress {
        deliveryAddress
        details
        label
        location {
          coordinates
        }
      }
      paymentMethod
      paymentStatus
      instructions
      reason
    }
  }
`;

// Review queries
export const GET_REVIEWS = gql`
  query GetReviews($shop: ID!, $page: Int, $limit: Int, $rating: Int) {
    reviews(shop: $shop, page: $page, limit: $limit, rating: $rating) {
      id
      user {
        id
        name
        profileImage
      }
      restaurant {
        id
        name
      }
      order {
        id
        orderId
        orderDate
      }
      rating
      review
      images
      productRating
      deliveryRating
      serviceRating
      isVerified
      isActive
      createdAt
    }
  }
`;

// Coupon queries
export const GET_AVAILABLE_COUPONS = gql`
  query GetAvailableCoupons($shopId: ID, $orderAmount: Float) {
    availableCoupons(shopId: $shopId, orderAmount: $orderAmount) {
      id
      code
      description
      discountType
      discountValue
      minimumAmount
      maximumDiscountAmount
      validFrom
      validUntil
      isActive
      isValid
      discountAmount
    }
  }
`;

// Configuration query
export const GET_CONFIGURATION = gql`
  query GetConfiguration {
    configuration {
      id
      currency
      currencySymbol
      deliveryRate
      twilioEnabled
      skipWhatsAppOTP
      isPaidVersion
      skipEmailVerification
      skipMobileVerification
      costType
    }
  }
`;