import { gql } from '@apollo/client';

// Authentication mutations
export const REGISTER_USER = gql`
  mutation RegisterUser(
    $name: String!
    $email: String!
    $phone: String
    $password: String!
    $role: String
  ) {
    register(
      name: $name
      email: $email
      phone: $phone
      password: $password
      role: $role
    ) {
      userId
      token
      tokenExpiration
      name
      phone
      phoneIsVerified
      email
      emailIsVerified
      picture
      isNewUser
      userTypeId
      isActive
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser(
    $email: String!
    $password: String!
    $type: String
    $name: String
    $notificationToken: String
    $isActive: Boolean
  ) {
    login(
      email: $email
      password: $password
      type: $type
      name: $name
      notificationToken: $notificationToken
      isActive: $isActive
    ) {
      userId
      token
      tokenExpiration
      name
      phone
      phoneIsVerified
      email
      emailIsVerified
      picture
      isNewUser
      userTypeId
      isActive
    }
  }
`;

export const SEND_OTP_EMAIL = gql`
  mutation SendOtpEmail($email: String!) {
    sendOtpToEmail(email: $email) {
      result
    }
  }
`;

export const SEND_OTP_PHONE = gql`
  mutation SendOtpPhone($phone: String!) {
    sendOtpToPhoneNumber(phone: $phone) {
      result
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($otp: String!, $email: String, $phone: String) {
    verifyOtp(otp: $otp, email: $email, phone: $phone) {
      result
    }
  }
`;

// Order mutations
export const PLACE_ORDER = gql`
  mutation PlaceOrder(
    $restaurant: ID!
    $orderInput: [OrderItemInput!]!
    $paymentMethod: String!
    $address: OrderAddressInput!
    $tipping: Float!
    $taxationAmount: Float!
    $orderDate: String!
    $expectedTime: String
    $isPickedUp: Boolean!
    $deliveryCharges: Float!
    $instructions: String
  ) {
    placeOrder(
      restaurant: $restaurant
      orderInput: $orderInput
      paymentMethod: $paymentMethod
      address: $address
      tipping: $tipping
      taxationAmount: $taxationAmount
      orderDate: $orderDate
      expectedTime: $expectedTime
      isPickedUp: $isPickedUp
      deliveryCharges: $deliveryCharges
      instructions: $instructions
    ) {
      id
      _id
      orderId
      orderStatus
      orderAmount
      deliveryCharges
      taxationAmount
      tipping
      orderDate
      createdAt
      expectedTime
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

// Review mutations
export const CREATE_REVIEW = gql`
  mutation CreateReview(
    $orderId: ID!
    $restaurantId: ID!
    $rating: Int!
    $review: String
    $images: [String]
    $foodRating: Int
    $deliveryRating: Int
    $serviceRating: Int
  ) {
    createReview(
      orderId: $orderId
      restaurantId: $restaurantId
      rating: $rating
      review: $review
      images: $images
      foodRating: $foodRating
      deliveryRating: $deliveryRating
      serviceRating: $serviceRating
    ) {
      id
      _id
      rating
      review
      images
      foodRating
      deliveryRating
      serviceRating
      isVerified
      createdAt
    }
  }
`;

// Coupon mutations
export const APPLY_COUPON = gql`
  mutation ApplyCoupon(
    $code: String!
    $orderAmount: Float!
    $restaurantId: ID!
  ) {
    applyCoupon(
      code: $code
      orderAmount: $orderAmount
      restaurantId: $restaurantId
    ) {
      id
      _id
      code
      description
      discountType
      discountValue
      discountAmount
    }
  }
`;

// User mutations
export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $userInput: UserInput!) {
    updateUser(id: $id, userInput: $userInput) {
      id
      _id
      name
      email
      phone
      profileImage
      phoneIsVerified
      emailIsVerified
      isOrderNotification
      isOfferNotification
    }
  }
`;

// Payment mutations
export const INITIALIZE_PAYMENT = gql`
  mutation InitializePayment(
    $orderId: ID!
    $paymentMethod: String!
    $returnUrl: String
    $callbackUrl: String
  ) {
    initializePayment(
      orderId: $orderId
      paymentMethod: $paymentMethod
      returnUrl: $returnUrl
      callbackUrl: $callbackUrl
    ) {
      success
      checkoutUrl
      txRef
      error
      orderId
    }
  }
`;

export const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($txRef: String!) {
    verifyPayment(txRef: $txRef) {
      success
      status
      amount
      currency
      txRef
      error
      order {
        id
        _id
        orderId
        orderStatus
        paymentStatus
        paymentTransactionId
        orderAmount
        paidAmount
      }
    }
  }
`;

export const UPDATE_PAYMENT_STATUS = gql`
  mutation UpdatePaymentStatus(
    $orderId: ID!
    $paymentStatus: String!
    $transactionId: String
    $paymentReference: String
    $metadata: JSON
  ) {
    updatePaymentStatus(
      orderId: $orderId
      paymentStatus: $paymentStatus
      transactionId: $transactionId
      paymentReference: $paymentReference
      metadata: $metadata
    ) {
      id
      _id
      orderId
      paymentStatus
      paymentTransactionId
      paymentReference
      orderAmount
      paidAmount
    }
  }
`;

