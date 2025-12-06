# Requirements Document

## Introduction

This specification defines the vendor account creation, approval, and onboarding workflow for the multi-category delivery platform. The system enables administrators to create vendor accounts with pending status, allows vendors to select business categories during registration, and implements an approval workflow before vendors can fully access the platform. This ensures quality control and proper vetting of vendors before they can manage shops and products.

## Glossary

- **Admin**: A platform administrator with permissions to create, approve, and manage vendor accounts
- **Vendor**: A business owner with the "vendor" role who manages one or more shops on the platform
- **Vendor App**: The React Native mobile application used by vendors to manage their shops
- **Account Status**: The approval state of a vendor account (pending, approved, rejected)
- **Business Category**: The type of business a vendor operates (grocery, pharmacy, restaurant, etc.)
- **Owner Role**: The user role designation for vendors who own and manage shops
- **Approval Workflow**: The process by which admin reviews and approves or rejects vendor accounts
- **User Model**: The MongoDB schema representing all users including vendors
- **Shop Model**: The MongoDB schema representing vendor shops/restaurants

## Requirements

### Requirement 1

**User Story:** As an admin, I want to create vendor accounts with pending status, so that I can onboard new vendors while maintaining quality control.

#### Acceptance Criteria

1. WHEN an admin creates a vendor account THEN the system SHALL create a user with role "vendor" and isActive set to false
2. WHEN creating a vendor account THEN the system SHALL require name, email, and password fields
3. WHEN creating a vendor account THEN the system SHALL allow optional fields for phone, profile image, and business information
4. WHEN a vendor account is created THEN the system SHALL send a notification email to the vendor with account details
5. WHEN a vendor account is created with duplicate email THEN the system SHALL reject the creation and return an error message

### Requirement 2

**User Story:** As an admin, I want to view all vendor accounts with their approval status, so that I can manage pending approvals efficiently.

#### Acceptance Criteria

1. WHEN an admin views the vendors list THEN the system SHALL display all users with role "vendor"
2. WHEN displaying vendor accounts THEN the system SHALL show account status (pending/approved/rejected) based on isActive field
3. WHEN displaying vendor accounts THEN the system SHALL show associated shops count for each vendor
4. WHEN an admin filters by status THEN the system SHALL return only vendors matching the selected status
5. WHEN an admin searches vendors THEN the system SHALL filter by name, email, or business category

### Requirement 3

**User Story:** As an admin, I want to approve or reject vendor accounts, so that I can control which vendors can access the platform.

#### Acceptance Criteria

1. WHEN an admin approves a vendor account THEN the system SHALL set isActive to true
2. WHEN an admin rejects a vendor account THEN the system SHALL set isActive to false and record rejection reason
3. WHEN a vendor account is approved THEN the system SHALL send an approval notification email to the vendor
4. WHEN a vendor account is rejected THEN the system SHALL send a rejection notification email with reason to the vendor
5. WHEN an admin changes vendor status THEN the system SHALL record the admin user ID and timestamp of the action

### Requirement 4

**User Story:** As a vendor, I want to select my business category during account setup, so that my shop appears in the correct marketplace section.

#### Acceptance Criteria

1. WHEN a vendor account is created THEN the system SHALL allow selection of one or more business categories
2. WHEN selecting business categories THEN the system SHALL provide options including grocery, pharmacy, electronics, fashion, restaurant, and others
3. WHEN business categories are selected THEN the system SHALL store them in the vendor user record
4. WHEN a vendor creates a shop THEN the system SHALL default the shop category to the vendor's selected categories
5. WHEN business categories are updated THEN the system SHALL validate against the predefined category list

### Requirement 5

**User Story:** As a vendor with pending status, I want to log into the Vendor app, so that I can view my account status and prepare my shop information.

#### Acceptance Criteria

1. WHEN a vendor with pending status logs in THEN the system SHALL authenticate the credentials and return a valid token
2. WHEN a vendor with pending status accesses the app THEN the system SHALL display a pending approval message
3. WHEN a vendor with pending status attempts to create products THEN the system SHALL prevent the action and show pending status
4. WHEN a vendor with pending status attempts to create shops THEN the system SHALL prevent the action and show pending status
5. WHEN a vendor with pending status views their profile THEN the system SHALL display account status and submission date

### Requirement 9

**User Story:** As a vendor, I want a well-designed login screen with proper error handling, so that I can easily access my account.

#### Acceptance Criteria

1. WHEN a vendor enters invalid credentials THEN the system SHALL display a clear error message below the login form
2. WHEN a vendor successfully logs in THEN the system SHALL navigate to the main dashboard screen
3. WHEN a vendor login fails THEN the system SHALL keep the user on the login screen with error displayed
4. WHEN a vendor dismisses an error message THEN the system SHALL clear the error state
5. WHEN a vendor presses back on the login screen THEN the system SHALL exit the app or show confirmation dialog

### Requirement 10

**User Story:** As a vendor, I want to see my account status immediately after login, so that I understand what actions I can take.

#### Acceptance Criteria

1. WHEN a pending vendor logs in THEN the system SHALL display a status banner showing "Account Pending Approval"
2. WHEN an approved vendor logs in THEN the system SHALL display the full dashboard with all features enabled
3. WHEN a rejected vendor logs in THEN the system SHALL display rejection reason and contact information
4. WHEN a vendor's account status changes while logged in THEN the system SHALL update the UI to reflect new status
5. WHEN a pending vendor views restricted features THEN the system SHALL show informative messages explaining the restriction

### Requirement 6

**User Story:** As an approved vendor, I want full access to shop management features, so that I can manage my products and orders.

#### Acceptance Criteria

1. WHEN an approved vendor logs in THEN the system SHALL grant access to all shop management features
2. WHEN an approved vendor creates a shop THEN the system SHALL associate the shop with the vendor's user ID
3. WHEN an approved vendor accesses the dashboard THEN the system SHALL display shop analytics and order statistics
4. WHEN an approved vendor manages products THEN the system SHALL allow create, update, and delete operations
5. WHEN an approved vendor's status changes to rejected THEN the system SHALL revoke access to management features

### Requirement 7

**User Story:** As a vendor, I want to receive email notifications about my account status changes, so that I stay informed about my approval process.

#### Acceptance Criteria

1. WHEN a vendor account is created THEN the system SHALL send a welcome email with login credentials
2. WHEN a vendor account is approved THEN the system SHALL send an approval email with next steps
3. WHEN a vendor account is rejected THEN the system SHALL send a rejection email with reason and appeal instructions
4. WHEN a vendor account status changes THEN the system SHALL send the notification within 5 minutes
5. WHEN email delivery fails THEN the system SHALL log the error and retry up to 3 times

### Requirement 8

**User Story:** As an admin, I want to view vendor approval history, so that I can audit account management decisions.

#### Acceptance Criteria

1. WHEN an admin views vendor details THEN the system SHALL display approval history with timestamps
2. WHEN displaying approval history THEN the system SHALL show the admin who performed each action
3. WHEN displaying approval history THEN the system SHALL show status changes (created, approved, rejected, reactivated)
4. WHEN an admin exports vendor data THEN the system SHALL include approval history in the export
5. WHEN approval history is recorded THEN the system SHALL include reason for rejection if applicable
