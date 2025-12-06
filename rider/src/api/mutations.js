import { gql } from '@apollo/client';

export const LOGIN_RIDER = gql`
  mutation LoginRider($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      userId
      token
      name
      email
      phone
      userTypeId
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $orderStatus: String!, $reason: String) {
    updateOrderStatus(id: $id, orderStatus: $orderStatus, reason: $reason) {
      id
      _id
      orderStatus
      acceptedAt
      pickedAt
      deliveredAt
    }
  }
`;

export const UPDATE_RIDER_LOCATION = gql`
  mutation UpdateRiderLocation($riderId: ID!, $orderId: ID!, $location: LocationInput!, $heading: Float) {
    updateRiderLocation(riderId: $riderId, orderId: $orderId, location: $location, heading: $heading) {
      success
      message
      rider {
        id
        currentLocation {
          coordinates
        }
        heading
      }
    }
  }
`;

export const UPDATE_RIDER_AVAILABILITY = gql`
  mutation UpdateRiderAvailability($id: ID!, $available: Boolean!) {
    updateUser(id: $id, userInput: { available: $available }) {
      id
      available
    }
  }
`;

export const ACCEPT_ORDER_BY_RIDER = gql`
  mutation AcceptOrderByRider($orderId: ID!) {
    acceptOrderByRider(orderId: $orderId) {
      id
      _id
      orderId
      orderStatus
      acceptedAt
      assignedAt
      rider {
        id
        _id
        name
        phone
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
        title
        quantity
        image
        food {
          title
          image
        }
      }
      orderAmount
      deliveryCharges
      tipping
    }
  }
`;

// Note: Reject simply hides the order from this rider's view
// The order remains "pending" for other riders to accept
