/**
 * Safely format dates with fallback for invalid dates
 */

export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';

  try {
    let date;

    // Handle Date object
    if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Handle timestamp number
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Handle string
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    }
    else {
      return 'N/A';
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return 'N/A';

  try {
    let date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
};

export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'Just now';

  try {
    let date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Just now';
    }

    if (isNaN(date.getTime())) {
      return 'Just now';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    return 'Just now';
  }
};

export const formatTime = (dateInput) => {
  if (!dateInput) return 'N/A';

  try {
    let date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'N/A';
    }

    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
};
