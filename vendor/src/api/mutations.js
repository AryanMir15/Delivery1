import { gql } from '@apollo/client';

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $orderStatus: String!, $reason: String) {
    updateOrderStatus(id: $id, orderStatus: $orderStatus, reason: $reason) {
      _id
      orderId
      orderStatus
      acceptedAt
      pickedAt
      deliveredAt
      cancelledAt
    }
  }
`;

export const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurant(
    $id: ID!
    $name: String
    $address: String
    $phone: String
    $email: String
    $isAvailable: Boolean
    $minimumOrder: Float
    $deliveryTime: Int
    $tax: Float
  ) {
    updateRestaurant(
      id: $id
      name: $name
      address: $address
      phone: $phone
      email: $email
      isAvailable: $isAvailable
      minimumOrder: $minimumOrder
      deliveryTime: $deliveryTime
      tax: $tax
    ) {
      _id
      name
      isAvailable
    }
  }
`;

export const CREATE_FOOD = gql`
  mutation CreateFood(
    $title: String!
    $description: String
    $image: String
    $category: ID!
    $restaurant: ID!
    $variations: [VariationInput!]
    $subCategory: String
  ) {
    createFood(
      title: $title
      description: $description
      image: $image
      category: $category
      restaurant: $restaurant
      variations: $variations
      subCategory: $subCategory
    ) {
      id
      _id
      title
      description
      image
    }
  }
`;

export const UPDATE_FOOD = gql`
  mutation UpdateFood(
    $id: ID!
    $title: String
    $description: String
    $image: String
    $category: ID
    $variations: [VariationInput!]
    $subCategory: String
    $isOutOfStock: Boolean
    $isActive: Boolean
  ) {
    updateFood(
      id: $id
      title: $title
      description: $description
      image: $image
      category: $category
      variations: $variations
      subCategory: $subCategory
      isOutOfStock: $isOutOfStock
      isActive: $isActive
    ) {
      id
      _id
      title
      isOutOfStock
      isActive
    }
  }
`;

export const DELETE_FOOD = gql`
  mutation DeleteFood($id: ID!) {
    deleteFood(id: $id)
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation UploadImageToS3($image: String!) {
    uploadImageToS3(image: $image) {
      imageUrl
    }
  }
`;
