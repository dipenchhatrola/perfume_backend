const axios = require('axios');

exports.sendOTP = async (phone, otp) => {
  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        sender_id: 'PERFUM',
        message: `Your OTP for PERFUME is ${otp}. Do not share with anyone.`,
        route: 'otp',
        numbers: phone
      }
    });

    console.log('Fast2SMS Response:', response.data);
    return response.data.return === true;
  } catch (error) {
    console.error('Fast2SMS Error:', error.message);
    return false;
  }
};