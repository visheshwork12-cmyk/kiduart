const responseFormatter = (success, data, message, code) => ({
    success,
    data,
    message,
    code,
  });
  
  export default responseFormatter;