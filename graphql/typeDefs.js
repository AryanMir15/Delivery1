const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    _id: ID!
    name: String!
    email: String!
    phone: String
    role: String!
    roles: [String]
    profileImage: String
    isActive: Boolean!
    addresses: [Address]
    restaurants: [Restaurant]
    vehicleType: String
    licenseNumber: String
    vehicleNumber: String
    available: Boolean
    currentLocation: Location
    heading: Float
    notificationToken: String
    timeZone: String
    phoneIsVerified: Boolean
    emailIsVerified: Boolean
    isOrderNotification: Boolean
    isOfferNotification: Boolean
    favourite: [String]
    createdAt: String
    updatedAt: String
    reviews: [Review]
  }

  type Location {
    type: String
    coordinates: [Float]
  }

  type Address {
    id: ID!
    _id: ID!
    label: String
    deliveryAddress: String
    details: String
    location: Location
    selected: Boolean
  }

  type Restaurant {
    id: ID!
    _id: ID!
    name: String!
    slug: String
    image: String
    logo: String
    address: String
    location: Location
    phone: String
    email: String
    owner: User
    zone: Zone
    shopType: String
    category: String
    cuisines: [String]
    openingTimes: [OpeningTime]
    minimumOrder: Float
    deliveryTime: Int
    tax: Float
    commissionRate: Float
    isActive: Boolean
    isAvailable: Boolean
    stripeDetailsSubmitted: Boolean
    rating: Float
    reviewCount: Int
    categories: [Category]
    deliveryBounds: Polygon
    createdAt: String
    updatedAt: String
    reviews: [Review]
    averageRating: Float
    totalReviews: Int
  }

  type Review {
    id: ID!
    _id: ID!
    user: User!
    restaurant: Restaurant!
    order: Order!
    rating: Int!
    review: String
    images: [String]
    foodRating: Int
    deliveryRating: Int
    serviceRating: Int
    isVerified: Boolean!
    isActive: Boolean!
    helpful: ReviewHelpful
    reply: ReviewReply
    createdAt: String
    updatedAt: String
  }

  type ReviewHelpful {
    count: Int!
    hasUserVoted: Boolean
  }

  type ReviewReply {
    message: String
    date: String
    repliedBy: User
  }

  type Coupon {
    id: ID!
    _id: ID!
    code: String!
    description: String
    discountType: String!
    discountValue: Float!
    minimumAmount: Float
    maximumDiscountAmount: Float
    usageLimit: Int!
    usedCount: Int!
    userUsageLimit: Int!
    applicableRestaurants: [Restaurant]
    applicableCategories: [Category]
    applicableFoods: [Food]
    validFrom: String!
    validUntil: String!
    isActive: Boolean!
    isFirstTimeUser: Boolean!
    daysOfWeek: [Int!]
    startTime: String
    endTime: String
    createdBy: User!
    usageHistory: [CouponUsage]
    isValid: Boolean!
    discountAmount: Float!
    createdAt: String
    updatedAt: String
  }

  type CouponUsage {
    user: User!
    order: Order
    usedAt: String!
    discountAmount: Float!
    orderAmount: Float!
  }

  type OpeningTime {
    day: String
    times: [TimeSlot]
  }

  type TimeSlot {
    startTime: String
    endTime: String
  }

  type Zone {
    id: ID!
    title: String!
    description: String
    location: Location
    boundaries: Polygon
    tax: Float
    deliveryCharges: Float
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  type Polygon {
    type: String
    coordinates: [[[Float]]]
  }

  type Category {
    id: ID!
    _id: ID!
    title: String!
    description: String
    image: String
    businessType: String
    icon: String
    color: String
    requiresPrescription: Boolean
    allowsBulkOrders: Boolean
    serviceType: String
    sortOrder: Int
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  type AddonOption {
    id: ID!
    title: String!
    description: String
    price: Float!
    isOutOfStock: Boolean!
  }

  type Addon {
    id: ID!
    title: String!
    description: String
    quantityMinimum: Int!
    quantityMaximum: Int!
    options: [AddonOption!]!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Variation {
    id: ID!
    title: String!
    price: Float!
    discounted: Float!
    addons: [Addon!]!
    isOutOfStock: Boolean!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type ProductAttributes {
    # Grocery
    expiryDate: String
    weight: String
    brand: String
    origin: String
    storageInstructions: String
    organic: Boolean
    nutritionInfo: JSON
    
    # Pharmacy
    dosage: String
    manufacturer: String
    sideEffects: String
    usageInstructions: String
    requiresPrescription: Boolean
    activeIngredients: [String]
    
    # Electronics
    warranty: String
    specifications: JSON
    model: String
    compatibility: String
    batteryLife: String
    dimensions: String
    
    # Fashion
    sizes: [String]
    colors: [String]
    material: String
    careInstructions: String
    gender: String
    season: String
    
    # Furniture
    assemblyRequired: Boolean
    style: String
    
    # Flowers
    occasion: String
    freshness: String
    deliveryTime: String
    
    # Agriculture
    harvestDate: String
    
    # Beverages
    ingredients: [String]
    caffeineContent: String
    servingTemperature: String
    
    # Beauty
    skinType: String
    
    # Stationery
    quantity: String
    
    # Pet Supplies
    petType: String
    ageGroup: String
    
    # Automotive
    vehicleCompatibility: String
    
    # Medical Services
    qualifications: String
    availability: String
    duration: String
    
    # Food/Restaurant
    calories: String
    spiceLevel: String
    preparationTime: String
    allergens: [String]
    
    # General
    freeShipping: Boolean
    inStock: Boolean
  }

  type Food {
    id: ID!
    title: String!
    description: String
    image: String
    category: Category!
    restaurant: Restaurant!
    variations: [Variation!]!
    subCategory: String
    isOutOfStock: Boolean!
    isActive: Boolean!
    attributes: ProductAttributes
    metadata: JSON
    additionalInfo: JSON
    createdAt: String!
    updatedAt: String!
  }

  scalar JSON

  type OrderItem {
    id: ID!
    food: Food
    title: String!
    description: String
    image: String
    quantity: Int!
    variation: Variation
    addons: [Addon!]!
    specialInstructions: String
    isActive: Boolean!
  }

  type OrderAddress {
    deliveryAddress: String!
    location: Location!
    details: String
    label: String
  }

  type Order {
    _id: ID!
    id: ID!
    orderId: String!
    user: User!
    restaurant: Restaurant!
    rider: User
    items: [OrderItem!]!
    deliveryAddress: OrderAddress!
    paymentMethod: String!
    paymentStatus: String!
    paymentTransactionId: String
    paymentReference: String
    paymentMetadata: JSON
    orderStatus: String!
    orderAmount: Float!
    paidAmount: Float!
    deliveryCharges: Float!
    tipping: Float!
    taxationAmount: Float!
    orderDate: String!
    expectedTime: String
    preparationTime: Int
    completionTime: String
    acceptedAt: String
    pickedAt: String
    deliveredAt: String
    cancelledAt: String
    assignedAt: String
    instructions: String
    reason: String
    review: String
    orderType: String
    isPickedUp: Boolean!
    isRiderRinged: Boolean!
    isRinged: Boolean!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type PaymentInitResponse {
    success: Boolean!
    checkoutUrl: String
    txRef: String
    error: String
    orderId: String
  }

  type PaymentVerificationResponse {
    success: Boolean!
    status: String
    amount: Float
    currency: String
    txRef: String
    order: Order
    error: String
  }

  type AuthPayload {
    userId: ID!
    token: String!
    tokenExpiration: String
    name: String!
    phone: String
    phoneIsVerified: Boolean
    email: String!
    emailIsVerified: Boolean
    picture: String
    addresses: [Address]
    isNewUser: Boolean
    userTypeId: String
    isActive: Boolean
    roles: [String]
  }

  type RestaurantBasic {
    _id: ID!
    orderId: String
    name: String!
    image: String
    address: String
  }

  type OwnerLoginPayload {
    userId: ID!
    token: String!
    email: String!
    userType: String!
    restaurants: [RestaurantBasic]
    permissions: [String]
    userTypeId: String!
    image: String
    name: String!
  }

  type UserExistPayload {
    userType: String
    _id: ID
  }

  type OtpResponse {
    result: Boolean!
  }

  type Cuisine {
    _id: ID!
    name: String!
    description: String
    image: String
    shopType: String!
  }

  type Configuration {
    _id: ID!
    email: String
    emailName: String
    password: String
    enableEmail: Boolean
    clientId: String
    clientSecret: String
    sandbox: Boolean
    publishableKey: String
    secretKey: String
    currency: String
    currencySymbol: String
    deliveryRate: Float
    twilioAccountSid: String
    twilioAuthToken: String
    twilioPhoneNumber: String
    twilioWhatsAppNumber: String
    twilioEnabled: Boolean
    skipWhatsAppOTP: Boolean
    formEmail: String
    sendGridApiKey: String
    sendGridEnabled: Boolean
    sendGridEmail: String
    sendGridEmailName: String
    sendGridPassword: String
    dashboardSentryUrl: String
    webSentryUrl: String
    apiSentryUrl: String
    customerAppSentryUrl: String
    restaurantAppSentryUrl: String
    riderAppSentryUrl: String
    googleApiKey: String
    cloudinaryUploadUrl: String
    cloudinaryApiKey: String
    webAmplitudeApiKey: String
    appAmplitudeApiKey: String
    webClientID: String
    androidClientID: String
    iOSClientID: String
    expoClientID: String
    googleMapLibraries: String
    googleColor: String
    termsAndConditions: String
    privacyPolicy: String
    testOtp: String
    firebaseKey: String
    authDomain: String
    projectId: String
    storageBucket: String
    msgSenderId: String
    appId: String
    measurementId: String
    isPaidVersion: Boolean
    skipEmailVerification: Boolean
    skipMobileVerification: Boolean
    costType: String
    vapidKey: String
  }

  type VendorListItem {
    _id: ID!
    unique_id: String!
    email: String!
    userType: String!
    isActive: Boolean
    name: String
    image: String
    restaurants: [Restaurant!]!
  }

  type WebNotification {
    _id: ID!
    title: String!
    body: String!
    navigateTo: String
    read: Boolean
    createdAt: String!
  }

  type ReviewStats {
    averageRating: Float!
    totalReviews: Int!
    ratingDistribution: [RatingCount!]!
  }

  type RatingCount {
    rating: Int!
    count: Int!
  }

  type Query {
    me: User
    profile: User
    users: [User!]!
    user(id: ID!): User

    # Category queries
    categories: [Category!]!
    category(id: ID!): Category

    # Restaurant queries
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    restaurantsByOwner: [Restaurant!]!
    nearByRestaurantsPreview(latitude: Float, longitude: Float): [Restaurant!]!
    nearByRestaurantsCuisines(latitude: Float, longitude: Float, shopType: String): [Cuisine!]!
    mostOrderedRestaurantsPreview(latitude: Float, longitude: Float, page: Int, limit: Int, shopType: String): [Restaurant!]!
    
    # Admin-specific Restaurant queries
    getClonedRestaurants: [Restaurant!]!
    restaurantsPaginated(page: Int, limit: Int, search: String): RestaurantPaginationResponse!
    getClonedRestaurantsPaginated(page: Int, limit: Int, search: String): RestaurantPaginationResponse!
    restaurantByOwner(id: String): VendorRestaurantResponse
    getRestaurantDeliveryZoneInfo(id: ID!): RestaurantZoneInfo
    restaurantProfile(id: String): Restaurant

    # Food queries
    foods(restaurant: ID): [Food!]!
    food(id: ID!): Food

    # Addon queries
    addons: [Addon!]!
    addon(id: ID!): Addon

    # Order queries
    orders(offset: Int, limit: Int): [Order!]!
    order(id: ID!): Order
    ordersByUser: [Order!]!
    pendingOrders: [Order!]!
    availableOrdersForRider: [Order!]!
    ordersByRestaurant(restaurant: ID!): [Order!]!
    ordersByRider: [Order!]!
    
    # Admin-specific Order queries
    getActiveOrders(restaurantId: ID, page: Int, rowsPerPage: Int, actions: [String], search: String): OrderPaginationResponse!
    ordersByRestId(restaurant: String!, page: Int, rows: Int, search: String): [Order!]!
    ordersByRestIdWithoutPagination(restaurant: String!, search: String): [Order!]!
    allOrders(page: Int): [Order!]!
    allOrdersWithoutPagination(dateKeyword: String, starting_date: String, ending_date: String): [Order!]!

    # Review queries
    reviews(restaurant: ID!, page: Int, limit: Int, rating: Int): [Review!]!
    review(id: ID!): Review
    reviewsByUser: [Review!]!
    restaurantReviewStats(restaurant: ID!): ReviewStats!
    canUserReviewOrder(orderId: ID!): Boolean!

    # Coupon queries
    coupons(page: Int, limit: Int, search: String): [Coupon!]!
    coupon(id: ID, code: String): Coupon
    validateCoupon(code: String!, orderAmount: Float!, restaurantId: ID!): Coupon!
    couponsByCreator: [Coupon!]!
    availableCoupons(restaurantId: ID, orderAmount: Float): [Coupon!]!

    # Zone queries
    zones: [Zone!]!

    # Configuration
    configuration: Configuration

    # User favourite
    userFavourite(latitude: Float, longitude: Float): [Restaurant!]!
    userFavorites: [Food!]!

    # Vendors
    vendors: [VendorListItem!]!

    # Web Notifications
    webNotifications: [WebNotification!]!
  }

  input VendorInput {
    _id: ID
    name: String
    email: String
    password: String
    image: String
    firstName: String
    lastName: String
    phoneNumber: String
  }

  type VendorType {
    _id: ID!
    unique_id: String
    email: String!
    password: String
    plainPassword: String
    name: String
    image: String
    firstName: String
    lastName: String
    phoneNumber: String
    userType: String
    isActive: Boolean
    restaurants: [Restaurant]
  }

  type UploadResponse {
    imageUrl: String!
  }

  # Admin response types
  type RestaurantPaginationResponse {
    data: [Restaurant!]!
    totalCount: Int!
    currentPage: Int!
    totalPages: Int!
  }

  type OrderPaginationResponse {
    totalCount: Int!
    orders: [Order!]!
  }

  type VendorRestaurantResponse {
    _id: ID!
    email: String!
    userType: String!
    restaurants: [Restaurant!]!
  }

  type RestaurantZoneInfo {
    boundType: String!
    deliveryBounds: Polygon
    location: Location
    circleBounds: CircleBounds
    address: String
    city: String
    postCode: String
  }

  type CircleBounds {
    radius: Float!
  }

  type UpdateResult {
    success: Boolean!
    message: String!
    data: Restaurant
  }

  type Mutation {
    register(
      name: String!
      email: String!
      phone: String
      password: String!
      role: String
      vehicleType: String
      licenseNumber: String
      vehicleNumber: String
    ): AuthPayload!

    registerAsRider(
      vehicleType: String!
      licenseNumber: String!
      vehicleNumber: String!
    ): User!

    registerAsVendor(
      shopName: String!
      shopType: String!
      address: String!
      phone: String
    ): Restaurant!

    login(
      email: String!
      password: String!
      type: String
      name: String
      notificationToken: String
      isActive: Boolean
    ): AuthPayload!

    ownerLogin(
      email: String!
      password: String!
    ): OwnerLoginPayload!

    emailExist(email: String!): UserExistPayload

    phoneExist(phone: String!): UserExistPayload

    sendOtpToEmail(email: String!): OtpResponse!

    sendOtpToPhoneNumber(phone: String!): OtpResponse!

    verifyOtp(otp: String!, email: String, phone: String): OtpResponse!

    createUser(
      userInput: UserInput!
    ): AuthPayload!

    updateUser(
      id: ID!
      userInput: UserInput
    ): User!

    # Vendor mutations
    createVendor(vendorInput: VendorInput!): VendorType!
    editVendor(vendorInput: VendorInput!): VendorType!
    deleteVendor(id: String!): Boolean!
    getVendor(id: ID!): VendorType

    # Upload mutation
    uploadImageToS3(image: String!): UploadResponse!

    # Category mutations
    createCategory(
      title: String!
      description: String
      image: String
    ): Category!

    updateCategory(
      id: ID!
      title: String
      description: String
      image: String
      isActive: Boolean
    ): Category!

    deleteCategory(id: ID!): Boolean!

    # Restaurant mutations
    createRestaurant(restaurant: RestaurantInput!, owner: ID!): Restaurant!

    updateRestaurant(
      id: ID!
      name: String
      address: String
      location: [Float!]
      phone: String
      email: String
      shopType: String
      cuisines: [String!]
      openingTimes: [OpeningTimeInput!]
      minimumOrder: Float
      deliveryTime: Int
      tax: Float
      isActive: Boolean
      isAvailable: Boolean
    ): Restaurant!

    # Admin-specific restaurant mutations
    deleteRestaurant(id: String!): UpdateResult!
    hardDeleteRestaurant(id: String!): Boolean!
    editRestaurant(restaurant: RestaurantProfileInput!): Restaurant!
    duplicateRestaurant(id: String!, owner: String!): Restaurant!
    updateFoodOutOfStock(id: String!, restaurant: String!, categoryId: String!): Boolean!
    updateRestaurantDelivery(
      id: ID!
      minDeliveryFee: Float
      deliveryDistance: Float
      deliveryFee: Float
    ): UpdateResult!
    updateRestaurantBussinessDetails(
      id: String!
      bussinessDetails: BussinessDetailsInput
    ): UpdateResult!
    updateDeliveryBoundsAndLocation(
      id: ID!
      boundType: String!
      bounds: [[[Float!]]]
      circleBounds: CircleBoundsInput
      location: [Float!]!
      address: String
      postCode: String
      city: String
    ): UpdateResult!

    # Food mutations
    createFood(
      title: String!
      description: String
      image: String
      category: ID!
      restaurant: ID!
      variations: [VariationInput!]
      subCategory: String
    ): Food!

    updateFood(
      id: ID!
      title: String
      description: String
      image: String
      category: ID
      variations: [VariationInput!]
      subCategory: String
      isOutOfStock: Boolean
      isActive: Boolean
    ): Food!

    deleteFood(id: ID!): Boolean!

    # Addon mutations
    createAddon(
      title: String!
      description: String
      quantityMinimum: Int
      quantityMaximum: Int
      options: [AddonOptionInput!]!
    ): Addon!

    updateAddon(
      id: ID!
      title: String
      description: String
      quantityMinimum: Int
      quantityMaximum: Int
      options: [AddonOptionInput!]
      isActive: Boolean
    ): Addon!

    deleteAddon(id: ID!): Boolean!

    # Order mutations
    placeOrder(
      restaurant: ID!
      orderInput: [OrderItemInput!]!
      paymentMethod: String!
      address: OrderAddressInput!
      tipping: Float!
      taxationAmount: Float!
      orderDate: String!
      expectedTime: String
      isPickedUp: Boolean!
      deliveryCharges: Float!
      instructions: String
    ): Order!

    # Payment mutations
    initializePayment(
      orderId: ID!
      paymentMethod: String!
      returnUrl: String
      callbackUrl: String
    ): PaymentInitResponse!

    verifyPayment(
      txRef: String!
    ): PaymentVerificationResponse!

    updatePaymentStatus(
      orderId: ID!
      paymentStatus: String!
      transactionId: String
      paymentReference: String
      metadata: JSON
    ): Order!

    updateOrderStatus(
      id: ID!
      orderStatus: String!
      reason: String
    ): Order!

    assignRider(
      id: ID!
      riderId: ID!
    ): Order!

    acceptOrderByRider(
      orderId: ID!
    ): Order!

    updateRiderLocation(
      riderId: ID!
      orderId: ID!
      location: LocationInput!
      heading: Float
    ): RiderLocationUpdateResponse!

    # Review mutations
    createReview(
      orderId: ID!
      restaurantId: ID!
      rating: Int!
      review: String
      images: [String]
      foodRating: Int
      deliveryRating: Int
      serviceRating: Int
    ): Review!

    updateReview(
      id: ID!
      rating: Int
      review: String
      images: [String]
      foodRating: Int
      deliveryRating: Int
      serviceRating: Int
    ): Review!

    deleteReview(id: ID!): Boolean!

    markReviewHelpful(
      id: ID!
      isHelpful: Boolean!
    ): Review!

    replyToReview(
      id: ID!
      message: String!
    ): Review!

    moderateReview(
      id: ID!
      isActive: Boolean!
      reason: String
    ): Review!

    # Coupon mutations
    createCoupon(
      code: String
      description: String
      discountType: String!
      discountValue: Float!
      minimumAmount: Float
      maximumDiscountAmount: Float
      usageLimit: Int
      userUsageLimit: Int
      applicableRestaurants: [ID!]
      applicableCategories: [ID!]
      applicableFoods: [ID!]
      validFrom: String!
      validUntil: String!
      isFirstTimeUser: Boolean
      daysOfWeek: [Int!]
      startTime: String
      endTime: String
    ): Coupon!

    updateCoupon(
      id: ID!
      description: String
      discountType: String
      discountValue: Float
      minimumAmount: Float
      maximumDiscountAmount: Float
      usageLimit: Int
      userUsageLimit: Int
      applicableRestaurants: [ID!]
      applicableCategories: [ID!]
      applicableFoods: [ID!]
      validFrom: String
      validUntil: String
      isActive: Boolean
      isFirstTimeUser: Boolean
      daysOfWeek: [Int!]
      startTime: String
      endTime: String
    ): Coupon!

    deleteCoupon(id: ID!): Boolean!

    applyCoupon(
      code: String!
      orderAmount: Float!
      restaurantId: ID!
    ): Coupon!

    deactivateCoupon(id: ID!): Coupon!

    duplicateCoupon(id: ID!, newCode: String): Coupon!

    toggleFavorite(foodId: ID!): User!
  }

  input OpeningTimeInput {
    day: String!
    times: [TimeSlotInput!]!
  }

  input TimeSlotInput {
    startTime: String
    endTime: String
  }

  input VariationInput {
    title: String!
    price: Float!
    discounted: Float
    addons: [ID!]
    isOutOfStock: Boolean
  }

  input AddonOptionInput {
    title: String!
    description: String
    price: Float!
    isOutOfStock: Boolean
  }

  input OrderItemInput {
    food: ID!
    title: String!
    description: String
    image: String
    quantity: Int!
    variation: VariationInput
    addons: [AddonInput!]
    specialInstructions: String
  }

  input AddonInput {
    id: ID!
    title: String!
    description: String
    quantityMinimum: Int!
    quantityMaximum: Int!
    options: [AddonOptionInput!]!
  }

  input OrderAddressInput {
    deliveryAddress: String!
    location: [Float!]!
    details: String
    label: String
  }

  input UserInput {
    phone: String
    email: String
    password: String
    name: String
    notificationToken: String
    appleId: String
    emailIsVerified: Boolean
    phoneIsVerified: Boolean
    isOrderNotification: Boolean
    isOfferNotification: Boolean
    favourite: [String]
    available: Boolean
    roles: [String]
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  type RiderLocationUpdateResponse {
    success: Boolean!
    message: String
    rider: User
  }

  input RestaurantInput {
    name: String!
    address: String!
    location: [Float!]
    phone: String
    email: String
    username: String
    password: String
    shopType: String
    cuisines: [String!]
    openingTimes: [OpeningTimeInput!]
    minimumOrder: Float
    deliveryTime: Int
    tax: Float
    commissionRate: Float
    orderPrefix: String
    slug: String
    logo: String
    image: String
    isActive: Boolean
  }

  input RestaurantProfileInput {
    _id: String!
    name: String
    address: String
    location: [Float!]
    phone: String
    email: String
    username: String
    password: String
    shopType: String
    cuisines: [String!]
    openingTimes: [OpeningTimeInput!]
    minimumOrder: Float
    deliveryTime: Int
    tax: Float
    commissionRate: Float
    orderPrefix: String
    slug: String
    logo: String
    image: String
    isActive: Boolean
    isAvailable: Boolean
  }

  # Admin-specific input types
  input CircleBoundsInput {
    radius: Float!
  }

  input BussinessDetailsInput {
    bankName: String
    accountName: String
    accountCode: String
    accountNumber: String
    bussinessRegNo: String
    companyRegNo: String
    taxRate: Float
  }

  # Field aliases for admin compatibility
  extend type User {
    userType: String!  # Alias for role
    status: String!    # Alias for isActive
  }

  extend type Restaurant {
    unique_restaurant_id: ID!  # Alias for _id
    orderId: String!          # Alias for orderPrefix
    status: String!           # Alias for isActive
  }

  extend type Order {
    status: String!           # Alias for orderStatus
  }

  # Subscription root type for real-time features
  type Subscription {
    webNotificationReceived: WebNotification!
    orderStatusUpdated(orderId: ID!): Order!
    restaurantUpdated(restaurantId: ID!): Restaurant!
    riderUpdated(riderId: ID!): User!
    riderLocationUpdated(orderId: ID!): RiderLocation!
  }

  type RiderLocation {
    orderId: ID!
    riderId: ID!
    latitude: Float!
    longitude: Float!
    speed: Float
    heading: Float
    timestamp: String!
  }
`;

module.exports = typeDefs;
