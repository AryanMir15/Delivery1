import { gql } from '@apollo/client';

export const OWNER_LOGIN = gql`
  mutation OwnerLogin($email: String!, $password: String!) {
    ownerLogin(email: $email, password: $password) {
      userId
      token
      email
      userType
      restaurants {
        _id
        name
        image
        address
      }
      name
      image
    }
  }
`;

export const GET_RESTAURANTS_BY_OWNER = gql`
  query RestaurantsByOwner {
    restaurantsByOwner {
      _id
      name
      image
      logo
      address
      phone
      email
      shopType
      isActive
      isAvailable
      rating
      reviewCount
      minimumOrder
      deliveryTime
      tax
    }
  }
`;

export const GET_ORDERS_BY_RESTAURANT = gql`
  query OrdersByRestaurant($restaurant: ID!) {
    ordersByRestaurant(restaurant: $restaurant) {
      _id
      orderId
      orderStatus
      orderAmount
      paidAmount
      deliveryCharges
      taxationAmount
      tipping
      orderDate
      expectedTime
      acceptedAt
      pickedAt
      deliveredAt
      paymentMethod
      paymentStatus
      instructions
      user {
        _id
        name
        phone
        email
      }
      items {
        _id
        title
        description
        image
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
      deliveryAddress {
        deliveryAddress
        details
        label
      }
      rider {
        _id
        name
        phone
        vehicleType
      }
    }
  }
`;

export const GET_FOODS = gql`
  query Foods($restaurant: ID!) {
    foods(restaurant: $restaurant) {
      id
      _id
      title
      description
      image
      isOutOfStock
      isActive
      subCategory
      category {
        _id
        title
      }
      variations {
        id
        title
        price
        discounted
        isOutOfStock
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query Categories {
    categories {
      _id
      title
      description
      image
    }
  }
`;

export const GET_ADDONS = gql`
  query Addons {
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
`;
