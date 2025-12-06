import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      _id
      name
      email
      phone
      role
      profileImage
      vehicleType
      licenseNumber
      vehicleNumber
      available
      currentLocation {
        coordinates
      }
    }
  }
`;

export const GET_RIDER_ORDERS = gql`
  query GetRiderOrders {
    ordersByRider {
      id
      _id
      orderId
      orderStatus
      orderAmount
      deliveryCharges
      tipping
      orderDate
      expectedTime
      rider {
        id
        _id
        name
      }
      user {
        id
        name
        phone
      }
      restaurant {
        id
        name
        address
        phone
        location {
          coordinates
        }
      }
      deliveryAddress {
        deliveryAddress
        details
        location {
          coordinates
        }
      }
      items {
        id
        food {
          title
          image
        }
        quantity
      }
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      _id
      orderId
      orderStatus
      orderAmount
      deliveryCharges
      tipping
      taxationAmount
      orderDate
      expectedTime
      acceptedAt
      pickedAt
      deliveredAt
      user {
        id
        name
        phone
      }
      restaurant {
        id
        name
        address
        phone
        location {
          coordinates
        }
      }
      deliveryAddress {
        deliveryAddress
        details
        label
        location {
          coordinates
        }
      }
      items {
        id
        food {
          title
          image
        }
        quantity
        variation {
          title
          price
        }
      }
      instructions
    }
  }
`;

// Subscription for real-time order updates
export const ORDER_STATUS_UPDATED = gql`
  subscription OrderStatusUpdated($orderId: ID!) {
    orderStatusUpdated(orderId: $orderId) {
      id
      _id
      orderStatus
      acceptedAt
      pickedAt
      deliveredAt
    }
  }
`;
