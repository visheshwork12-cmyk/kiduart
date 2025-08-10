interface Token {
    token: string;
    user: string;
    type: 'access' | 'refresh' | 'resetPassword';
    expires: Date;
    blacklisted: boolean;
  }