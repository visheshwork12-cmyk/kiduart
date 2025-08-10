interface User {
    _id: string;
    email: string;
    name: string;
    role: 'superadmin' | 'admin';
    phone?: string;
    address?: string;
    state?: string;
    country?: string;
    city?: string;
    zipcode?: string;
    profilePhoto?: string;
  }